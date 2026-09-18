import { describe, expect, it } from "vitest";
import { reservationInputSchema } from "./reservation-schema";
describe("reservation input", () => {
  it("rejects reversed dates and zero quantity", () => expect(reservationInputSchema.safeParse({ itemId: "i", quantity: 0, startsAt: "2026-09-18", endsAt: "2026-09-17" }).success).toBe(false));
  it("accepts a valid range", () => expect(reservationInputSchema.safeParse({ itemId: "i", quantity: 1, startsAt: "2026-09-17", endsAt: "2026-09-18" }).success).toBe(true));
});
