import type { ReservationStatus } from "./availability";

const transitions: Record<ReservationStatus, readonly ReservationStatus[]> = {
  PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["HANDED_OUT", "CANCELLED"],
  REJECTED: [],
  HANDED_OUT: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus) {
  return transitions[from].includes(to);
}
