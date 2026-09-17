import { describe, expect, it } from "vitest";
import { canTransition } from "./status-machine";

describe("reservation lifecycle", () => {
  it("allows the operational happy path", () => {
    expect(canTransition("PENDING", "APPROVED")).toBe(true);
    expect(canTransition("APPROVED", "HANDED_OUT")).toBe(true);
    expect(canTransition("HANDED_OUT", "RETURNED")).toBe(true);
  });

  it("blocks lifecycle skips", () => {
    expect(canTransition("PENDING", "HANDED_OUT")).toBe(false);
    expect(canTransition("RETURNED", "APPROVED")).toBe(false);
  });
});
