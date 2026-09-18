import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { acceptInvitationAction } from "./actions";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const next = `/invite/${token}`;

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-lg rounded-3xl border border-[var(--line)] bg-white p-8 shadow-xl shadow-black/5">
        <Link href="/" className="font-bold text-[var(--brand)]">← LeihNest</Link>
        <h1 className="mt-8 text-3xl font-bold">Einladung zu LeihNest</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          Diese Einladung ist an eine bestimmte E-Mail-Adresse gebunden und sieben Tage gültig.
        </p>

        {session ? (
          <form action={acceptInvitationAction.bind(null, token)} className="mt-8">
            <p className="mb-4 text-sm text-[var(--muted)]">
              Angemeldet als <strong>{session.user.email}</strong>
            </p>
            <button className="w-full rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white">
              Einladung annehmen
            </button>
          </form>
        ) : (
          <div className="mt-8 grid gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="rounded-xl bg-[var(--brand)] px-5 py-3 text-center font-semibold text-white"
            >
              Anmelden
            </Link>
            <Link
              href={`/register?next=${encodeURIComponent(next)}`}
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-center font-semibold"
            >
              Konto erstellen
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
