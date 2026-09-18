import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountControls } from "@/components/app/account-controls";

const navigation = [
  ["/app", "Übersicht"],
  ["/app/items", "Gegenstände"],
  ["/app/reservations", "Reservierungen"],
  ["/app/members", "Mitglieder"],
  ["/app/settings", "Einstellungen"],
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--line)] bg-white p-5 md:flex md:min-h-screen md:flex-col md:border-b-0 md:border-r">
        <Link href="/app" className="text-xl font-bold text-[var(--brand)]">
          LeihNest
        </Link>

        <nav className="mt-8 grid grid-cols-2 gap-2 text-sm md:grid-cols-1">
          {navigation.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-xl px-3 py-2 hover:bg-[var(--surface-soft)]">
              {label}
            </Link>
          ))}
        </nav>

        <div className="md:mt-auto">
          <AccountControls email={session.user.email} />
        </div>
      </aside>

      <main className="min-w-0 p-5 sm:p-8">{children}</main>
    </div>
  );
}
