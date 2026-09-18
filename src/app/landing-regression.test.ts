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

  it("uses the approved duotone real-object illustration treatment", () => {
    const illustration = readFileSync(
      join(process.cwd(), "src/components/site/item-illustration.tsx"),
      "utf8"
    );
    expect(illustration).toContain('data-visual-style="duotone-real-object"');
    expect(illustration).toContain("fill");
  });

  it("includes the approved audience section", () => {
    const page = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    expect(page).toContain('id="zielgruppen"');
    expect(page).toContain("Vereine");
    expect(page).toContain("Hausgemeinschaften");
  });
});
