import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("published workspace session controls", () => {
  it("renders an explicit sign-out control in the authenticated shell", () => {
    const layout = readFileSync(
      join(process.cwd(), "src/app/(app)/app/layout.tsx"),
      "utf8"
    );
    expect(layout).toContain("AccountControls");
  });

  it("signs out through Better Auth and returns to the public site", () => {
    const controls = readFileSync(
      join(process.cwd(), "src/components/app/account-controls.tsx"),
      "utf8"
    );
    expect(controls).toContain("authClient.signOut");
    expect(controls).toContain('router.replace("/")');
  });
});
