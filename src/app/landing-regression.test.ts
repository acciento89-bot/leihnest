import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("landing page visual regressions", () => {
  it("does not globally override anchor colors after Tailwind utilities",()=>{
    expect(readFileSync(join(process.cwd(),"src/app/globals.css"),"utf8")).not.toMatch(/a\s*\{[^}]*color:\s*inherit/i);
  });
  it("uses the approved local homepage motifs instead of replacement illustrations",()=>{
    const page=renderToStaticMarkup(React.createElement(Home));
    expect(page).not.toContain("\u25eb");expect(page).not.toContain('data-visual-style="duotone-real-object"');
    for(const kind of ["pavilion","speaker","projector","chair","toolbox","benches"]){
      expect(page).toContain(`/images/leihnest-home/${kind}.webp`);
      expect(existsSync(join(process.cwd(),`public/images/leihnest-home/${kind}.webp`))).toBe(true);
    }
  });
  it("does not replace the functioning page with a full-page screenshot",()=>{
    const page=renderToStaticMarkup(React.createElement(Home));
    expect(page).toMatch(/<h1\b[^>]*>/);expect(page).toContain('href="/login"');expect(page).toContain('type="search"');
    expect(page).toContain('aria-pressed="true"');expect(page).toContain('href="#ablauf"');
    expect(page).not.toContain("image-gen-");
  });
  it("preserves the audience section for clubs and house communities",()=>{
    const page=renderToStaticMarkup(React.createElement(Home));
    expect(page).toContain('id="zielgruppen"');expect(page).toContain("Sportvereine");expect(page).toContain("Nachbarschaften");
  });
});

// Check every image referenced by the active homepage, including the scenery/logo.
describe("homepage asset integrity", () => {
  it("ships every locally referenced homepage image", () => {
    const page=renderToStaticMarkup(React.createElement(Home));
    const paths=Array.from(page.matchAll(/(?:src|href)="(\/images\/[^"?#]+)"/g), match => match[1]);
    expect(paths.length).toBeGreaterThanOrEqual(8);
    for(const imagePath of new Set(paths)) {
      expect(existsSync(join(process.cwd(), "public", imagePath)), imagePath).toBe(true);
    }
  });
});
