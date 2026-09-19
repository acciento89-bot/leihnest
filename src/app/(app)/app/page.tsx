import { DashboardView } from "@/components/design/dashboard-view";
import { PlusAnalyticsPanel } from "@/components/app/plus-analytics-panel";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canManageInventory } from "@/features/groups/permissions";
import { hasPlus } from "@/features/billing/entitlements";
import { getPlusAnalytics } from "@/features/analytics/plus-analytics";
import { getWorkspaceText } from "@/features/workspace/locale";
import { Flash, Field, Icon } from "@/components/app/workspace-ui";
import { ActionForm, SubmitButton } from "@/components/app/workspace-controls";
import { createGroupAction } from "./actions";

type DashboardProps={ searchParams:Promise<{error?:string}> };
export default async function Dashboard({ searchParams }: DashboardProps) {
  const session=await auth.api.getSession({headers:await headers()});
  if (!session) return null;
  const [{error},{locale,t},membership]=await Promise.all([searchParams,getWorkspaceText(),getPrimaryMembership(session.user.id)]);
  if (!membership) return <section className="ws-welcome"><div className="ws-welcome-intro"><span className="ws-action-icon"><Icon name="home"/></span><p className="ws-eyebrow">{t.welcome}</p><h1>{t.firstGroup}</h1><p className="ws-muted">{t.firstGroupHint}</p><div className="ws-steps">
    {[[t.stepInventory,t.stepInventoryHint],[t.stepMembers,t.stepMembersHint],[t.stepBorrow,t.stepBorrowHint]].map(([title,hint],index)=><div className="ws-step" key={title}><span>{index+1}</span><div><h3>{title}</h3><p>{hint}</p></div></div>)}
    </div></div><div className="ws-panel"><h2>{t.createGroup}</h2><p className="ws-muted" style={{marginTop:8,marginBottom:22}}>{t.groupNameHint}</p><Flash error={error}/><ActionForm action={createGroupAction} locale={locale}><Field label={t.groupName}><input name="name" required minLength={2} maxLength={80} placeholder={t.groupExample} autoComplete="organization"/></Field><SubmitButton locale={locale}>{t.createGroup}<Icon name="arrow"/></SubmitButton></ActionForm><p className="ws-note">{t.invitedHint}</p></div></section>;
  const [items,itemCount,loans,members,memberCount,subscription]=await Promise.all([
    db.item.findMany({where:{groupId:membership.groupId,active:true},orderBy:{name:"asc"},take:5,select:{id:true,name:true,totalQuantity:true,location:true,media:{where:{kind:"ITEM"},orderBy:{position:"asc"},take:1,select:{id:true}}}}),
    db.item.count({where:{groupId:membership.groupId,active:true}}),
    db.reservation.findMany({where:{groupId:membership.groupId},select:{id:true,itemId:true,quantity:true,status:true,startsAt:true,endsAt:true,createdAt:true,updatedAt:true,approvedAt:true,handedOutAt:true,returnedAt:true,item:{select:{id:true,name:true}},user:{select:{name:true}}}}),
    db.membership.findMany({where:{groupId:membership.groupId},orderBy:{createdAt:"asc"},take:7,select:{id:true,user:{select:{name:true}}}}),
    db.membership.count({where:{groupId:membership.groupId}}),
    db.groupSubscription.findUnique({where:{groupId:membership.groupId}}),
  ]);
  const plus=hasPlus(subscription);
  const analytics=plus&&canManageInventory(membership.role)?await getPlusAnalytics(membership.groupId):null;
  return <><Flash error={error}/><DashboardView locale={locale} name={session.user.name} groupName={membership.group.name} manage={canManageInventory(membership.role)} items={items.map(item=>({...item,imageId:item.media[0]?.id??null}))} itemCount={itemCount} loans={loans.map(row=>({...row,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),approvedAt:row.approvedAt?.toISOString() ?? null,handedOutAt:row.handedOutAt?.toISOString() ?? null,returnedAt:row.returnedAt?.toISOString() ?? null}))} members={members.map(member=>({id:member.id,name:member.user.name}))} memberCount={memberCount} now={new Date().toISOString()}/>{analytics&&<PlusAnalyticsPanel locale={locale} data={analytics}/>}</>;
}
