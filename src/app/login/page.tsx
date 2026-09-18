import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNextPath } from "@/features/auth/safe-next-path";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const redirectTo = safeNextPath(next);

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-8 shadow-xl shadow-black/5">
        <Link href="/" className="font-bold text-[var(--brand)]">← LeihNest</Link>
        <h1 className="mt-8 text-3xl font-bold">Willkommen zurück</h1>
        <p className="mt-2 text-[var(--muted)]">Melde dich an, um dein LeihNest zu verwalten.</p>
        <AuthForm mode="login" redirectTo={redirectTo} />
        <p className="mt-6 text-sm text-[var(--muted)]">
          Noch kein Konto?{" "}
          <Link className="font-semibold text-[var(--brand)]" href={`/register?next=${encodeURIComponent(redirectTo)}`}>
            Registrieren
          </Link>
        </p>
      </section>
    </main>
  );
}
