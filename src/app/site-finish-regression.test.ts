import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("finished LeihNest public website", () => {
  it("adds trust, FAQ and English navigation to the German landing page", () => {
    const page = read("src/app/page.tsx");

    expect(page).toContain('id="vorteile"');
    expect(page).toContain('id="faq"');
    expect(page).toContain("Keine Werbung");
    expect(page).toContain("Häufige Fragen");
    expect(page).toContain('href="/en"');
  });

  it("gives the English landing page the same full product structure", () => {
    const page = read("src/app/en/page.tsx");

    expect(page).toContain("How it works");
    expect(page).toContain("Who LeihNest is for");
    expect(page).toContain("Privacy by design");
    expect(page).toContain("Frequently asked questions");
    expect(page).toContain("House communities");
    expect(page).toContain('href="/kontakt"');
    expect(page).toContain('href="/impressum"');
    expect(page).toContain('href="/datenschutz"');
  });

  it("gives the English page its own canonical and language metadata", () => {
    const page = read("src/app/en/page.tsx");

    expect(page).toContain("export const metadata");
    expect(page).toContain('canonical: "/en"');
    expect(page).toContain('"de-DE": "/"');
    expect(page).toContain('"en": "/en"');
  });

  it("keeps English users in English through the auth entry flow", () => {
    const en = read("src/app/en/page.tsx");
    const login = read("src/app/login/page.tsx");
    const register = read("src/app/register/page.tsx");
    const form = read("src/components/auth/auth-form.tsx");

    expect(en).toContain('/login?lang=en');
    expect(en).toContain('/register?lang=en');
    expect(login).toContain('lang?: string');
    expect(login).toContain('locale={locale}');
    expect(register).toContain('lang?: string');
    expect(register).toContain('locale={locale}');
    expect(form).toContain('locale = "de"');
    expect(form).toContain('"Sign in"');
    expect(form).toContain('"Create account"');
  });
});
