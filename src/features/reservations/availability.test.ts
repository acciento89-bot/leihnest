import { describe, expect, it } from "vitest";
import { rangesOverlap, remainingQuantity, type CommittedReservation } from "./availability";

const at = (hour: number) => new Date(`2026-09-20T${String(hour).padStart(2, "0")}:00:00Z`);

describe("rangesOverlap", () => {
  it("does not overlap adjacent ranges", () => expect(rangesOverlap(at(10), at(12), at(12), at(14))).toBe(false));
  it("detects intersecting ranges", () => expect(rangesOverlap(at(10), at(13), at(12), at(14))).toBe(true));
});

describe("remainingQuantity", () => {
  const reservations: CommittedReservation[] = [
    { startsAt: at(9), endsAt: at(13), quantity: 2, status: "APPROVED" },
    { startsAt: at(11), endsAt: at(15), quantity: 1, status: "HANDED_OUT" },
    { startsAt: at(11), endsAt: at(15), quantity: 5, status: "PENDING" },
    { startsAt: at(11), endsAt: at(15), quantity: 5, status: "RETURNED" },
  ];

  it("subtracts only overlapping committed quantities", () => {
    expect(remainingQuantity(6, reservations, { startsAt: at(12), endsAt: at(14) })).toBe(3);
  });
});
