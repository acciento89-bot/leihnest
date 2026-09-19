import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";
import EnglishHome, {metadata as englishMetadata} from "./en/page";
import Login, {metadata as loginMetadata} from "./login/page";
import Register, {metadata as registerMetadata} from "./register/page";
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}));

describe("finished LeihNest public website", () => {
  it("preserves trust, FAQ and English navigation in the rendered German landing page", () => {
    const page=renderToStaticMarkup(React.createElement(Home));
    for(const text of ['id="vorteile"','id="faq"',"Keine Werbung","H\u00e4ufige Fragen",'href="/en"'])expect(page).toContain(text);
  });
  it("gives the English page the same complete product and legal navigation", () => {
    const page=renderToStaticMarkup(React.createElement(EnglishHome));
    for(const text of ["How it works","Who LeihNest is for","Privacy by design","Frequently asked questions","house communities",'href="/kontakt"','href="/impressum"','href="/datenschutz"'])expect(page).toContain(text);
  });
  it("keeps the canonical and alternate-language metadata",()=>{
    expect(englishMetadata.alternates).toEqual({canonical:"/en",languages:{"de-DE":"/",en:"/en"}});
    expect(englishMetadata.title).toBe("Share more. Organize less.");
  });
  it("keeps the English locale and safe invitation destination through auth navigation",async()=>{
    const en=renderToStaticMarkup(React.createElement(EnglishHome));
    expect(en).toContain('/login?lang=en');expect(en).toContain('/register?lang=en');
    const login=renderToStaticMarkup(await Login({searchParams:Promise.resolve({lang:"en",next:"/invite/sample"})}));
    const register=renderToStaticMarkup(await Register({searchParams:Promise.resolve({lang:"en",next:"/invite/sample"})}));
    expect(login).toContain("Sign in");expect(register).toContain("Create account");
    expect(login).toContain('/register?next=%2Finvite%2Fsample&amp;lang=en');
    expect(register).toContain('/login?next=%2Finvite%2Fsample&amp;lang=en');
  });
  it("keeps authentication pages out of the search index",()=>{
    const sitemap=readFileSync(join(process.cwd(),"src/app/sitemap.ts"),"utf8");
    expect(sitemap).not.toContain('"/login"');expect(sitemap).not.toContain('"/register"');
    expect(loginMetadata.robots).toEqual({index:false,follow:false});
    expect(registerMetadata.robots).toEqual({index:false,follow:false});
  });
});
