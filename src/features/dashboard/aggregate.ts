type DashboardReservation = {
  status: string;
  endsAt: Date;
};

export function aggregateDashboard(
  reservations: DashboardReservation[],
  now = new Date(),
) {
  const dueSoonLimit = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  return reservations.reduce(
    (totals, reservation) => {
      if (reservation.status === "PENDING") totals.pending += 1;

      if (reservation.status === "HANDED_OUT") {
        totals.borrowed += 1;
        if (reservation.endsAt < now) totals.overdue += 1;
        else if (reservation.endsAt <= dueSoonLimit) totals.dueSoon += 1;
      }

      return totals;
    },
    { pending: 0, borrowed: 0, overdue: 0, dueSoon: 0 },
  );
}
