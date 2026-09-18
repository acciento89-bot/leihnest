import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { aggregateDashboard } from "@/features/dashboard/aggregate";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { createGroupAction } from "./actions";

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const membership = await getPrimaryMembership(session.user.id);

  if (!membership) {
    return (
      <section className="mx-auto max-w-xl py-16">
        <p className="font-semibold text-[var(--brand)]">Willkommen bei LeihNest</p>
        <h1 className="mt-3 text-4xl font-bold">Erstelle eure erste Gruppe</h1>
        <p className="mt-4 text-[var(--muted)]">
          Danach kannst du Gegenstände erfassen und Mitglieder einladen.
        </p>
        <form action={createGroupAction} className="mt-8 flex gap-3">
          <input
            name="name"
            required
            minLength={2}
            placeholder="z. B. Gartenverein Nord"
            className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-white px-4 py-3"
          />
          <button className="rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white">
            Gruppe erstellen
          </button>
        </form>
      </section>
    );
  }

  const [items, reservations] = await Promise.all([
    db.item.count({ where: { groupId: membership.groupId, active: true } }),
    db.reservation.findMany({
      where: { groupId: membership.groupId },
      select: { status: true, endsAt: true },
    }),
  ]);

  const summary = aggregateDashboard(reservations);

  const cards = [
    ["Gegenstände", items],
    ["Offene Anfragen", summary.pending],
    ["Ausgeliehen", summary.borrowed],
    ["Bald fällig", summary.dueSoon],
    ["Überfällig", summary.overdue],
  ] as const;

  return (
    <section>
      <p className="font-semibold text-[var(--brand)]">{membership.group.name}</p>
      <h1 className="mt-2 text-4xl font-bold">Übersicht</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
