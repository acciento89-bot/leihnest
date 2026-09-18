import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canManageReservations, type GroupRole } from "@/features/groups/permissions";
import { createReservationAction, reservationAction } from "../actions";

type ReservationsPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { error } = await searchParams;
  const membership = await getPrimaryMembership(session.user.id);
  if (!membership) return <p>Bitte zuerst eine Gruppe erstellen.</p>;

  const [items, reservations] = await Promise.all([
    db.item.findMany({
      where: { groupId: membership.groupId, active: true },
      orderBy: { name: "asc" },
    }),
    db.reservation.findMany({
      where: { groupId: membership.groupId },
      include: { item: true, user: true },
      orderBy: { startsAt: "desc" },
      take: 100,
    }),
  ]);

  const manage = canManageReservations(membership.role as GroupRole);

  return (
    <section>
      <h1 className="text-4xl font-bold">Reservierungen</h1>

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <form action={createReservationAction} className="mt-8 grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 md:grid-cols-2">
        <select name="itemId" required className="rounded-xl border p-3">
          <option value="">Gegenstand wählen</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.name} ({item.totalQuantity})</option>
          ))}
        </select>
        <input name="quantity" type="number" min="1" defaultValue="1" className="rounded-xl border p-3" />
        <input name="startsAt" type="datetime-local" required className="rounded-xl border p-3" />
        <input name="endsAt" type="datetime-local" required className="rounded-xl border p-3" />
        <input name="purpose" placeholder="Zweck (optional)" className="rounded-xl border p-3 md:col-span-2" />
        <button className="rounded-xl bg-[var(--brand)] p-3 font-semibold text-white md:col-span-2">
          Reservierung anfragen
        </button>
      </form>

      <div className="mt-8 grid gap-3">
        {reservations.map((reservation) => (
          <article key={reservation.id} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{reservation.item.name} · {reservation.quantity}×</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {reservation.user.name} · {reservation.startsAt.toLocaleString("de-DE")} – {reservation.endsAt.toLocaleString("de-DE")}
                </p>
                {reservation.purpose && (
                  <p className="mt-2 text-sm text-[var(--muted)]">Zweck: {reservation.purpose}</p>
                )}
                {reservation.returnNote && (
                  <p className="mt-2 rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-sm">
                    <strong>Rückgabehinweis:</strong> {reservation.returnNote}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-bold">
                {reservation.status}
              </span>
            </div>

            <form action={reservationAction} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="reservationId" value={reservation.id} />

              {manage && reservation.status === "PENDING" && (
                <>
                  <button name="action" value="approve" className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white">
                    Freigeben
                  </button>
                  <button name="action" value="reject" className="rounded-lg border px-3 py-2 text-sm">
                    Ablehnen
                  </button>
                </>
              )}

              {manage && reservation.status === "APPROVED" && (
                <button name="action" value="handover" className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm text-white">
                  Ausgabe bestätigen
                </button>
              )}

              {manage && reservation.status === "HANDED_OUT" && (
                <>
                  <label className="grid min-w-[240px] flex-1 gap-1 text-sm font-semibold">
                    Rückgabehinweis
                    <input
                      name="returnNote"
                      maxLength={500}
                      placeholder="z. B. vollständig und ohne Schäden"
                      className="rounded-lg border px-3 py-2 font-normal"
                    />
                  </label>
                  <button name="action" value="return" className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm text-white">
                    Rückgabe bestätigen
                  </button>
                </>
              )}

              {reservation.userId === session.user.id && ["PENDING", "APPROVED"].includes(reservation.status) && (
                <button name="action" value="cancel" className="rounded-lg border px-3 py-2 text-sm">
                  Stornieren
                </button>
              )}
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
