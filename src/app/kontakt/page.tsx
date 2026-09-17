import Link from "next/link";
import { ContactForm } from "@/components/site/contact-form";

export default function Kontakt() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm font-semibold text-[var(--brand)]">← Zurück zu LeihNest</Link>
      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Kontakt</p>
      <h1 className="mt-3 text-4xl font-bold">Wie können wir helfen?</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">Für Fragen zu LeihNest, deinem Konto, Datenschutz oder zur Nutzung des Dienstes erreichst du Kamilunavo direkt per E-Mail oder über das Kontaktformular.</p>

      <section className="mt-10 rounded-3xl bg-[var(--surface-soft)] p-6 sm:p-8">
        <h2 className="text-xl font-bold">Direkter Kontakt</h2>
        <p className="mt-3 leading-7">Piotr Kaminski – Kamilunavo<br /><a className="font-semibold text-[var(--brand-dark)] underline" href="mailto:contact@kamilunavo.com">contact@kamilunavo.com</a></p>
      </section>

      <ContactForm />

      <nav className="mt-12 flex flex-wrap gap-5 border-t border-[var(--line)] pt-6 text-sm font-semibold">
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutz</Link>
      </nav>
    </main>
  );
}
