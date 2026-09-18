import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("landing page visual regressions", () => {
  it("does not globally override anchor text colors after Tailwind utilities", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).not.toMatch(/a\s*\{[^}]*color:\s*inherit/i);
  });

  it("uses real equipment illustrations instead of the unicode placeholder glyph", () => {
    const page = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    expect(page).not.toContain("◫");
    expect(page).toContain("ItemIllustration");
  });
});
