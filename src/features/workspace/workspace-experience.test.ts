import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { groupId: "group-1", role: "OWNER", group: { name: "Gartenfreunde", id: "group-1" } } as { groupId: string; role: string; group: { name: string; id: string } } | null,
  locale: "de",
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "accept-language": state.locale }),
  cookies: async () => ({ get: () => ({ value: state.locale }) }),
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => ({ user: { id: "user-1", name: "Anna", email: "anna@example.com" } }) } } }));
vi.mock("@/features/groups/group-service", () => ({ getPrimaryMembership: async () => state.membership }));
vi.mock("@/app/(app)/app/actions", () => ({
  createGroupAction: vi.fn(), createItemAction: vi.fn(), itemAction: vi.fn(),
  createInvitationAction: vi.fn(), createReservationAction: vi.fn(), reservationAction: vi.fn(),
  updateProfileAction: vi.fn(), updateGroupAction: vi.fn(), setLanguageAction: vi.fn(),
}));
vi.mock("@/lib/db", () => {
  const item = { id: "item-1", name: "Pavillon", totalQuantity: 2, location: "Vereinsheim", description: "Für unser Sommerfest", active: true, reservations: [] };
  const reservation = { id: "reservation-1", itemId: item.id, item, userId: "user-1", user: { id: "user-1", name: "Anna" }, quantity: 1, status: "PENDING", purpose: "Sommerfest", returnNote: null, startsAt: new Date("2026-10-01T08:00:00Z"), endsAt: new Date("2026-10-02T16:00:00Z") };
  return { db: {
    item: { findMany: async () => [item], count: async () => 1 },
    reservation: { findMany: async () => [reservation], count: async () => 1 },
    membership: { findMany: async () => [{ id: "member-1", role: "OWNER", userId: "user-1", user: { name: "Anna", email: "anna@example.com" } }], count: async () => 1 },
    invitation: { findMany: async () => [] },
  } };
});

import Dashboard from "@/app/(app)/app/page";
import ItemsPage from "@/app/(app)/app/items/page";
import ReservationsPage from "@/app/(app)/app/reservations/page";
import MembersPage from "@/app/(app)/app/members/page";
import SettingsPage from "@/app/(app)/app/settings/page";

beforeAll(() => vi.stubGlobal("React", React));
beforeEach(() => {
  state.locale = "de";
  state.membership = { groupId: "group-1", role: "OWNER", group: { name: "Gartenfreunde", id: "group-1" } };
});

describe("customer workspace", () => {
  it("offers useful next steps rather than only counters", async () => {
    const html = renderToStaticMarkup(await Dashboard({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Nächste Schritte");
    expect(html).toContain('href="/app/items');
    expect(html).toContain('href="/app/reservations');
  });
  it("presents readable inventory cards with a searchable collection", async () => {
    const html = renderToStaticMarkup(await ItemsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toMatch(/<h2[^>]*>Pavillon<\/h2>/);
    expect(html).toContain("Gegenstände durchsuchen");
    expect(html).toContain("Reservieren");
  });
  it("translates reservation states instead of displaying database enums", async () => {
    const html = renderToStaticMarkup(await ReservationsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Angefragt");
    expect(html).not.toContain(">PENDING<");
    expect(html).toContain("Abholung");
    expect(html).toContain("Rückgabe");
  });
  it("explains member roles in everyday language", async () => {
    const html = renderToStaticMarkup(await MembersPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Verantwortlich");
    expect(html).not.toContain(">OWNER<");
  });
  it("offers real profile and group settings", async () => {
    const html = renderToStaticMarkup(await SettingsPage());
    expect(html).toContain("Dein Profil");
    expect(html).toContain("Gruppenname");
    expect(html).toContain("Sprache");
  });
  it("guides people without a group to an actionable onboarding screen", async () => {
    state.membership = null;
    const html = renderToStaticMarkup(await ItemsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('href="/app"');
    expect(html).toContain("Gruppe erstellen");
  });
});
