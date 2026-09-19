import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/site/marketing-shell";

export const metadata: Metadata = {
  title: "Funktionen",
  description: "Inventar, Reservierungen und Rückgaben mit LeihNest gemeinsam organisieren.",
  alternates: { canonical: "/funktionen", languages: { "de-DE": "/funktionen", en: "/en/features" } },
};

const features = [
  {
    id: "inventar",
    number: "01",
    title: "Inventar organisieren",
    lead: "Alle Dinge eurer Gruppe bekommen einen gemeinsamen, privaten Platz.",
    points: ["Gegenstände mit Name, Menge, Beschreibung und Lagerort erfassen", "Profil-, Gruppen- und Gegenstandsbilder nutzen", "Bestand durchsuchen und nicht mehr benötigte Gegenstände archivieren", "Free enthält ein Bild je Gegenstand; Plus erweitert auf bis zu fünf Bilder"],
  },
  {
    id: "reservierungen",
    number: "02",
    title: "Smarte Reservierungen",
    lead: "Von der Anfrage bis zur Ausgabe bleibt für alle nachvollziehbar, was wann gebraucht wird.",
    points: ["Mitglieder wählen Gegenstand, Abholung und Rückgabezeit", "Verantwortliche prüfen und bestätigen Anfragen", "Ausgabe wird erst nach tatsächlicher Übergabe bestätigt", "Aktuelle und eigene Ausleihen sind getrennt von der Historie sichtbar"],
  },
  {
    id: "rueckgaben",
    number: "03",
    title: "Rückgaben im Blick",
    lead: "Rückgaben verschwinden nicht im Chatverlauf, sondern bleiben Teil des gemeinsamen Ablaufs.",
    points: ["Fällige und überfällige Ausleihen erkennen", "Rückgaben mit optionalem Hinweis bestätigen", "Abgeschlossene Vorgänge bleiben im Verlauf nachvollziehbar", "Plus ergänzt Exporte und erweiterte Gruppenstatistiken"],
  },
] as const;

export default function Funktionen() {
  return <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
    <MarketingHeader locale="de" />
    <main className="mx-auto max-w-6xl px-6 pb-12 pt-10">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brand)]">LeihNest im Detail</p>
      <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-6xl">Drei Bausteine für gemeinsames Ausleihen.</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">LeihNest hält Inventar, Reservierungen und Rückgaben an einem Ort zusammen. Der Gruppenbereich bleibt privat und die Kernfunktionen können kostenlos genutzt werden.</p>
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
        <h2 className="text-3xl font-bold">Kostenlos anfangen, später entscheiden.</h2>
        <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">Free deckt den gemeinsamen Kern ab. LeihNest Plus ist optional und erweitert eure Gruppe um mehr Gegenstandsbilder, CSV-Exporte und zusätzliche Statistiken.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link className="rounded-xl bg-[var(--brand-dark)] px-5 py-3 font-semibold text-white" href="/register">LeihNest kostenlos starten</Link><Link className="rounded-xl border border-[var(--line)] bg-white px-5 py-3 font-semibold" href="/preise">Preise ansehen</Link></div>
      </section>
    </main>
    <MarketingFooter locale="de" />
  </div>;
}
