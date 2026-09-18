import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canManageInventory, type GroupRole } from "@/features/groups/permissions";
import { createItemAction, itemAction } from "../actions";

export default async function ItemsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const membership = await getPrimaryMembership(session.user.id);
  if (!membership) return <p>Bitte zuerst eine Gruppe erstellen.</p>;

  const items = await db.item.findMany({
    where: { groupId: membership.groupId, active: true },
    orderBy: { name: "asc" },
  });

  const manage = canManageInventory(membership.role as GroupRole);

  return (
    <section>
      <h1 className="text-4xl font-bold">Gegenstände</h1>

      {manage && (
        <form action={createItemAction} className="mt-8 grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 sm:grid-cols-2">
          <input name="name" required placeholder="Name" className="rounded-xl border p-3" />
          <input name="location" placeholder="Lagerort" className="rounded-xl border p-3" />
          <input name="totalQuantity" type="number" min="1" defaultValue="1" className="rounded-xl border p-3" />
          <input name="description" placeholder="Beschreibung" className="rounded-xl border p-3" />
          <button className="rounded-xl bg-[var(--brand)] p-3 font-semibold text-white sm:col-span-2">
            Gegenstand hinzufügen
          </button>
        </form>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="mb-4 grid aspect-[16/8] place-items-center rounded-xl bg-[var(--surface-soft)] text-3xl">◫</div>
            {manage ? (
              <form action={itemAction} className="grid gap-3">
                <input type="hidden" name="itemId" value={item.id} />
                <input name="name" required defaultValue={item.name} className="rounded-xl border p-3 font-bold" />
                <input name="location" defaultValue={item.location ?? ""} placeholder="Lagerort" className="rounded-xl border p-3" />
                <input name="totalQuantity" type="number" min="1" defaultValue={item.totalQuantity} className="rounded-xl border p-3" />
                <input name="description" defaultValue={item.description ?? ""} placeholder="Beschreibung" className="rounded-xl border p-3" />
                <div className="flex flex-wrap gap-2">
                  <button name="action" value="update" className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white">
                    Speichern
                  </button>
                  <button name="action" value="archive" className="rounded-lg border px-3 py-2 text-sm">
                    Archivieren
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-lg font-bold">{item.name}</h2>
                <p className="mt-2 text-sm text-[var(--brand)]">{item.totalQuantity} Stück</p>
                <p className="text-sm text-[var(--muted)]">{item.location || "Kein Lagerort"}</p>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
