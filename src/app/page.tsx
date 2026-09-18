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

const steps = [
  ["01", "Gruppe anlegen", "Euren privaten Bereich erstellen und Verantwortliche festlegen."],
  ["02", "Gegenstände erfassen", "Bestände, Stückzahlen, Beschreibung und Lagerort zentral pflegen."],
  ["03", "Reservieren & freigeben", "Zeitraum und Menge wählen. LeihNest prüft die Verfügbarkeit und bildet Freigaben ab."],
  ["04", "Ausgeben & zurücknehmen", "Übergabe und Rückgabe dokumentieren. Fällige und überfällige Ausleihen bleiben sichtbar."],
];

const benefits = [
  ["Keine Werbung", "Keine Werbeflächen, kein Werbeprofiling und keine Ablenkung von eurem eigentlichen Bestand."],
  ["Geschlossener Gruppenbereich", "LeihNest ist kein öffentlicher Marktplatz. Mitglieder arbeiten in ihrem eigenen privaten Bereich."],
  ["Klare Rollen", "Owner, Admins und Mitglieder sehen und erledigen genau die Aufgaben, die zu ihrer Rolle passen."],
  ["Nachvollziehbarer Ablauf", "Reservierung, Freigabe, Ausgabe und Rückgabe folgen einem klaren Status statt verstreuter Nachrichten."],
];

const audiences = [
  ["Vereine", "Gemeinsame Ausstattung, Veranstaltungen und Vereinsmaterial übersichtlich organisieren."],
  ["Freizeitgruppen", "Ausrüstung für Touren, Sport, Musik oder gemeinsame Projekte ohne Chat-Chaos koordinieren."],
  ["Hausgemeinschaften", "Geteilte Geräte, Werkzeuge und Gemeinschaftseigentum transparent verfügbar machen."],
  ["Schulen & Kitas", "Materialbestände, Medien und gemeinsam genutzte Ausstattung planbar ausgeben und zurücknehmen."],
];

const faqs = [
  [
    "Brauchen Mitglieder eine App?",
    "Nein. LeihNest läuft vollständig im Browser und funktioniert auf Smartphone, Tablet und Desktop.",
  ],
  [
    "Ist LeihNest ein öffentlicher Verleih-Marktplatz?",
    "Nein. LeihNest organisiert den Bestand innerhalb eurer eigenen Gruppe. Gegenstände werden nicht öffentlich angeboten.",
  ],
  [
    "Kann LeihNest Doppelreservierungen vermeiden?",
    "Ja. Bei Freigaben wird die tatsächlich verfügbare Menge für den gewählten Zeitraum erneut geprüft.",
  ],
  [
    "Können mehrere Personen verwalten?",
    "Ja. Owner und Admins können Gegenstände pflegen, Reservierungen verwalten und Mitglieder einladen.",
  ],
  [
    "Werden Werbe- oder Analyseprofile erstellt?",
    "Derzeit nicht. LeihNest setzt keine eigenen Werbe- oder Analyseprofile ein. Details stehen in der Datenschutzerklärung.",
  ],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-6 sm:py-6">
        <Link href="/" className="flex shrink-0 items-center gap-3 text-xl font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-sm">
            L
          </span>
          LeihNest
        </Link>

        <nav className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:gap-4">
          <a className="hidden lg:block" href="#funktionen">Funktionen</a>
          <a className="hidden lg:block" href="#vorteile">Vorteile</a>
          <a className="hidden xl:block" href="#zielgruppen">Für wen?</a>
          <a className="hidden xl:block" href="#faq">FAQ</a>
          <Link className="hidden md:block" href="/kontakt">Kontakt</Link>
          <Link
            href="/en"
            className="rounded-lg px-2 py-2 text-[var(--muted)] transition hover:bg-white hover:text-[var(--foreground)]"
          >
            EN
          </Link>
          <Link
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 transition hover:border-[var(--brand)] sm:px-4"
            href="/login"
          >
            Anmelden
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:pb-24">
        <div>
          <span className="inline-flex rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)]">
            Für Vereine, Gruppen & Gemeinschaften
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl">
            Gemeinsam nutzen.
            <br />
            <span className="text-[var(--brand)]">Einfach organisiert.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Gegenstände, Reservierungen, Übergaben und Rückgaben an einem Ort.
            LeihNest ersetzt Chat-Nachrichten, unübersichtliche Listen und doppelte Buchungen durch einen klaren Ablauf.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--brand-dark)]"
            >
              Kostenlos starten
            </Link>
            <a
              href="#funktionen"
              className="rounded-xl border border-[var(--line)] bg-white px-6 py-3 font-semibold transition hover:border-[var(--brand)]"
            >
              So funktioniert’s
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[var(--muted)]">
            <span>✓ Privater Gruppenbereich</span>
            <span>✓ Keine Werbung</span>
            <span>✓ Smartphone & Desktop</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-white p-4 shadow-xl shadow-black/5 sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--muted)]">Euer LeihNest</p>
              <h2 className="text-xl font-bold">Vereinsgemeinschaft</h2>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-[var(--brand-dark)]">12 Mitglieder</span>
              <span className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-[var(--brand-dark)]">4 Bereiche</span>
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

      <section id="funktionen" className="border-y border-[var(--line)] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <p className="text-center font-semibold text-[var(--brand)]">Ein Ablauf statt fünf Listen</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-center text-3xl font-bold sm:text-4xl">
            Von der Gruppe bis zur Rückgabe
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-7 text-[var(--muted)]">
            Jeder Schritt bleibt für die Gruppe nachvollziehbar – ohne zusätzliche Tabellen oder Chat-Verläufe.
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

      <section id="vorteile" className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <p className="font-semibold text-[var(--brand)]">Privat, übersichtlich, fokussiert</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Keine Werbung. Kein öffentlicher Marktplatz.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
              LeihNest ist für Gruppen gebaut, die ihren eigenen Bestand organisieren möchten.
              Keine öffentliche Suche nach Gegenständen, keine fremden Anfragen und keine Werbeprofile.
            </p>
            <Link href="/datenschutz" className="mt-6 inline-block font-semibold text-[var(--brand)]">
              Datenschutz im Detail →
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

      <section id="zielgruppen" className="border-y border-[var(--line)] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <p className="font-semibold text-[var(--brand)]">Für gemeinsam genutzte Dinge</p>
          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">
              Passt überall dort, wo mehrere Menschen denselben Bestand nutzen.
            </h2>
            <p className="max-w-md leading-7 text-[var(--muted)]">
              Vom Vereinslager bis zum gemeinschaftlichen Werkzeugbestand: privat organisiert und klar nachvollziehbar.
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
        <p className="text-center font-semibold text-[var(--brand)]">Häufige Fragen</p>
        <h2 className="mt-3 text-center text-3xl font-bold sm:text-4xl">
          Was ihr vor dem Start wissen solltet
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
          <p className="font-semibold text-white/65">Weniger Abstimmung. Mehr Überblick.</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Eure Sachen. Euer LeihNest.</h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-white/70">
            Erstellt euren privaten Gruppenbereich und organisiert gemeinsame Gegenstände vom ersten Eintrag bis zur Rückgabe.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-[var(--foreground)]"
            >
              LeihNest anlegen
            </Link>
            <Link
              href="/kontakt"
              className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white"
            >
              Fragen? Kontakt aufnehmen
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
              Gemeinsam nutzen. Einfach organisiert. Ein Produkt von Kamilunavo.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 font-semibold text-[var(--foreground)]">
            <Link href="/en">English</Link>
            <Link href="/kontakt">Kontakt</Link>
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
