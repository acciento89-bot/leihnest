import { db } from "@/lib/db";
import { reservationInputSchema, returnNoteSchema } from "./reservation-schema";
import { canManageReservations, type GroupRole } from "@/features/groups/permissions";

async function membership(groupId: string, userId: string) {
  const result = await db.membership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!result) throw new Error("FORBIDDEN");
  return result;
}

async function manager(groupId: string, userId: string) {
  const result = await membership(groupId, userId);
  if (!canManageReservations(result.role as GroupRole)) {
    throw new Error("FORBIDDEN");
  }
}

export async function createReservation(groupId: string, userId: string, input: unknown) {
  await membership(groupId, userId);
  const data = reservationInputSchema.parse(input);
  const item = await db.item.findFirst({
    where: { id: data.itemId, groupId, active: true },
  });

  if (!item || data.quantity > item.totalQuantity) {
    throw new Error("NOT_AVAILABLE");
  }

  return db.reservation.create({
    data: {
      groupId,
      itemId: item.id,
      userId,
      quantity: data.quantity,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      purpose: data.purpose || null,
    },
  });
}

export async function approveReservation(
  groupId: string,
  actorId: string,
  reservationId: string
) {
  await manager(groupId, actorId);

  return db.$transaction(async (tx) => {
    const reservation = await tx.reservation.findFirst({
      where: { id: reservationId, groupId, status: "PENDING" },
      include: { item: true },
    });

    if (!reservation) throw new Error("INVALID_STATE");

    const committed = await tx.reservation.aggregate({
      _sum: { quantity: true },
      where: {
        itemId: reservation.itemId,
        id: { not: reservation.id },
        status: { in: ["APPROVED", "HANDED_OUT"] },
        startsAt: { lt: reservation.endsAt },
        endsAt: { gt: reservation.startsAt },
      },
    });

    if ((committed._sum.quantity ?? 0) + reservation.quantity > reservation.item.totalQuantity) {
      throw new Error("NOT_AVAILABLE");
    }

    return tx.reservation.update({
      where: { id: reservation.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: actorId,
      },
    });
  });
}

export async function transitionReservation(
  groupId: string,
  actorId: string,
  reservationId: string,
  action: "reject" | "handover" | "return",
  returnNote?: unknown
) {
  await manager(groupId, actorId);

  const current = await db.reservation.findFirst({
    where: { id: reservationId, groupId },
  });
  if (!current) throw new Error("INVALID_STATE");

  const transitions = {
    reject: ["PENDING", "REJECTED"],
    handover: ["APPROVED", "HANDED_OUT"],
    return: ["HANDED_OUT", "RETURNED"],
  } as const;

  const [from, to] = transitions[action];
  if (current.status !== from) throw new Error("INVALID_STATE");

  const note = action === "return" ? returnNoteSchema.parse(String(returnNote ?? "")) : undefined;

  return db.reservation.update({
    where: { id: current.id },
    data: {
      status: to,
      ...(action === "handover" ? { handedOutAt: new Date() } : {}),
      ...(action === "return" ? { returnedAt: new Date(), returnNote: note } : {}),
    },
  });
}

export async function cancelReservation(
  groupId: string,
  userId: string,
  reservationId: string
) {
  const reservation = await db.reservation.findFirst({
    where: {
      id: reservationId,
      groupId,
      userId,
      status: { in: ["PENDING", "APPROVED"] },
    },
  });

  if (!reservation) throw new Error("FORBIDDEN");

  return db.reservation.update({
    where: { id: reservation.id },
    data: { status: "CANCELLED" },
  });
}
