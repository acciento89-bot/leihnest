export type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED" | "HANDED_OUT" | "RETURNED" | "CANCELLED";

export type CommittedReservation = {
  startsAt: Date;
  endsAt: Date;
  quantity: number;
  status: ReservationStatus;
};

export type DateRange = { startsAt: Date; endsAt: Date };

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function remainingQuantity(total: number, reservations: CommittedReservation[], proposed: DateRange) {
  const committed = reservations
    .filter((reservation) => reservation.status === "APPROVED" || reservation.status === "HANDED_OUT")
    .filter((reservation) => rangesOverlap(reservation.startsAt, reservation.endsAt, proposed.startsAt, proposed.endsAt))
    .reduce((sum, reservation) => sum + reservation.quantity, 0);

  return Math.max(0, total - committed);
}
