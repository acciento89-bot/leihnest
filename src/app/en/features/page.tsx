import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/site/marketing-shell";

export const metadata: Metadata = {
  title: "Features",
  description: "Organise shared inventory, reservations and returns with LeihNest.",
  alternates: { canonical: "/en/features", languages: { "de-DE": "/funktionen", en: "/en/features" } },
};

const features = [
  {
    id: "inventory",
    number: "01",
    title: "Organise your collection",
    lead: "Give every shared item in your group one private, reliable home.",
    points: ["Add names, quantities, descriptions and storage locations", "Use profile, group and item images", "Search your collection and archive items you no longer use", "Free includes one image per item; Plus expands this to up to five"],
  },
  {
    id: "reservations",
    number: "02",
    title: "Smarter reservations",
    lead: "Keep requests, approvals and handovers clear for everyone involved.",
    points: ["Members choose an item plus collection and return times", "Group managers review and approve requests", "Handovers are confirmed when the item is actually collected", "Current, personal and historic loans stay easy to distinguish"],
  },
  {
    id: "returns",
    number: "03",
    title: "Keep track of returns",
    lead: "Returns stay part of the shared workflow instead of disappearing into a chat thread.",
    points: ["See loans that are due or overdue", "Confirm returns with an optional note", "Completed loans remain available in the history", "Plus adds exports and enhanced group analytics"],
  },
] as const;

export default function Features() {
  return <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
    <MarketingHeader locale="en" />
    <main className="mx-auto max-w-6xl px-6 pb-12 pt-10">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brand)]">LeihNest in detail</p>
      <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-6xl">Three building blocks for sharing together.</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">LeihNest keeps inventory, reservations and returns together in one place. Your group stays private and the core product remains available for free.</p>
      <div className="mt-12 grid gap-5">
        {features.map((feature) => <section key={feature.id} id={feature.id} className="scroll-mt-8 rounded-3xl border border-[var(--line)] bg-white p-7 sm:p-9">
          <div className="grid gap-7 md:grid-cols-[110px_1fr]">
            <span className="text-4xl font-bold text-[var(--brand)]">{feature.number}</span>
            <div><h2 className="text-3xl font-bold">{feature.title}</h2><p className="mt-3 max-w-3xl text-lg leading-8 text-[var(--muted)]">{feature.lead}</p>
              <ul className="mt-6 grid gap-3 text-[var(--foreground)]">{feature.points.map(point => <li key={point} className="flex gap-3"><span className="mt-1 text-[var(--brand)]">✓</span><span>{point}</span></li>)}</ul>
            </div>
          </div>
        </section>)}
      </div>
      <section className="mt-10 rounded-3xl bg-[var(--surface-soft)] p-7 sm:p-9">
        <h2 className="text-3xl font-bold">Start free and decide later.</h2>
        <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">Free covers the shared essentials. LeihNest Plus is optional and adds more item images, CSV exports and enhanced analytics for your group.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link className="rounded-xl bg-[var(--brand-dark)] px-5 py-3 font-semibold text-white" href="/register?lang=en">Start LeihNest for free</Link><Link className="rounded-xl border border-[var(--line)] bg-white px-5 py-3 font-semibold" href="/en/pricing">View pricing</Link></div>
      </section>
    </main>
    <MarketingFooter locale="en" />
  </div>;
}
