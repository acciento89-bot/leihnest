import { db } from "@/lib/db";
import { reservationInputSchema } from "./reservation-schema";
import { canManageReservations, type GroupRole } from "@/features/groups/permissions";

async function membership(groupId: string, userId: string) { const m = await db.membership.findUnique({ where: { groupId_userId: { groupId, userId } } }); if (!m) throw new Error("FORBIDDEN"); return m; }
async function manager(groupId: string, userId: string) { const m = await membership(groupId, userId); if (!canManageReservations(m.role as GroupRole)) throw new Error("FORBIDDEN"); }

export async function createReservation(groupId: string, userId: string, input: unknown) {
  await membership(groupId, userId); const d = reservationInputSchema.parse(input); const item = await db.item.findFirst({ where: { id: d.itemId, groupId, active: true } }); if (!item || d.quantity > item.totalQuantity) throw new Error("NOT_AVAILABLE");
  return db.reservation.create({ data: { groupId, itemId: item.id, userId, quantity: d.quantity, startsAt: d.startsAt, endsAt: d.endsAt, purpose: d.purpose || null } });
}
export async function approveReservation(groupId: string, actorId: string, reservationId: string) {
  await manager(groupId, actorId);
  return db.$transaction(async (tx) => { const r = await tx.reservation.findFirst({ where: { id: reservationId, groupId, status: "PENDING" }, include: { item: true } }); if (!r) throw new Error("INVALID_STATE"); const committed = await tx.reservation.aggregate({ _sum: { quantity: true }, where: { itemId: r.itemId, id: { not: r.id }, status: { in: ["APPROVED", "HANDED_OUT"] }, startsAt: { lt: r.endsAt }, endsAt: { gt: r.startsAt } } }); if ((committed._sum.quantity ?? 0) + r.quantity > r.item.totalQuantity) throw new Error("NOT_AVAILABLE"); return tx.reservation.update({ where: { id: r.id }, data: { status: "APPROVED", approvedAt: new Date(), approvedById: actorId } }); });
}
export async function transitionReservation(groupId: string, actorId: string, reservationId: string, action: "reject"|"handover"|"return") { await manager(groupId, actorId); const current = await db.reservation.findFirst({ where: { id: reservationId, groupId } }); if (!current) throw new Error("INVALID_STATE"); const map = { reject: ["PENDING", "REJECTED"], handover: ["APPROVED", "HANDED_OUT"], return: ["HANDED_OUT", "RETURNED"] } as const; const [from,to] = map[action]; if (current.status !== from) throw new Error("INVALID_STATE"); return db.reservation.update({ where: { id: current.id }, data: { status: to, ...(action === "handover" ? { handedOutAt: new Date() } : {}), ...(action === "return" ? { returnedAt: new Date() } : {}) } }); }
export async function cancelReservation(groupId: string, userId: string, reservationId: string) { const r = await db.reservation.findFirst({ where: { id: reservationId, groupId, userId, status: { in: ["PENDING", "APPROVED"] } } }); if (!r) throw new Error("FORBIDDEN"); return db.reservation.update({ where: { id: r.id }, data: { status: "CANCELLED" } }); }
