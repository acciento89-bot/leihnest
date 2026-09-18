import { db } from "@/lib/db";
import { canManageInventory, type GroupRole } from "@/features/groups/permissions";
import { itemInputSchema } from "./item-schema";

async function manager(groupId: string, userId: string) {
  const membership = await db.membership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership || !canManageInventory(membership.role as GroupRole)) {
    throw new Error("FORBIDDEN");
  }

  return membership;
}

export async function createItem(groupId: string, userId: string, input: unknown) {
  await manager(groupId, userId);
  const data = itemInputSchema.parse(input);

  return db.item.create({
    data: {
      groupId,
      createdByUserId: userId,
      name: data.name,
      description: data.description || null,
      location: data.location || null,
      totalQuantity: data.totalQuantity,
    },
  });
}

export async function updateItem(
  groupId: string,
  userId: string,
  itemId: string,
  input: unknown,
) {
  await manager(groupId, userId);
  const data = itemInputSchema.parse(input);

  return db.item.update({
    where: { id: itemId, groupId },
    data: {
      name: data.name,
      description: data.description || null,
      location: data.location || null,
      totalQuantity: data.totalQuantity,
    },
  });
}

export async function archiveItem(groupId: string, userId: string, itemId: string) {
  await manager(groupId, userId);

  return db.item.update({
    where: { id: itemId, groupId },
    data: { active: false },
  });
}
