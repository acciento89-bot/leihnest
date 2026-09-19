import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import sharp from "sharp";

const testURL = process.env.LEIHNEST_TEST_DATABASE_URL;
const schema = `media_billing_${crypto.randomUUID().replaceAll("-", "")}`;
let PNG:Buffer;
let admin: Pool;
let client: PrismaClient;
let uploads:string;
let media:typeof import("@/features/media/media-service");

beforeAll(async () => {
  if (!testURL) return;
  admin = new Pool({ connectionString: testURL, max: 4 });
  await admin.query(`CREATE SCHEMA "${schema}"`);
  await admin.query(`SET search_path TO "${schema}"`);
  for (const migration of [
    "prisma/migrations/20260917223500_init/migration.sql",
    "prisma/migrations/20260919_media_billing/migration.sql",
  ]) {
    await admin.query(await readFile(migration, "utf8"));
  }
  client = new PrismaClient({ adapter: new PrismaPg(admin, { schema, disposeExternalPool: false }) });
  uploads=await mkdtemp(join(tmpdir(),"leihnest-release-media-"));
  PNG=await sharp({create:{width:2,height:2,channels:3,background:{r:32,g:96,b:64}}}).png().toBuffer();
  process.env.UPLOADS_DIR=uploads;
  vi.doMock("@/lib/db",()=>({db:client}));
  media=await import("@/features/media/media-service");
}, 20000);

afterAll(async () => {
  vi.doUnmock("@/lib/db");
  delete process.env.UPLOADS_DIR;
  if (client) await client.$disconnect();
  if (admin) {
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
  if(uploads)await rm(uploads,{recursive:true,force:true});
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

  it("serializes concurrent Free uploads so only one item image can be created",async()=>{
    await client.user.createMany({data:[
      {id:"free-owner",name:"Free Owner",email:"free-owner@leihnest.test"},
      {id:"free-member",name:"Free Member",email:"free-member@leihnest.test"},
    ]});
    const group=await client.group.create({data:{name:"Free group",slug:"free-group",memberships:{create:[
      {userId:"free-owner",role:"OWNER"},{userId:"free-member",role:"MEMBER"},
    ]}}});
    const item=await client.item.create({data:{groupId:group.id,createdByUserId:"free-owner",name:"Gazebo",totalQuantity:1}});

    const results=await Promise.allSettled([
      media.uploadItemImage(group.id,item.id,"free-owner",PNG),
      media.uploadItemImage(group.id,item.id,"free-owner",PNG),
    ]);
    expect(results.filter(result=>result.status==="fulfilled")).toHaveLength(1);
    expect(results.filter(result=>result.status==="rejected")).toHaveLength(1);
    expect(await client.mediaAsset.count({where:{itemId:item.id,kind:"ITEM"}})).toBe(1);

    const asset=await client.mediaAsset.findFirstOrThrow({where:{itemId:item.id}});
    await expect(media.getAuthorizedMedia(asset.id,"free-member")).resolves.toMatchObject({id:asset.id});
    await client.membership.delete({where:{groupId_userId:{groupId:group.id,userId:"free-member"}}});
    await expect(media.getAuthorizedMedia(asset.id,"free-member")).rejects.toThrow("NOT_FOUND");
  });

  it("enforces five item images for a paid group",async()=>{
    const group=await client.group.findUniqueOrThrow({where:{slug:"release-group"}});
    const item=await client.item.findFirstOrThrow({where:{groupId:group.id}});
    for(let index=0;index<4;index++)await media.uploadItemImage(group.id,item.id,"release-owner",PNG);
    expect(await client.mediaAsset.count({where:{itemId:item.id,kind:"ITEM"}})).toBe(5);
    await expect(media.uploadItemImage(group.id,item.id,"release-owner",PNG)).rejects.toThrow("IMAGE_LIMIT");
  });
});
