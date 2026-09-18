import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canInvite, type GroupRole } from "@/features/groups/permissions";
import { createInvitationAction } from "../actions";

type MembersPageProps = {
  searchParams: Promise<{ invite?: string; joined?: string; error?: string }>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const membership = await getPrimaryMembership(session.user.id);
  if (!membership) return <p>Bitte zuerst eine Gruppe erstellen.</p>;

  const params = await searchParams;
  const members = await db.membership.findMany({
    where: { groupId: membership.groupId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const manage = canInvite(membership.role as GroupRole);
  const invitePath = params.invite ? `/invite/${params.invite}` : null;

  return (
    <section>
      <h1 className="text-4xl font-bold">Mitglieder</h1>
      <p className="mt-3 text-[var(--muted)]">
        Lade Mitglieder per persönlichem Link ein. Einladungen sind sieben Tage gültig
        und an die angegebene E-Mail-Adresse gebunden.
      </p>

      {params.error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
          {params.error}
        </p>
      )}

      {params.joined === "1" && (
        <p className="mt-6 rounded-xl bg-[var(--surface-soft)] p-4 font-medium text-[var(--brand-dark)]">
          Einladung angenommen. Du bist jetzt Mitglied der Gruppe.
        </p>
      )}

      {manage && (
        <form action={createInvitationAction} className="mt-8 grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 sm:grid-cols-[1fr_auto_auto]">
          <input
            name="email"
            type="email"
            required
            placeholder="mitglied@example.com"
            className="rounded-xl border border-[var(--line)] px-4 py-3"
          />
          <select name="role" defaultValue="MEMBER" className="rounded-xl border border-[var(--line)] px-4 py-3">
            <option value="MEMBER">Mitglied</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button className="rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white">
            Einladungslink erstellen
          </button>
        </form>
      )}

      {invitePath && (
        <div className="mt-5 rounded-2xl border border-[var(--brand)] bg-[var(--surface-soft)] p-5">
          <p className="font-bold">Einladungslink erstellt</p>
          <p className="mt-2 break-all font-mono text-sm">{invitePath}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Teile diesen Link direkt mit der eingeladenen Person.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-3">
        {members.map((member) => (
          <article key={member.id} className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-white p-5">
            <div>
              <p className="font-bold">{member.user.name}</p>
              <p className="text-sm text-[var(--muted)]">{member.user.email}</p>
            </div>
            <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-bold">
              {member.role}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
