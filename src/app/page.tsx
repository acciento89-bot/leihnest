import Link from "next/link";
import {
  ItemIllustration,
  type ItemIllustrationKind,
} from "@/components/site/item-illustration";

const items: Array<{
  name: string;
  available: string;
  location: string;
  kind: ItemIllustrationKind;
}> = [
  { name: "Pavillon", available: "2 verfügbar", location: "Vereinslager", kind: "pavilion" },
  { name: "Bierzeltgarnituren", available: "6 verfügbar", location: "Garage", kind: "benches" },
  { name: "Beamer", available: "1 verfügbar", location: "Büro", kind: "projector" },
  { name: "Musikanlage", available: "2 verfügbar", location: "Technikraum", kind: "speaker" },
];

const audiences = [
  ["Vereine", "Gemeinsame Ausstattung, Veranstaltungen und Vereinsmaterial übersichtlich organisieren."],
  ["Freizeitgruppen", "Ausrüstung für Touren, Sport, Musik oder gemeinsame Projekte ohne Chat-Chaos koordinieren."],
  ["Hausgemeinschaften", "Geteilte Geräte, Werkzeuge und Gemeinschaftseigentum transparent verfügbar machen."],
  ["Schulen & Kitas", "Materialbestände, Medien und gemeinsam genutzte Ausstattung planbar ausgeben und zurücknehmen."],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand)] text-white">L</span>
          LeihNest
        </Link>
        <nav className="flex items-center gap-3">
          <a className="hidden sm:block" href="#funktionen">Funktionen</a>
          <a className="hidden md:block" href="#zielgruppen">Für wen?</a>
          <Link className="hidden sm:block" href="/kontakt">Kontakt</Link>
          <Link className="rounded-xl border border-[var(--line)] bg-white px-4 py-2" href="/login">Anmelden</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)]">
            Für Vereine, Gruppen & Gemeinschaften
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Gemeinsam nutzen.<br />
            <span className="text-[var(--brand)]">Einfach organisiert.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
            LeihNest bringt eure gemeinsamen Gegenstände, Reservierungen, Übergaben und Rückgaben an einen Ort.
            Schluss mit Chat-Nachrichten, Listen und Doppelbuchungen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-white">
              Kostenlos starten
            </Link>
            <a href="#funktionen" className="rounded-xl border border-[var(--line)] bg-white px-6 py-3 font-semibold">
              So funktioniert’s
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-xl shadow-black/5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted)]">Euer LeihNest</p>
              <h2 className="text-xl font-bold">Vereinsgemeinschaft</h2>
            </div>
            <span className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--brand-dark)]">
              12 Mitglieder
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(({ name, available, location, kind }) => (
              <article key={name} className="rounded-2xl border border-[var(--line)] p-4">
                <div className="mb-4 grid aspect-[16/8] place-items-center rounded-xl bg-[var(--surface-soft)]">
                  <ItemIllustration kind={kind} />
                </div>
                <h3 className="font-bold">{name}</h3>
                <p className="mt-1 text-sm text-[var(--brand)]">● {available}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{location}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="funktionen" className="border-y border-[var(--line)] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-center font-semibold text-[var(--brand)]">Ein Ablauf statt fünf Listen</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-bold">Vom Gegenstand bis zur Rückgabe</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Erfassen", "Gegenstände, Stückzahlen, Zubehör und Lagerort zentral pflegen."],
              ["02", "Reservieren", "Zeitraum und Menge wählen. LeihNest prüft die echte Verfügbarkeit."],
              ["03", "Zurückgeben", "Übergabe und Rückgabe dokumentieren. Überfälliges bleibt sichtbar."],
            ].map(([number, title, description]) => (
              <article key={number} className="rounded-3xl bg-[var(--background)] p-7">
                <span className="font-bold text-[var(--brand)]">{number}</span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="zielgruppen" className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-semibold text-[var(--brand)]">Für gemeinsam genutzte Dinge</p>
        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="max-w-2xl text-3xl font-bold">Passt überall dort, wo mehrere Menschen denselben Bestand nutzen.</h2>
          <p className="max-w-md leading-7 text-[var(--muted)]">
            Privat organisiert, klar nachvollziehbar und ohne öffentlichen Marktplatz.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map(([title, description], index) => (
            <article key={title} className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-soft)] font-bold text-[var(--brand-dark)]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-[2rem] bg-[var(--foreground)] px-7 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold">Eure Sachen. Euer LeihNest.</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Startet mit einer Gruppe und bringt Ordnung in gemeinsame Ausrüstung – ohne öffentlichen Marktplatz
            und ohne komplizierte Verwaltung.
          </p>
          <Link href="/register" className="mt-7 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-[var(--foreground)]">
            LeihNest anlegen
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Kamilunavo · LeihNest</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-[var(--foreground)]">
            <Link href="/kontakt">Kontakt</Link>
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
