import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

const root = process.cwd();

describe("public marketing release", () => {
  it("shows pricing in the top navigation and on the homepage", () => {
    const page = renderToStaticMarkup(React.createElement(Home));
    expect(page).toContain('href="/preise"');
    expect(page).toContain(">Preise<");
    expect(page).toContain("Kostenlos");
    expect(page).toContain("4,99");
    expect(page).toContain("39,99");
    expect(page).toContain("LeihNest Plus");
  });

  it("routes every feature card to a real explanatory page section", () => {
    const page = renderToStaticMarkup(React.createElement(Home));
    expect(page).toContain('href="/funktionen#inventar"');
    expect(page).toContain('href="/funktionen#reservierungen"');
    expect(page).toContain('href="/funktionen#rueckgaben"');
  });

  it.each([
    "src/app/funktionen/page.tsx",
    "src/app/preise/page.tsx",
    "src/app/en/features/page.tsx",
    "src/app/en/pricing/page.tsx",
  ])("ships the public route %s", (path) => {
    expect(existsSync(join(root, path))).toBe(true);
  });

  it("adds the new public routes to the sitemap", () => {
    const sitemap = readFileSync(join(root, "src/app/sitemap.ts"), "utf8");
    for (const route of ["/funktionen", "/preise", "/en/features", "/en/pricing"]) {
      expect(sitemap).toContain(`"${route}"`);
    }
  });

  it("keeps Free as a permanent usable option and presents Plus as optional", () => {
    const pricingPath = join(root, "src/app/preise/page.tsx");
    if (!existsSync(pricingPath)) {
      expect(existsSync(pricingPath)).toBe(true);
      return;
    }
    const source = readFileSync(pricingPath, "utf8");
    expect(source).toContain("Dauerhaft kostenlos");
    expect(source).toContain("Plus ist optional");
    expect(source).toContain("4,99");
    expect(source).toContain("39,99");
  });
});
