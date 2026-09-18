"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { safeNextPath } from "@/features/auth/safe-next-path";

export function AuthForm({
  mode,
  redirectTo = "/app",
}: {
  mode: "login" | "register";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const result =
      mode === "login"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            name: String(formData.get("name")),
            email,
            password,
          });

    setBusy(false);

    if (result.error) {
      setError(result.error.message ?? "Anmeldung fehlgeschlagen.");
      return;
    }

    router.push(safeNextPath(redirectTo));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4">
      {mode === "register" && (
        <label className="grid gap-2 text-sm font-semibold">
          Name
          <input name="name" className="rounded-xl border border-[var(--line)] px-4 py-3" required minLength={2} />
        </label>
      )}
      <label className="grid gap-2 text-sm font-semibold">
        E-Mail
        <input name="email" className="rounded-xl border border-[var(--line)] px-4 py-3" type="email" autoComplete="email" required />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Passwort
        <input
          name="password"
          className="rounded-xl border border-[var(--line)] px-4 py-3"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
        />
      </label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white disabled:opacity-60" type="submit">
        {busy ? "Bitte warten…" : mode === "login" ? "Anmelden" : "Konto erstellen"}
      </button>
    </form>
  );
}
