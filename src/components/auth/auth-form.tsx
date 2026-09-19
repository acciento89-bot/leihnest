"use client";

import { FormEvent, useState, useId } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { NestIcon } from "@/components/design/icons";
import { safeNextPath } from "@/features/auth/safe-next-path";

const copy = {
  de: {
    name: "Name",
    email: "E-Mail-Adresse",
    emailHint: "deine@email.de",
    passwordHint: "Dein Passwort",
    nameHint: "Dein Name",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort verbergen",
    password: "Passwort",
    waiting: "Bitte warten…",
    signIn: "Anmelden",
    createAccount: "Konto erstellen",
    error: "Anmeldung fehlgeschlagen.",
  },
  en: {
    name: "Name",
    email: "Email address",
    emailHint: "you@example.com",
    passwordHint: "Your password",
    nameHint: "Your name",
    showPassword: "Show password",
    hidePassword: "Hide password",
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
  const [showPassword,setShowPassword]=useState(false);
  const formId=useId();

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

  const fieldClass="rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--surface-soft)]";
  return <form onSubmit={submit} className="mt-8 grid gap-4" aria-busy={busy}>
    {mode==="register" && <label className="grid gap-2 text-sm font-semibold">{labels.name}<span className="nest-input-shell"><NestIcon name="people"/><input name="name" className={fieldClass} placeholder={labels.nameHint} autoComplete="name" required minLength={2}/></span></label>}
    <label className="grid gap-2 text-sm font-semibold">{labels.email}<span className="nest-input-shell"><NestIcon name="mail"/><input name="email" className={fieldClass} type="email" autoComplete="email" required placeholder={labels.emailHint}/></span></label>
    <div className="grid gap-2 text-sm font-semibold nest-password-field"><label htmlFor={`${formId}-password`}>{labels.password}</label><div className="nest-input-shell"><NestIcon name="lock"/><input id={`${formId}-password`} name="password" className={fieldClass} type={showPassword?"text":"password"} autoComplete={mode==="login"?"current-password":"new-password"} required minLength={8} placeholder={labels.passwordHint}/><button type="button" className="nest-password-toggle" aria-label={showPassword?labels.hidePassword:labels.showPassword} aria-pressed={showPassword} aria-controls={`${formId}-password`} onClick={()=>setShowPassword(!showPassword)}><NestIcon name={showPassword?"eyeOff":"eye"}/></button></div></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60" type="submit">{busy?labels.waiting:mode==="login"?labels.signIn:labels.createAccount}{!busy && <NestIcon name="arrow"/>}</button>
  </form>;
}
