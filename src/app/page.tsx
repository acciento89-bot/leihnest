import Link from "next/link";

const items = [
  ["Pavillon", "2 verfügbar", "Vereinslager"],
  ["Bierzeltgarnituren", "6 verfügbar", "Garage"],
  ["Beamer", "1 verfügbar", "Büro"],
  ["Musikanlage", "2 verfügbar", "Technikraum"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand)] text-white">L</span>LeihNest</Link>
        <nav className="flex items-center gap-3"><a className="hidden sm:block" href="#funktionen">Funktionen</a><Link className="rounded-xl border border-[var(--line)] bg-white px-4 py-2" href="/login">Anmelden</Link></nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-2 lg:items-center">
        <div><span className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)]">Für Vereine, Gruppen & Gemeinschaften</span><h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">Gemeinsam nutzen.<br/><span className="text-[var(--brand)]">Einfach organisiert.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">LeihNest bringt eure gemeinsamen Gegenstände, Reservierungen, Übergaben und Rückgaben an einen Ort. Schluss mit Chat-Nachrichten, Listen und Doppelbuchungen.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-white">Kostenlos starten</Link><a href="#funktionen" className="rounded-xl border border-[var(--line)] bg-white px-6 py-3 font-semibold">So funktioniert’s</a></div></div>
        <div className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-xl shadow-black/5"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm text-[var(--muted)]">Euer LeihNest</p><h2 className="text-xl font-bold">Vereinsgemeinschaft</h2></div><span className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--brand-dark)]">12 Mitglieder</span></div><div className="grid gap-3 sm:grid-cols-2">{items.map(([name, available, location]) => <article key={name} className="rounded-2xl border border-[var(--line)] p-4"><div className="mb-4 grid aspect-[16/8] place-items-center rounded-xl bg-[var(--surface-soft)] text-3xl">◫</div><h3 className="font-bold">{name}</h3><p className="mt-1 text-sm text-[var(--brand)]">● {available}</p><p className="mt-1 text-sm text-[var(--muted)]">{location}</p></article>)}</div></div>
      </section>

      <section id="funktionen" className="border-y border-[var(--line)] bg-white"><div className="mx-auto max-w-6xl px-6 py-20"><p className="text-center font-semibold text-[var(--brand)]">Ein Ablauf statt fünf Listen</p><h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-bold">Vom Gegenstand bis zur Rückgabe</h2><div className="mt-12 grid gap-5 md:grid-cols-3">{[["01", "Erfassen", "Gegenstände, Stückzahlen, Zubehör und Lagerort zentral pflegen."],["02", "Reservieren", "Zeitraum und Menge wählen. LeihNest prüft die echte Verfügbarkeit."],["03", "Zurückgeben", "Übergabe und Rückgabe dokumentieren. Überfälliges bleibt sichtbar."]].map(([n,t,d]) => <article key={n} className="rounded-3xl bg-[var(--background)] p-7"><span className="font-bold text-[var(--brand)]">{n}</span><h3 className="mt-5 text-xl font-bold">{t}</h3><p className="mt-3 leading-7 text-[var(--muted)]">{d}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-6xl px-6 py-20"><div className="rounded-[2rem] bg-[var(--foreground)] px-7 py-12 text-center text-white sm:px-12"><h2 className="text-3xl font-bold">Eure Sachen. Euer LeihNest.</h2><p className="mx-auto mt-4 max-w-xl text-white/70">Startet mit einer Gruppe und bringt Ordnung in gemeinsame Ausrüstung – ohne öffentlichen Marktplatz und ohne komplizierte Verwaltung.</p><Link href="/register" className="mt-7 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-[var(--foreground)]">LeihNest anlegen</Link></div></section>
    </main>
  );
}
