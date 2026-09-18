import { describe, expect, it } from "vitest";
import { hashInvitationToken, invitationExpiresAt } from "./invitation-token";

describe("invitation token helpers", () => {
  it("hashes the same token deterministically without returning the raw token", () => {
    const hash = hashInvitationToken("example-token");
    expect(hash).toBe(hashInvitationToken("example-token"));
    expect(hash).not.toContain("example-token");
    expect(hash).toHaveLength(64);
  });

  it("expires invitations seven days after creation", () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    expect(invitationExpiresAt(now).toISOString()).toBe("2026-09-25T12:00:00.000Z");
  });
});
