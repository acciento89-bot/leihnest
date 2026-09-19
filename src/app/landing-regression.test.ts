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
  it("uses actual local item photos instead of line illustrations and placeholder glyphs",()=>{
    const page=renderToStaticMarkup(React.createElement(Home));
    expect(page).not.toContain("\u25eb");expect(page).not.toContain('data-visual-style="duotone-real-object"');
    for(const kind of ["pavilion","speaker","projector","chair","toolbox","benches"]){
      expect(page).toContain(`/images/leihnest/${kind}.webp`);
      expect(existsSync(join(process.cwd(),`public/images/leihnest/${kind}.webp`))).toBe(true);
    }
  });
  it("does not replace the functioning page with a full-page screenshot",()=>{
    const page=renderToStaticMarkup(React.createElement(Home));
    expect(page).toContain("<h1>");expect(page).toContain('href="/login"');expect(page).toContain('type="search"');
    expect(page).toContain('aria-pressed="true"');expect(page).toContain('href="#ablauf"');
    expect(page).not.toContain("image-gen-");
  });
  it("preserves the audience section for clubs and house communities",()=>{
    const page=renderToStaticMarkup(React.createElement(Home));
    expect(page).toContain('id="zielgruppen"');expect(page).toContain("Vereine");expect(page).toContain("Hausgemeinschaften");
  });
});
