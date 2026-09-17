"use client";

import { FormEvent } from "react";

const CONTACT_EMAIL = "contact@kamilunavo.com";

export function ContactForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    const mailSubject = subject ? `LeihNest: ${subject}` : "LeihNest Kontaktanfrage";
    const body = [
      `Name: ${name}`,
      `E-Mail: ${email}`,
      "",
      message,
    ].join("\n");

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Name
          <input name="name" maxLength={120} autoComplete="name" required className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--brand)]" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          E-Mail
          <input name="email" type="email" maxLength={254} autoComplete="email" required className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--brand)]" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Betreff
        <input name="subject" maxLength={160} required className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--brand)]" />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Nachricht
        <textarea name="message" maxLength={5000} rows={7} required className="resize-y rounded-xl border border-[var(--line)] bg-white px-4 py-3 font-normal outline-none focus:border-[var(--brand)]" />
      </label>

      <p className="text-sm leading-6 text-[var(--muted)]">
        Beim Absenden öffnet LeihNest dein E-Mail-Programm mit einer vorbereiteten Nachricht. Die Formulardaten werden nicht an einen LeihNest-Formularserver übertragen. Eine Verarbeitung durch Kamilunavo beginnt erst, wenn du die E-Mail tatsächlich versendest.
      </p>

      <button type="submit" className="justify-self-start rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--brand-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2">
        E-Mail vorbereiten
      </button>
    </form>
  );
}
