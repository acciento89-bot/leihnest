import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe,it,expect,vi } from "vitest";
import { AuthForm } from "@/components/auth/auth-form";
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}));
describe("reference authentication presentation",()=>{
 it("provides the illustrated form affordances without changing credentials",()=>{
  const html=renderToStaticMarkup(<AuthForm mode="login" locale="de"/>);
  expect(html).toContain("E-Mail-Adresse");
  expect(html).toContain('placeholder="deine@email.de"');
  expect(html).toContain('aria-label="Passwort anzeigen"');
  expect(html).toContain('type="password"');
  expect(html).toContain('autoComplete="current-password"');
 });
 it("localizes the password control and field hints",()=>{
  const html=renderToStaticMarkup(<AuthForm mode="register" locale="en"/>);
  expect(html).toContain('aria-label="Show password"');
  expect(html).toContain('placeholder="you@example.com"');
  expect(html).toContain('autoComplete="new-password"');
 });
});
