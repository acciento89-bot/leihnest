import Link from "next/link";

export default function Impressum() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm font-semibold text-[var(--brand)]">← Zurück zu LeihNest</Link>
      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Rechtliche Angaben</p>
      <h1 className="mt-3 text-4xl font-bold">Impressum</h1>
      <p className="mt-4 text-[var(--muted)]">Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).</p>

      <div className="mt-10 space-y-9 leading-7">
        <section>
          <h2 className="text-xl font-bold">Diensteanbieter</h2>
          <p className="mt-3"><strong>Piotr Kaminski – Kamilunavo</strong><br />Einzelunternehmen<br />Otto-Braun-Straße 14<br />40595 Düsseldorf<br />Deutschland</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Kontakt</h2>
          <p className="mt-3">E-Mail: <a className="text-[var(--brand-dark)] underline" href="mailto:contact@kamilunavo.com">contact@kamilunavo.com</a><br />Kontaktformular: <Link className="text-[var(--brand-dark)] underline" href="/kontakt">leihnest.de/kontakt</Link></p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Wirtschafts-Identifikationsnummer</h2>
          <p className="mt-3">Wirtschafts-Identifikationsnummer gemäß § 139c AO: <strong>DE464473083-00001</strong></p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Verbraucherstreitbeilegung</h2>
          <p className="mt-3">Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Inhalte und Urheberrecht</h2>
          <p className="mt-3">Die auf dieser Website veröffentlichten Inhalte, Designs, Produktnamen und sonstigen Werke sind nach den anwendbaren Vorschriften zum Schutz geistigen Eigentums geschützt. Eine Nutzung über die gesetzlichen Schranken hinaus bedarf der vorherigen Zustimmung des jeweiligen Rechteinhabers.</p>
        </section>
      </div>

      <nav className="mt-12 flex flex-wrap gap-5 border-t border-[var(--line)] pt-6 text-sm font-semibold">
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/kontakt">Kontakt</Link>
      </nav>
      <p className="mt-6 text-sm text-[var(--muted)]">Stand: 17. September 2026</p>
    </main>
  );
}
