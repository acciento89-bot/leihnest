import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNextPath } from "@/features/auth/safe-next-path";

type RegisterPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { next } = await searchParams;
  const redirectTo = safeNextPath(next);

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-8 shadow-xl shadow-black/5">
        <Link href="/" className="font-bold text-[var(--brand)]">← LeihNest</Link>
        <h1 className="mt-8 text-3xl font-bold">LeihNest starten</h1>
        <p className="mt-2 text-[var(--muted)]">Erstelle dein Konto. Danach kannst du deine Einladung annehmen.</p>
        <AuthForm mode="register" redirectTo={redirectTo} />
        <p className="mt-6 text-sm text-[var(--muted)]">
          Schon registriert?{" "}
          <Link className="font-semibold text-[var(--brand)]" href={`/login?next=${encodeURIComponent(redirectTo)}`}>
            Anmelden
          </Link>
        </p>
      </section>
    </main>
  );
}
