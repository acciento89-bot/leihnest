import type { Metadata } from "next";
import Link from "next/link";
import {
  ItemIllustration,
  type ItemIllustrationKind,
} from "@/components/site/item-illustration";

export const metadata: Metadata = {
  title: "LeihNest – Share more. Organize less.",
  description:
    "Manage shared items, reservations, handovers and returns in one private group workspace.",
  alternates: {
    canonical: "/en",
    languages: {
      "de-DE": "/",
      "en": "/en",
    },
  },
  openGraph: {
    title: "LeihNest – Share more. Organize less.",
    description:
      "A private workspace for shared items, reservations, handovers and returns.",
    url: "https://leihnest.de/en",
    siteName: "LeihNest",
    locale: "en_US",
    type: "website",
  },
};

const items: Array<{
  name: string;
  available: string;
  location: string;
  kind: ItemIllustrationKind;
}> = [
  { name: "Gazebo", available: "2 available", location: "Club storage", kind: "pavilion" },
  { name: "Table sets", available: "6 available", location: "Garage", kind: "benches" },
  { name: "Projector", available: "1 available", location: "Office", kind: "projector" },
  { name: "PA system", available: "2 available", location: "Tech room", kind: "speaker" },
];

const steps = [
  ["01", "Create your group", "Set up a private workspace and define who manages it."],
  ["02", "Add shared items", "Keep quantities, descriptions and storage locations in one place."],
  ["03", "Reserve & approve", "Choose a time range and quantity. LeihNest checks availability and supports approvals."],
  ["04", "Hand out & return", "Record handovers and returns while due and overdue loans remain visible."],
];

const benefits = [
  ["No advertising", "No ad placements, advertising profiles or distractions from the inventory your group actually uses."],
  ["Private group workspace", "LeihNest is not a public marketplace. Members work inside their own closed group."],
  ["Clear roles", "Owners, admins and members handle the tasks that belong to their role."],
  ["Traceable workflow", "Reservations, approvals, handovers and returns follow clear states instead of scattered chat messages."],
];

const audiences = [
  ["Clubs", "Organize club equipment, event supplies and shared inventory in one place."],
  ["Activity groups", "Coordinate gear for trips, sports, music or shared projects without chat chaos."],
  ["House communities", "Make shared tools, devices and community property transparent and bookable."],
  ["Schools & childcare", "Plan the handout and return of media, materials and shared equipment."],
];

const faqs = [
  [
    "Do members need to install an app?",
    "No. LeihNest runs in the browser and works on phones, tablets and desktop computers.",
  ],
  [
    "Is LeihNest a public rental marketplace?",
    "No. LeihNest organizes inventory inside your own group. Items are not listed publicly.",
  ],
  [
    "Can LeihNest prevent double bookings?",
    "Yes. When a reservation is approved, LeihNest checks the actually available quantity for that time range again.",
  ],
  [
    "Can several people manage a group?",
    "Yes. Owners and admins can maintain items, manage reservations and invite members.",
  ],
  [
    "Does LeihNest create advertising or analytics profiles?",
    "Not currently. LeihNest does not use its own advertising or analytics profiles. See the privacy policy for details.",
  ],
];

export default function EnglishHome() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-6 sm:py-6">
        <Link href="/en" className="flex shrink-0 items-center gap-3 text-xl font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-sm">
            L
          </span>
          LeihNest
        </Link>

        <nav className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:gap-4">
          <a className="hidden lg:block" href="#features">Features</a>
          <a className="hidden lg:block" href="#privacy">Benefits</a>
          <a className="hidden xl:block" href="#audiences">Who is it for?</a>
          <a className="hidden xl:block" href="#faq">FAQ</a>
          <Link className="hidden md:block" href="/kontakt">Contact</Link>
          <Link
            href="/"
            className="rounded-lg px-2 py-2 text-[var(--muted)] transition hover:bg-white hover:text-[var(--foreground)]"
          >
            DE
          </Link>
          <Link
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 transition hover:border-[var(--brand)] sm:px-4"
            href="/login?lang=en"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:pb-24">
        <div>
          <span className="inline-flex rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)]">
            For clubs, groups and communities
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl">
            Share more.
            <br />
            <span className="text-[var(--brand)]">Organize less.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Shared items, reservations, handovers and returns in one place.
            LeihNest replaces scattered chats, spreadsheets and double bookings with one clear workflow.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register?lang=en"
              className="rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--brand-dark)]"
            >
              Get started
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-[var(--line)] bg-white px-6 py-3 font-semibold transition hover:border-[var(--brand)]"
            >
              How it works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[var(--muted)]">
            <span>✓ Private group workspace</span>
            <span>✓ No advertising</span>
            <span>✓ Mobile & desktop</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-white p-4 shadow-xl shadow-black/5 sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--muted)]">Your LeihNest</p>
              <h2 className="text-xl font-bold">Community equipment</h2>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-[var(--brand-dark)]">12 members</span>
              <span className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-[var(--brand-dark)]">4 areas</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(({ name, available, location, kind }) => (
              <article key={name} className="rounded-2xl border border-[var(--line)] p-4">
                <div className="mb-4 grid aspect-[16/8] place-items-center rounded-xl bg-[var(--surface-soft)]">
                  <ItemIllustration kind={kind} />
                </div>
                <h3 className="font-bold">{name}</h3>
                <p className="mt-1 text-sm font-medium text-[var(--brand)]">● {available}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{location}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[var(--line)] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <p className="text-center font-semibold text-[var(--brand)]">How it works</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-center text-3xl font-bold sm:text-4xl">
            From group setup to return
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-7 text-[var(--muted)]">
            Every step stays visible to your group without extra spreadsheets or long chat histories.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map(([number, title, description]) => (
              <article key={number} className="rounded-3xl bg-[var(--background)] p-7">
                <span className="font-bold text-[var(--brand)]">{number}</span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <p className="font-semibold text-[var(--brand)]">Privacy by design</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              No ads. No public marketplace.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
              LeihNest is built for groups that want to organize their own shared inventory.
              No public item discovery, no requests from strangers and no advertising profiles.
            </p>
            <Link href="/datenschutz" className="mt-6 inline-block font-semibold text-[var(--brand)]">
              Read the privacy details →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map(([title, description]) => (
              <article key={title} className="rounded-3xl border border-[var(--line)] bg-white p-6">
                <div className="mb-5 h-2 w-12 rounded-full bg-[var(--brand)]" />
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="audiences" className="border-y border-[var(--line)] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <p className="font-semibold text-[var(--brand)]">Who LeihNest is for</p>
          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">
              Built wherever several people share the same inventory.
            </h2>
            <p className="max-w-md leading-7 text-[var(--muted)]">
              From club storage to community tools: private, organized and easy to understand.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map(([title, description], index) => (
              <article key={title} className="rounded-3xl border border-[var(--line)] bg-[var(--background)] p-6">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-soft)] font-bold text-[var(--brand-dark)]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-5 py-20 sm:px-6 sm:py-24">
        <p className="text-center font-semibold text-[var(--brand)]">Frequently asked questions</p>
        <h2 className="mt-3 text-center text-3xl font-bold sm:text-4xl">
          What to know before you start
        </h2>

        <div className="mt-10 grid gap-3">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group rounded-2xl border border-[var(--line)] bg-white p-5">
              <summary className="cursor-pointer list-none pr-6 font-bold">
                {question}
              </summary>
              <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-6 sm:pb-24">
        <div className="rounded-[2rem] bg-[var(--foreground)] px-6 py-12 text-center text-white sm:px-12 sm:py-14">
          <p className="font-semibold text-white/65">Less coordination. More clarity.</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Your things. Your LeihNest.</h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-white/70">
            Create a private group workspace and manage shared items from the first entry to the final return.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/register?lang=en"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-[var(--foreground)]"
            >
              Create your LeihNest
            </Link>
            <Link
              href="/kontakt"
              className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white"
            >
              Questions? Contact us
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-9 text-sm sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex items-center gap-3 font-bold text-[var(--foreground)]">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--brand)] text-white">L</span>
              LeihNest
            </div>
            <p className="mt-3 text-[var(--muted)]">
              Share more. Organize less. A Kamilunavo product.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 font-semibold text-[var(--foreground)]">
            <Link href="/">Deutsch</Link>
            <Link href="/kontakt">Contact</Link>
            <Link href="/impressum">Imprint</Link>
            <Link href="/datenschutz">Privacy</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
