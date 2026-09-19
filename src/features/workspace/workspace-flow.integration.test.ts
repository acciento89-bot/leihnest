import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

let admin: Pool;
const testURL = process.env.LEIHNEST_TEST_DATABASE_URL;
const schema = `workspace_test_${crypto.randomUUID().replaceAll("-", "")}`;
let client: PrismaClient;
let groupId: string;
let itemId: string;
let items: typeof import("@/features/items/item-service");
let reservations: typeof import("@/features/reservations/reservation-service");
const ownerId = "integration-owner";
const memberId = "integration-member";
const outsiderId = "integration-outsider";

beforeAll(async () => {
  if (!testURL) return;
  // An explicit test URL is required. Production DATABASE_URL is never used.
  // Every run owns a new schema; cleanup only drops that generated schema.
  admin = new Pool({ connectionString: testURL, max: 1 });
  await admin.query(`CREATE SCHEMA "${schema}"`);
  await admin.query(`SET search_path TO "${schema}"`);
  await admin.query(await readFile("prisma/migrations/20260917223500_init/migration.sql", "utf8"));
  client = new PrismaClient({ adapter: new PrismaPg(admin, { schema, disposeExternalPool: false }) });
  vi.doMock("@/lib/db", () => ({ db: client }));
  items = await import("@/features/items/item-service");
  reservations = await import("@/features/reservations/reservation-service");
  await client.user.createMany({ data: [
    { id: ownerId, name: "Owner", email: "owner@leihnest.test" },
    { id: memberId, name: "Member", email: "member@leihnest.test" },
    { id: outsiderId, name: "Outsider", email: "outsider@leihnest.test" },
  ] });
  const group = await client.group.create({ data: {
    name: "Integration group", slug: "integration-group",
    memberships: { create: [{ userId: ownerId, role: "OWNER" }, { userId: memberId, role: "MEMBER" }] },
  } });
  groupId = group.id;
  itemId = (await items.createItem(groupId, ownerId, {
    name: "Shared projector", totalQuantity: 2, description: "With HDMI cable", location: "Clubhouse",
  })).id;
}, 20000);

afterAll(async () => {
  if (client) await client.$disconnect();
  if (admin) { await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.end(); }
  vi.doUnmock("@/lib/db");
});

function request(quantity = 1) {
  return { itemId, quantity, startsAt: "2030-05-01T08:00:00Z", endsAt: "2030-05-02T16:00:00Z", purpose: "Community event" };
}

describe.skipIf(!testURL)("persisted borrowing workflow", () => {
  it("completes request, approval, handover and return without losing history", async () => {
    const row = await reservations.createReservation(groupId, memberId, request());
    expect(row.status).toBe("PENDING");
    expect((await reservations.approveReservation(groupId, ownerId, row.id)).status).toBe("APPROVED");
    expect((await reservations.transitionReservation(groupId, ownerId, row.id, "handover")).status).toBe("HANDED_OUT");
    await reservations.transitionReservation(groupId, ownerId, row.id, "return", "Complete and undamaged");
    const persisted = await client.reservation.findUniqueOrThrow({ where: { id: row.id } });
    expect(persisted.status).toBe("RETURNED");
    expect(persisted.returnNote).toBe("Complete and undamaged");
    expect(persisted.returnedAt).toBeInstanceOf(Date);
    expect(persisted.handedOutAt).toBeInstanceOf(Date);
    await expect(reservations.transitionReservation(groupId, ownerId, row.id, "return")).rejects.toThrow("INVALID_STATE");
  });

  it("rejects inventory changes and approvals by ordinary members", async () => {
    await expect(items.createItem(groupId, memberId, { name: "Not allowed", totalQuantity: 1 })).rejects.toThrow("FORBIDDEN");
    const row = await reservations.createReservation(groupId, memberId, request());
    await expect(reservations.approveReservation(groupId, memberId, row.id)).rejects.toThrow("FORBIDDEN");
    await reservations.cancelReservation(groupId, memberId, row.id);
    expect((await client.reservation.findUniqueOrThrow({ where: { id: row.id } })).status).toBe("CANCELLED");
  });

  it("prevents outsiders from reserving another group's inventory", async () => {
    await expect(reservations.createReservation(groupId, outsiderId, request())).rejects.toThrow("FORBIDDEN");
  });

  it("does not approve more overlapping inventory than the group owns", async () => {
    await expect(reservations.createReservation(groupId, memberId, request(3))).rejects.toThrow("NOT_AVAILABLE");
    const first = await reservations.createReservation(groupId, memberId, request(2));
    const second = await reservations.createReservation(groupId, memberId, request(1));
    await reservations.approveReservation(groupId, ownerId, first.id);
    await expect(reservations.approveReservation(groupId, ownerId, second.id)).rejects.toThrow("NOT_AVAILABLE");
    await reservations.cancelReservation(groupId, memberId, first.id);
    await reservations.cancelReservation(groupId, memberId, second.id);
  });

  it("keeps existing reservations when an item is archived", async () => {
    const count = await client.reservation.count({ where: { itemId } });
    await items.archiveItem(groupId, ownerId, itemId);
    expect((await client.item.findUniqueOrThrow({ where: { id: itemId } })).active).toBe(false);
    expect(await client.reservation.count({ where: { itemId } })).toBe(count);
    expect(await client.reservation.count({ where: { itemId, status: "RETURNED" } })).toBe(1);
    await expect(reservations.createReservation(groupId, memberId, request())).rejects.toThrow("NOT_AVAILABLE");
  });
});
