import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/site/marketing-shell";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Use LeihNest Free or add LeihNest Plus for the whole group.",
  alternates: { canonical: "/en/pricing", languages: { "de-DE": "/preise", en: "/en/pricing" } },
};

const common = ["Private group and members", "Inventory, reservations and returns", "Profile and group images", "No advertising"] as const;

export default function Pricing() {
  return <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
    <MarketingHeader locale="en" />
    <main className="mx-auto max-w-6xl px-6 pb-12 pt-10">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brand)]">Pricing</p>
      <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-6xl">Start with Free. Add Plus only when your group needs more.</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]"><strong className="text-[var(--foreground)]">Plus is optional.</strong> Your group can keep using the Free plan and upgrade later whenever it makes sense.</p>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--line)] bg-white p-7 sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--brand)]">Free</p>
          <h2 className="mt-3 text-4xl font-bold">€0</h2>
          <p className="mt-2 font-semibold">Free for ongoing use</p>
          <p className="mt-4 leading-7 text-[var(--muted)]">For groups that want a reliable way to organise the things they share.</p>
          <ul className="mt-7 grid gap-3">{common.map(item => <li key={item} className="flex gap-3"><span className="text-[var(--brand)]">✓</span>{item}</li>)}<li className="flex gap-3"><span className="text-[var(--brand)]">✓</span>1 image per item</li></ul>
          <Link className="mt-8 inline-flex rounded-xl bg-[var(--brand-dark)] px-5 py-3 font-semibold text-white" href="/register?lang=en">Start for free</Link>
        </section>

        <section className="rounded-3xl border border-[var(--brand-dark)] bg-[var(--brand-dark)] p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#cae6d0]">LeihNest Plus</p>
          <h2 className="mt-3 text-4xl font-bold">€4.99 <span className="text-lg font-semibold">/ month</span></h2>
          <p className="mt-2 font-semibold text-[#dcebdd]">or €39.99 / year</p>
          <p className="mt-4 leading-7 text-[#e8f1e8]">One subscription covers the whole group, not each member.</p>
          <ul className="mt-7 grid gap-3"><li className="flex gap-3"><span>✓</span>Everything in Free</li><li className="flex gap-3"><span>✓</span>Up to 5 images per item</li><li className="flex gap-3"><span>✓</span>CSV exports for inventory and reservations</li><li className="flex gap-3"><span>✓</span>Enhanced group analytics</li></ul>
          <Link className="mt-8 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-[var(--brand-dark)]" href="/register?lang=en">Start Free, add Plus later</Link>
        </section>
      </div>

      <section className="mt-8 rounded-3xl bg-[var(--surface-soft)] p-7 sm:p-9">
        <h2 className="text-2xl font-bold">How Plus works</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div><strong>1. Create your group</strong><p className="mt-2 text-sm leading-6 text-[var(--muted)]">You begin on the Free plan.</p></div>
          <div><strong>2. The owner decides</strong><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Only the group owner manages billing.</p></div>
          <div><strong>3. Everyone benefits</strong><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Once active, Plus features apply to every member of the group.</p></div>
        </div>
        <p className="mt-6 text-sm leading-6 text-[var(--muted)]">Plus can be cancelled through the Stripe customer portal for the end of the current billing period. The group then continues on Free.</p>
      </section>
    </main>
    <MarketingFooter locale="en" />
  </div>;
}
