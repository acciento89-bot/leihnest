import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canInvite } from "@/features/groups/permissions";
import { getWorkspaceText } from "@/features/workspace/locale";
import { initials } from "@/features/workspace/workspace";
import { PageHeading, NoGroup, Flash, Field, Icon } from "@/components/app/workspace-ui";
import { ActionForm, SubmitButton, CopyInvitation, LocalTime } from "@/components/app/workspace-controls";
import { createInvitationAction } from "../actions";

type MembersPageProps={searchParams:Promise<{invite?:string;joined?:string;error?:string;new?:string}>};
export default async function MembersPage({searchParams}:MembersPageProps){
  const session=await auth.api.getSession({headers:await headers()});if(!session)return null;
  const [params,{locale,t},membership]=await Promise.all([searchParams,getWorkspaceText(),getPrimaryMembership(session.user.id)]);
  if(!membership)return <NoGroup locale={locale}/>;
  const manage=canInvite(membership.role);
  const [members,invitations]=await Promise.all([
    db.membership.findMany({where:{groupId:membership.groupId},include:{user:true},orderBy:{createdAt:"asc"}}),
    manage ? db.invitation.findMany({where:{groupId:membership.groupId,acceptedAt:null,expiresAt:{gt:new Date()}},orderBy:{createdAt:"desc"},select:{id:true,email:true,role:true,expiresAt:true}}):Promise.resolve([]),
  ]);
  const inviteToken=params.invite && /^[a-zA-Z0-9_-]{20,200}$/.test(params.invite) ? params.invite : null;
  return <section><PageHeading title={t.members} description={t.membersHint} action={manage && <Link href="/app/members?new=1#new-invitation" className="ws-button"><Icon name="plus"/>{t.invite}</Link>}/><Flash error={params.error}/>
    {params.joined==="1" && <p className="ws-feedback ws-success" role="status">{t.joined}</p>}
    {manage && <details id="new-invitation" className="ws-card ws-disclosure" open={params.new==="1" || !!params.error}><summary>{t.invite}</summary><ActionForm action={createInvitationAction} locale={locale}><div className="ws-form-grid"><Field label={t.email}><input type="email" name="email" required maxLength={254} placeholder="name@example.com" autoComplete="off"/></Field><Field label={t.role}><select name="role" defaultValue="MEMBER"><option value="MEMBER">{t.roles.MEMBER}</option><option value="ADMIN">{t.roles.ADMIN}</option></select></Field></div><p className="ws-muted">{t.invitationInfo}</p><div><SubmitButton locale={locale}>{t.createInvite}</SubmitButton></div></ActionForm></details>}
    {manage && inviteToken && <CopyInvitation path={`/invite/${inviteToken}`} locale={locale}/>}
    <div className="ws-section-title"><h2>{members.length} {t.members}</h2><span className="ws-badge"><Icon name="shield"/>{t.privateGroup}</span></div>
    <div className="ws-list">{members.map(member=><article className="ws-card ws-member" key={member.id}><span className="ws-avatar" aria-hidden="true">{initials(member.user.name)}</span><div className="ws-member-info"><h2>{member.user.name}{member.userId===session.user.id && <span className="ws-muted"> ({t.you})</span>}</h2><p>{member.user.email}</p></div><span className="ws-badge">{t.roles[member.role]}</span></article>)}</div>
    <p className="ws-note">{t.rolesHint}</p>
    {manage && invitations.length>0 && <section className="ws-section"><div className="ws-section-title"><h2>{t.pendingInvites}</h2></div><div className="ws-list">{invitations.map(invitation=><article className="ws-card ws-member" key={invitation.id}><span className="ws-action-icon"><Icon name="people"/></span><div className="ws-member-info"><h2>{invitation.email}</h2><p>{t.expires}: <LocalTime value={invitation.expiresAt.toISOString()} locale={locale}/></p></div><span className="ws-badge">{t.roles[invitation.role]}</span></article>)}</div></section>}
  </section>;
}
