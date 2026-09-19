"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { safeNextPath } from "@/features/auth/safe-next-path";

const copy = {
  de: {
    name: "Name",
    email: "E-Mail",
    password: "Passwort",
    waiting: "Bitte warten…",
    signIn: "Anmelden",
    createAccount: "Konto erstellen",
    error: "Anmeldung fehlgeschlagen.",
  },
  en: {
    name: "Name",
    email: "Email",
    password: "Password",
    waiting: "Please wait…",
    signIn: "Sign in",
    createAccount: "Create account",
    error: "Authentication failed.",
  },
} as const;

export function AuthForm({
  mode,
  redirectTo = "/app",
  locale = "de",
}: {
  mode: "login" | "register";
  redirectTo?: string;
  locale?: "de" | "en";
}) {
  const router = useRouter();
  const labels = copy[locale];
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    try {
      const result = mode === "login"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name: String(formData.get("name")), email, password });
      if (result.error) { setError(labels.error); return; }
      document.cookie = `leihnest-language=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      router.push(safeNextPath(redirectTo));
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4">
      {mode === "register" && (
        <label className="grid gap-2 text-sm font-semibold">
          {labels.name}
          <input
            name="name"
            className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--surface-soft)]"
            required
            minLength={2}
          />
        </label>
      )}

      <label className="grid gap-2 text-sm font-semibold">
        {labels.email}
        <input
          name="email"
          className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--surface-soft)]"
          type="email"
          autoComplete="email"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        {labels.password}
        <input
          name="password"
          className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--surface-soft)]"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
        />
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        disabled={busy}
        className="rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
      >
        {busy
          ? labels.waiting
          : mode === "login"
            ? labels.signIn
            : labels.createAccount}
      </button>
    </form>
  );
}
