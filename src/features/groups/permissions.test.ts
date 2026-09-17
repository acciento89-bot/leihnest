import { describe, expect, it } from "vitest";
import { canInvite, canManageInventory, canManageReservations } from "./permissions";

describe("group permissions", () => {
  it.each(["OWNER", "ADMIN"] as const)("allows %s to manage the group", (role) => {
    expect(canManageInventory(role)).toBe(true);
    expect(canManageReservations(role)).toBe(true);
    expect(canInvite(role)).toBe(true);
  });

  it("keeps member management actions restricted", () => {
    expect(canManageInventory("MEMBER")).toBe(false);
    expect(canManageReservations("MEMBER")).toBe(false);
    expect(canInvite("MEMBER")).toBe(false);
  });
});
