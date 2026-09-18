import { db } from "@/lib/db";
import { groupInputSchema, slugifyGroupName } from "./group-schema";
export async function createGroupForUser(input: unknown, userId: string) {
  const data = groupInputSchema.parse(input);
  const slug = `${slugifyGroupName(data.name)}-${crypto.randomUUID().slice(0, 6)}`;
  return db.group.create({ data: { name: data.name, slug, memberships: { create: { userId, role: "OWNER" } } } });
}
export async function getPrimaryMembership(userId: string) {
  return db.membership.findFirst({ where: { userId }, include: { group: true }, orderBy: { createdAt: "asc" } });
}
