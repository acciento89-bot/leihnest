import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import EnglishHome from "@/app/en/page";
import Login from "@/app/login/page";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("approved reference presentation", () => {
  it("renders the approved headline and reference hero as real components", () => {
    const html=renderToStaticMarkup(<Home/>);
    expect(html).toContain("Gute Dinge.");
    expect(html).toContain("Teilt man.");
    expect(html).toContain('class="lh-home"');
    expect(html).toContain("/images/leihnest-home/");
    expect(html).not.toContain('data-visual-style="duotone-real-object"');
  });
  it("marks sample inventory as a demonstration, not customer proof", () => {
    const html=renderToStaticMarkup(<Home/>);
    expect(html).toContain("Beispielansicht");
    for(const claim of ["2.800+","120.000+","96%","96 %","1.2 t","1,2 t"]){expect(html).not.toContain(claim);}
  });
  it("provides a corresponding fully English design", () => {
    const html=renderToStaticMarkup(<EnglishHome/>);
    expect(html).toContain('class="lh-home"');
    expect(html).toContain("Good things.");
    expect(html).toContain("Better shared.");
    expect(html).toContain("Example preview");
    expect(html).not.toContain("Gute Dinge");
  });
  it("implements the split login layout and preserves a safe invitation destination", async () => {
    const html=renderToStaticMarkup(await Login({searchParams:Promise.resolve({next:"/invite/example",lang:"de"})}));
    expect(html).toContain('data-concept="auth"');
    expect(html).toContain("Willkommen");
    expect(html).toContain("zurück im");
    expect(html).toContain("Nest.");
    expect(html).toContain("auth-scene");
    expect(html).not.toContain("Mit Google");
    expect(html).not.toContain("Mit Apple");
    expect(html).toContain("%2Finvite%2Fexample");
  });
});
