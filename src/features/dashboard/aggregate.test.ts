import { describe, expect, it } from "vitest";
import { aggregateDashboard } from "./aggregate";

describe("aggregateDashboard", () => {
  it("counts pending, borrowed, overdue and due-soon reservations", () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    const result = aggregateDashboard([
      { status: "PENDING", endsAt: new Date("2026-09-20T12:00:00.000Z") },
      { status: "HANDED_OUT", endsAt: new Date("2026-09-18T11:00:00.000Z") },
      { status: "HANDED_OUT", endsAt: new Date("2026-09-19T11:00:00.000Z") },
      { status: "RETURNED", endsAt: new Date("2026-09-18T10:00:00.000Z") },
    ], now);

    expect(result).toEqual({ pending: 1, borrowed: 2, overdue: 1, dueSoon: 1 });
  });
});
