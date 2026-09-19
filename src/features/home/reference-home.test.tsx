import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import EnglishHome from "@/app/en/page";

describe("the approved homepage reference", () => {
  it("uses the reference headline and the scoped homepage root", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain("Gute Dinge.");
    expect(html).toContain("Teilt man.");
    expect(html).toContain('class="lh-home"');
  });
  it("uses the landing reference scenery, not the login photograph", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain("/images/leihnest-home/reference-scene.webp");
    expect(html).not.toContain("garden-scene.webp");
    expect(html).not.toContain("nest-chalkboard");
  });
  it("retains real text, product cards and links rather than a page screenshot", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain("Unser Inventar");
    expect(html).toContain("Pavillon 3");
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="#ablauf"');
    expect(html).not.toContain("data-visual-style");
  });
  it("does not invent public adoption or environmental figures", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).not.toMatch(/2[.,]800\+|120[.,]000\+|96%|1[.,]2\s*t/);
    expect(html).toContain("Beispielansicht");
  });
  it("keeps English navigation and all three reference feature panels", () => {
    const html = renderToStaticMarkup(<EnglishHome />);
    expect(html).toContain("Good things.");
    expect(html).toContain("Better shared.");
    expect(html).toContain('/login?lang=en');
    expect(html).toContain('id="funktionen"');
    expect(html).toContain('id="ablauf"');
  });
});
