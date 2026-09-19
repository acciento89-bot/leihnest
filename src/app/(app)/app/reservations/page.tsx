import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canManageReservations } from "@/features/groups/permissions";
import { getWorkspaceText } from "@/features/workspace/locale";
import { pageNumber, reservationFilter } from "@/features/workspace/workspace";
import { PageHeading, NoGroup, EmptyState, Flash, Field, Icon, StatusBadge } from "@/components/app/workspace-ui";
import { ActionForm, SubmitButton, LocalTime } from "@/components/app/workspace-controls";
import { createReservationAction, reservationAction } from "../actions";

type ReservationsPageProps={searchParams:Promise<{error?:string;filter?:string;page?:string;item?:string;new?:string}>};
const PAGE_SIZE=20;
export default async function ReservationsPage({searchParams}:ReservationsPageProps){
  const session=await auth.api.getSession({headers:await headers()});if(!session)return null;
  const [params,{locale,t},membership]=await Promise.all([searchParams,getWorkspaceText(),getPrimaryMembership(session.user.id)]);
  if(!membership)return <NoGroup locale={locale}/>;
  const filter=reservationFilter(params.filter);
  const where:Prisma.ReservationWhereInput={groupId:membership.groupId};
  if(filter==="active")where.status={in:["PENDING","APPROVED","HANDED_OUT"]};
  if(filter==="pending")where.status="PENDING";
  if(filter==="borrowed")where.status="HANDED_OUT";
  if(filter==="history")where.status={in:["RETURNED","REJECTED","CANCELLED"]};
  if(filter==="mine")where.userId=session.user.id;
  const [items,count]=await Promise.all([
    db.item.findMany({where:{groupId:membership.groupId,active:true},orderBy:{name:"asc"}}),
    db.reservation.count({where}),
  ]);
  const pages=Math.max(1,Math.ceil(count/PAGE_SIZE));const page=Math.min(pageNumber(params.page),pages);
  const reservations=await db.reservation.findMany({where,include:{item:true,user:true},orderBy:[{startsAt:filter==="history"?"desc":"asc"},{id:"asc"}],skip:(page-1)*PAGE_SIZE,take:PAGE_SIZE});
  const manage=canManageReservations(membership.role);
  const selected=items.find(item=>item.id===params.item);
  const tabs=[["active",t.active],["mine",t.mine],["pending",t.pending],["borrowed",t.borrowed],["history",t.history],["all",t.all]] as const;
  return <section><PageHeading title={t.reservations} description={t.reservationsHint} action={items.length>0 && <Link className="ws-button" href="/app/reservations?new=1#new-reservation"><Icon name="plus"/>{t.newReservation}</Link>}/><Flash error={params.error}/>
    {items.length>0 ? <details id="new-reservation" className="ws-card ws-disclosure" open={params.new==="1" || !!selected || !!params.error}><summary>{t.newReservation}</summary><ActionForm action={createReservationAction} locale={locale} resetOnSuccess>
      <div className="ws-form-grid"><Field label={t.chooseItem}><select name="itemId" required defaultValue={selected?.id ?? ""}><option value="" disabled>{t.chooseItem}</option>{items.map(item=><option key={item.id} value={item.id}>{item.name} ({item.totalQuantity} {t.total})</option>)}</select></Field>
      <Field label={t.quantity}><input type="number" name="quantity" min={1} max={9999} step={1} required defaultValue={1}/></Field>
      <Field label={t.collection}><input type="datetime-local" name="startsAt" required/></Field><Field label={t.returnDate}><input type="datetime-local" name="endsAt" required/></Field>
      <div className="ws-full"><Field label={`${t.purpose} (${t.optional})`}><textarea name="purpose" maxLength={300}/></Field></div></div>
      <p className="ws-muted">{t.periodHint}</p><div><SubmitButton locale={locale}>{t.requestReservation}</SubmitButton></div>
    </ActionForm></details> : <div className="ws-panel ws-inline"><p className="ws-muted">{t.memberEmptyItems}</p><Link className="ws-link" href="/app/items">{t.items}<Icon name="arrow"/></Link></div>}
    <nav className="ws-tabs" aria-label={t.reservations}>{tabs.map(([value,label])=><Link key={value} href={`/app/reservations?filter=${value}`} aria-current={filter===value?"page":undefined}>{label}</Link>)}</nav>
    {reservations.length ? <div className="ws-list">{reservations.map(reservation=>{
      const active=["PENDING","APPROVED","HANDED_OUT"].includes(reservation.status);
      const canCancel=reservation.userId===session.user.id && ["PENDING","APPROVED"].includes(reservation.status);
      return <article key={reservation.id} className="ws-card ws-reservation" id={`reservation-${reservation.id}`}><div className="ws-reservation-header"><div><h2>{reservation.item.name} <span className="ws-muted">{reservation.quantity} &times;</span></h2><p className="ws-muted">{t.requestedBy} {reservation.user.name}{reservation.userId===session.user.id?` (${t.you})`:""}</p></div><StatusBadge status={reservation.status} locale={locale}/></div>
        <dl className="ws-dates"><div><dt>{t.collection}</dt><dd><LocalTime value={reservation.startsAt.toISOString()} locale={locale}/></dd></div><div><dt>{t.returnDate}</dt><dd><LocalTime value={reservation.endsAt.toISOString()} locale={locale}/></dd></div></dl>
        {reservation.status==="HANDED_OUT" && reservation.endsAt<new Date() && <p className="ws-feedback ws-error">{t.overdueHint}</p>}
        {reservation.purpose && <p className="ws-muted">{reservation.purpose}</p>}
        {reservation.returnNote && <p className="ws-note"><strong>{t.returnNote}: </strong>{reservation.returnNote}</p>}
        {!active && <p className="ws-muted" style={{marginTop:14}}>{t.completedHint}</p>}
        {((manage && active) || canCancel) && <ActionForm action={reservationAction} locale={locale}><input type="hidden" name="reservationId" value={reservation.id}/><div className="ws-form-actions">
          {manage && reservation.status==="PENDING" && <><SubmitButton name="action" value="approve" locale={locale}>{t.approve}</SubmitButton><SubmitButton name="action" value="reject" locale={locale} secondary>{t.reject}</SubmitButton></>}
          {manage && reservation.status==="APPROVED" && <SubmitButton name="action" value="handover" locale={locale}>{t.confirmHandover}</SubmitButton>}
          {manage && reservation.status==="HANDED_OUT" && <><Field label={`${t.returnNote} (${t.optional})`}><input name="returnNote" maxLength={500} placeholder={t.returnNoteHint}/></Field><SubmitButton name="action" value="return" locale={locale}>{t.confirmReturn}</SubmitButton></>}
          {canCancel && <SubmitButton name="action" value="cancel" locale={locale} secondary confirm={t.cancelConfirm}>{t.cancelReservation}</SubmitButton>}
        </div></ActionForm>}
      </article>;
    })}</div> : <EmptyState title={t.emptyReservations} description={t.emptyReservationsHint}><Link className="ws-button ws-secondary" href="/app/items">{t.items}</Link></EmptyState>}
    {pages>1 && <nav className="ws-pagination" aria-label={t.page}>{page>1 && <Link className="ws-button ws-secondary" href={`/app/reservations?filter=${filter}&page=${page-1}`}>{t.previous}</Link>}<span>{t.page} {page} {t.of} {pages}</span>{page<pages && <Link className="ws-button ws-secondary" href={`/app/reservations?filter=${filter}&page=${page+1}`}>{t.next}</Link>}</nav>}
  </section>;
}
