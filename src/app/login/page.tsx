import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNextPath } from "@/features/auth/safe-next-path";

export const metadata: Metadata = {
  title: "Anmelden",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; lang?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, lang } = await searchParams;
  const redirectTo = safeNextPath(next);
  const locale = lang === "en" ? "en" : "de";
  const homeHref = locale === "en" ? "/en" : "/";
  const registerHref =
    `/register?next=${encodeURIComponent(redirectTo)}${locale === "en" ? "&lang=en" : ""}`;

  const text =
    locale === "en"
      ? {
          back: "← Back to LeihNest",
          eyebrow: "Your private workspace",
          title: "Welcome back",
          description: "Sign in to manage shared items, reservations and returns.",
          switchLabel: "No account yet?",
          switchAction: "Create account",
        }
      : {
          back: "← Zurück zu LeihNest",
          eyebrow: "Euer geschützter Bereich",
          title: "Willkommen zurück",
          description: "Melde dich an, um Gegenstände, Reservierungen und Rückgaben zu verwalten.",
          switchLabel: "Noch kein Konto?",
          switchAction: "Registrieren",
        };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-[2rem] border border-[var(--line)] bg-white p-7 shadow-xl shadow-black/5 sm:p-9">
        <div className="flex items-center justify-between gap-4">
          <Link href={homeHref} className="text-sm font-semibold text-[var(--brand)]">
            {text.back}
          </Link>
          <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-bold text-[var(--brand-dark)]">
            {locale === "en" ? "EN" : "DE"}
          </span>
        </div>

        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          {text.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold">{text.title}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{text.description}</p>

        <AuthForm mode="login" redirectTo={redirectTo} locale={locale} />

        <p className="mt-6 text-sm text-[var(--muted)]">
          {text.switchLabel}{" "}
          <Link className="font-semibold text-[var(--brand)]" href={registerHref}>
            {text.switchAction}
          </Link>
        </p>
      </section>
    </main>
  );
}
