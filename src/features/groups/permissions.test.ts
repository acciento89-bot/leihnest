import { describe, expect, it } from "vitest";
import { canInvite, canManageBilling, canManageGroupImage, canManageInventory, canManageReservations } from "./permissions";

describe("group permissions", () => {
  it.each(["OWNER", "ADMIN"] as const)("allows %s to manage the group", (role) => {
    expect(canManageInventory(role)).toBe(true);
    expect(canManageReservations(role)).toBe(true);
    expect(canInvite(role)).toBe(true);
    expect(canManageGroupImage(role)).toBe(true);
  });

  it("keeps member management actions restricted", () => {
    expect(canManageInventory("MEMBER")).toBe(false);
    expect(canManageReservations("MEMBER")).toBe(false);
    expect(canInvite("MEMBER")).toBe(false);
    expect(canManageGroupImage("MEMBER")).toBe(false);
  });

  it("allows only the owner to manage billing", () => {
    expect(canManageBilling("OWNER")).toBe(true);
    expect(canManageBilling("ADMIN")).toBe(false);
    expect(canManageBilling("MEMBER")).toBe(false);
  });
});
