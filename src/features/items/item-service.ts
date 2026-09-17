import { db } from "@/lib/db";
import { canManageInventory, type GroupRole } from "@/features/groups/permissions";
import { itemInputSchema } from "./item-schema";
async function manager(groupId: string, userId: string) { const m = await db.membership.findUnique({ where: { groupId_userId: { groupId, userId } } }); if (!m || !canManageInventory(m.role as GroupRole)) throw new Error("FORBIDDEN"); return m; }
export async function createItem(groupId: string, userId: string, input: unknown) { await manager(groupId, userId); const d = itemInputSchema.parse(input); return db.item.create({ data: { groupId, createdByUserId: userId, name: d.name, description: d.description || null, location: d.location || null, totalQuantity: d.totalQuantity } }); }
export async function archiveItem(groupId: string, userId: string, itemId: string) { await manager(groupId, userId); return db.item.update({ where: { id: itemId, groupId }, data: { active: false } }); }
