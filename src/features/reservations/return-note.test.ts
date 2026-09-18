import { describe, expect, it } from "vitest";
import { returnNoteSchema } from "./reservation-schema";

describe("return note", () => {
  it("trims a condition note and keeps useful content", () => {
    expect(returnNoteSchema.parse("  Alles in Ordnung  ")).toBe("Alles in Ordnung");
  });

  it("normalizes an empty note to null", () => {
    expect(returnNoteSchema.parse("   ")).toBeNull();
  });

  it("rejects notes longer than 500 characters", () => {
    expect(returnNoteSchema.safeParse("x".repeat(501)).success).toBe(false);
  });
});
