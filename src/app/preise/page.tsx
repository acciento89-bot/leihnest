import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/site/marketing-shell";

export const metadata: Metadata = {
  title: "Preise",
  description: "LeihNest Free kostenlos nutzen oder die ganze Gruppe mit LeihNest Plus erweitern.",
  alternates: { canonical: "/preise", languages: { "de-DE": "/preise", en: "/en/pricing" } },
};

const common = ["Private Gruppe und Mitglieder", "Inventar, Reservierungen und Rückgaben", "Profilbild und Gruppenbild", "Keine Werbung"] as const;

export default function Preise() {
  return <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
    <MarketingHeader locale="de" />
    <main className="mx-auto max-w-6xl px-6 pb-12 pt-10">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brand)]">Preise</p>
      <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-6xl">Mit Free starten. Plus nur, wenn ihr mehr braucht.</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]"><strong className="text-[var(--foreground)]">Plus ist optional.</strong> Eine Gruppe kann LeihNest im Free-Tarif weiter nutzen und später jederzeit auf Plus wechseln.</p>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--line)] bg-white p-7 sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--brand)]">Free</p>
          <h2 className="mt-3 text-4xl font-bold">0 €</h2>
          <p className="mt-2 font-semibold">Dauerhaft kostenlos</p>
          <p className="mt-4 leading-7 text-[var(--muted)]">Für Gruppen, die ihre gemeinsamen Dinge zuverlässig organisieren möchten.</p>
          <ul className="mt-7 grid gap-3">{common.map(item => <li key={item} className="flex gap-3"><span className="text-[var(--brand)]">✓</span>{item}</li>)}<li className="flex gap-3"><span className="text-[var(--brand)]">✓</span>1 Bild je Gegenstand</li></ul>
          <Link className="mt-8 inline-flex rounded-xl bg-[var(--brand-dark)] px-5 py-3 font-semibold text-white" href="/register">Kostenlos starten</Link>
        </section>

        <section className="rounded-3xl border border-[var(--brand-dark)] bg-[var(--brand-dark)] p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#cae6d0]">LeihNest Plus</p>
          <h2 className="mt-3 text-4xl font-bold">4,99 € <span className="text-lg font-semibold">/ Monat</span></h2>
          <p className="mt-2 font-semibold text-[#dcebdd]">oder 39,99 € / Jahr</p>
          <p className="mt-4 leading-7 text-[#e8f1e8]">Ein Abo gilt für die ganze Gruppe – nicht pro Mitglied.</p>
          <ul className="mt-7 grid gap-3"><li className="flex gap-3"><span>✓</span>Alles aus Free</li><li className="flex gap-3"><span>✓</span>Bis zu 5 Bilder je Gegenstand</li><li className="flex gap-3"><span>✓</span>CSV-Exporte für Inventar und Reservierungen</li><li className="flex gap-3"><span>✓</span>Erweiterte Gruppenstatistiken</li></ul>
          <Link className="mt-8 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-[var(--brand-dark)]" href="/register">Free starten, Plus später aktivieren</Link>
        </section>
      </div>

      <section className="mt-8 rounded-3xl bg-[var(--surface-soft)] p-7 sm:p-9">
        <h2 className="text-2xl font-bold">So funktioniert Plus</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div><strong>1. Gruppe anlegen</strong><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Ihr startet ganz normal im kostenlosen Tarif.</p></div>
          <div><strong>2. Owner entscheidet</strong><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Nur die verantwortliche Person verwaltet das Gruppenabo.</p></div>
          <div><strong>3. Ganze Gruppe profitiert</strong><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Nach Aktivierung gelten die Plus-Funktionen für alle Mitglieder der Gruppe.</p></div>
        </div>
        <p className="mt-6 text-sm leading-6 text-[var(--muted)]">Plus kann über das Stripe-Kundenportal zum Ende des laufenden Abrechnungszeitraums gekündigt werden. Danach nutzt die Gruppe LeihNest wieder im Free-Tarif weiter.</p>
      </section>
    </main>
    <MarketingFooter locale="de" />
  </div>;
}
