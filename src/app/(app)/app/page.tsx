import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { aggregateDashboard } from "@/features/dashboard/aggregate";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canManageInventory } from "@/features/groups/permissions";
import { getWorkspaceText } from "@/features/workspace/locale";
import { PageHeading, EmptyState, Flash, Field, Icon, StatusBadge } from "@/components/app/workspace-ui";
import { ActionForm, SubmitButton, LocalTime } from "@/components/app/workspace-controls";
import { createGroupAction } from "./actions";

type DashboardProps={ searchParams:Promise<{error?:string}> };
export default async function Dashboard({ searchParams }: DashboardProps) {
  const session=await auth.api.getSession({headers:await headers()});
  if (!session) return null;
  const [{error},{locale,t},membership]=await Promise.all([searchParams,getWorkspaceText(),getPrimaryMembership(session.user.id)]);
  if (!membership) return <section className="ws-welcome"><div className="ws-welcome-intro"><span className="ws-action-icon"><Icon name="home"/></span><p className="ws-eyebrow">{t.welcome}</p><h1>{t.firstGroup}</h1><p className="ws-muted">{t.firstGroupHint}</p><div className="ws-steps">
    {[[t.stepInventory,t.stepInventoryHint],[t.stepMembers,t.stepMembersHint],[t.stepBorrow,t.stepBorrowHint]].map(([title,hint],index)=><div className="ws-step" key={title}><span>{index+1}</span><div><h3>{title}</h3><p>{hint}</p></div></div>)}
    </div></div><div className="ws-panel"><h2>{t.createGroup}</h2><p className="ws-muted" style={{marginTop:8,marginBottom:22}}>{t.groupNameHint}</p><Flash error={error}/><ActionForm action={createGroupAction} locale={locale}><Field label={t.groupName}><input name="name" required minLength={2} maxLength={80} placeholder={t.groupExample} autoComplete="organization"/></Field><SubmitButton locale={locale}>{t.createGroup}<Icon name="arrow"/></SubmitButton></ActionForm><p className="ws-note">{t.invitedHint}</p></div></section>;
  const [items,reservations,upcoming]=await Promise.all([
    db.item.count({where:{groupId:membership.groupId,active:true}}),
    db.reservation.findMany({where:{groupId:membership.groupId},select:{status:true,endsAt:true}}),
    db.reservation.findMany({where:{groupId:membership.groupId,status:{in:["PENDING","APPROVED","HANDED_OUT"]}},include:{item:true,user:true},orderBy:{startsAt:"asc"},take:5}),
  ]);
  const summary=aggregateDashboard(reservations); const manage=canManageInventory(membership.role);
  const cards=[ [t.items,items,"/app/items","box"], [t.pending,summary.pending,"/app/reservations?filter=pending","calendar"], [t.borrowed,summary.borrowed,"/app/reservations?filter=borrowed","box"], [t.dueSoon,summary.dueSoon,"/app/reservations?filter=borrowed","calendar"], [t.overdue,summary.overdue,"/app/reservations?filter=borrowed","calendar"] ] as const;
  const actions=manage ? [ [t.addItem,t.addItemHint,"/app/items?new=1#new-item","box"], [t.reserve,t.reserveHint,"/app/reservations?new=1#new-reservation","calendar"], [t.invite,t.inviteHint,"/app/members?new=1#new-invitation","people"] ] as const : [ [t.items,t.inventoryHint,"/app/items","box"], [t.reserve,t.reserveHint,"/app/reservations?new=1#new-reservation","calendar"], [t.members,t.membersHint,"/app/members","people"] ] as const;
  return <section><PageHeading eyebrow={membership.group.name} title={`${t.greeting}, ${session.user.name.split(" ")[0]}`} description={t.overviewHint} action={<Link href="/app/reservations?new=1#new-reservation" className="ws-button"><Icon name="plus"/>{t.newReservation}</Link>}/><Flash error={error}/>
    <div className="ws-stats">{cards.map(([label,value,href,icon],index)=><Link className={`ws-card ws-stat ${index===4 && value>0 ? "warn" : ""}`} href={href} key={label}><Icon name={icon}/><strong>{value}</strong><span>{label}</span></Link>)}</div>
    <div className="ws-section"><div className="ws-section-title"><div><h2>{t.nextSteps}</h2><p className="ws-muted">{t.nextStepsHint}</p></div></div><div className="ws-actions">{actions.map(([label,hint,href,icon])=><Link className="ws-card ws-quick-action" href={href} key={label}><span className="ws-action-icon"><Icon name={icon}/></span><div><h3>{label}</h3><p>{hint}</p></div><Icon name="arrow"/></Link>)}</div></div>
    <div className="ws-section"><div className="ws-section-title"><h2>{t.upcoming}</h2><Link className="ws-link" href="/app/reservations">{t.viewAll}<Icon name="arrow"/></Link></div>{upcoming.length ? <div className="ws-list">{upcoming.map(row=><Link href="/app/reservations" key={row.id} className="ws-card ws-loan-row"><span className="ws-action-icon"><Icon name="calendar"/></span><div><h3>{row.item.name}</h3><p className="ws-muted">{row.user.name} &middot; {row.quantity} &times;</p><LocalTime value={row.startsAt.toISOString()} locale={locale}/></div><StatusBadge status={row.status} locale={locale}/></Link>)}</div> : <EmptyState title={t.noUpcoming} description={t.noUpcomingHint}><Link href="/app/items" className="ws-button ws-secondary">{t.items}</Link></EmptyState>}</div>
  </section>;
}
