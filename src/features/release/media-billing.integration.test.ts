import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const testURL = process.env.LEIHNEST_TEST_DATABASE_URL;
const schema = `media_billing_${crypto.randomUUID().replaceAll("-", "")}`;
let admin: Pool;
let client: PrismaClient;

beforeAll(async () => {
  if (!testURL) return;
  admin = new Pool({ connectionString: testURL, max: 1 });
  await admin.query(`CREATE SCHEMA "${schema}"`);
  await admin.query(`SET search_path TO "${schema}"`);
  for (const migration of [
    "prisma/migrations/20260917223500_init/migration.sql",
    "prisma/migrations/20260919_media_billing/migration.sql",
  ]) {
    await admin.query(await readFile(migration, "utf8"));
  }
  client = new PrismaClient({ adapter: new PrismaPg(admin, { schema, disposeExternalPool: false }) });
}, 20000);

afterAll(async () => {
  if (client) await client.$disconnect();
  if (admin) {
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});

describe.skipIf(!testURL)("media and billing persistence", () => {
  it("persists a group subscription and related item media", async () => {
    await client.user.create({ data: { id: "release-owner", name: "Owner", email: "release-owner@leihnest.test" } });
    const group = await client.group.create({
      data: {
        name: "Release group",
        slug: "release-group",
        memberships: { create: { userId: "release-owner", role: "OWNER" } },
      },
    });
    const item = await client.item.create({
      data: {
        groupId: group.id,
        createdByUserId: "release-owner",
        name: "Projector",
        totalQuantity: 1,
      },
    });
    await client.groupSubscription.create({
      data: {
        groupId: group.id,
        stripeCustomerId: "cus_release",
        stripeSubscriptionId: "sub_release",
        stripePriceId: "price_release",
        interval: "MONTH",
        status: "active",
        currentPeriodEnd: new Date("2030-01-01T00:00:00Z"),
      },
    });
    await client.mediaAsset.create({
      data: {
        kind: "ITEM",
        storageKey: "11111111-1111-4111-8111-111111111111",
        sourceBytes: 1024,
        sourceWidth: 800,
        sourceHeight: 600,
        itemId: item.id,
      },
    });

    const persisted = await client.group.findUniqueOrThrow({
      where: { id: group.id },
      include: { subscription: true, items: { include: { media: true } } },
    });

    expect(persisted.subscription?.stripeSubscriptionId).toBe("sub_release");
    expect(persisted.items[0].media[0].storageKey).toBe("11111111-1111-4111-8111-111111111111");
  });
});
