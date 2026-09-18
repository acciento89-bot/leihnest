import { describe, expect, it } from "vitest";
import { invitationInputSchema } from "./invitation-schema";

describe("invitationInputSchema", () => {
  it("normalizes a valid email and accepts member/admin roles", () => {
    const parsed = invitationInputSchema.parse({ email: " USER@Example.com ", role: "MEMBER" });
    expect(parsed).toEqual({ email: "user@example.com", role: "MEMBER" });
  });

  it("rejects owner invitations and invalid email addresses", () => {
    expect(invitationInputSchema.safeParse({ email: "bad", role: "MEMBER" }).success).toBe(false);
    expect(invitationInputSchema.safeParse({ email: "a@example.com", role: "OWNER" }).success).toBe(false);
  });
});
