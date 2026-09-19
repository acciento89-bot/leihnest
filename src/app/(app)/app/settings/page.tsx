import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canManageGroupImage } from "@/features/groups/permissions";
import { getWorkspaceText } from "@/features/workspace/locale";
import { PageHeading, NoGroup, Field, Icon } from "@/components/app/workspace-ui";
import { ActionForm, SubmitButton } from "@/components/app/workspace-controls";
import { AccountControls } from "@/components/app/account-controls";
import { SingleImageControl } from "@/components/app/media-controls";
import { updateProfileAction, updateGroupAction, setLanguageAction } from "../actions";

export default async function SettingsPage(){
  const session=await auth.api.getSession({headers:await headers()});if(!session)return null;
  const [{locale,t},membership,profileMedia]=await Promise.all([
    getWorkspaceText(),
    getPrimaryMembership(session.user.id),
    db.mediaAsset.findFirst({where:{userId:session.user.id,kind:"PROFILE"},orderBy:{createdAt:"desc"}}),
  ]);
  const groupMedia=membership?await db.mediaAsset.findFirst({where:{groupId:membership.groupId,kind:"GROUP"},orderBy:{createdAt:"desc"}}):null;
  return <section><PageHeading title={t.settings} description={t.settingsHint}/><div className="ws-settings-grid">
    <section className="ws-panel"><h2>{t.profile}</h2><p className="ws-muted">{t.profileHint}</p><div className="ws-setting-media"><strong>{locale==="de"?"Profilbild":"Profile image"}</strong><SingleImageControl locale={locale} kind="profile" assetId={profileMedia?.id} canEdit fallbackLabel={session.user.name}/></div><ActionForm action={updateProfileAction} locale={locale}><Field label={t.displayName}><input name="name" required minLength={2} maxLength={80} defaultValue={session.user.name} autoComplete="name"/></Field><Field label={t.email}><input type="email" value={session.user.email} readOnly autoComplete="email"/></Field><div><SubmitButton locale={locale}>{t.saveProfile}</SubmitButton></div></ActionForm></section>
    <section className="ws-panel" id="group-settings"><h2>{t.groupSettings}</h2>{membership ? <><div className="ws-group-info"><span className="ws-action-icon"><Icon name="people"/></span><div><strong>{membership.group.name}</strong><small>{t.roles[membership.role]}</small></div></div><div className="ws-setting-media"><strong>{locale==="de"?"Gruppenbild":"Group image"}</strong><SingleImageControl locale={locale} kind="group" assetId={groupMedia?.id} canEdit={canManageGroupImage(membership.role)} fallbackLabel={membership.group.name}/></div>{membership.role==="OWNER" ? <ActionForm action={updateGroupAction} locale={locale}><Field label={t.groupName} hint={t.groupNameHint}><input name="name" required minLength={2} maxLength={80} defaultValue={membership.group.name}/></Field><div><SubmitButton locale={locale}>{t.saveGroup}</SubmitButton></div></ActionForm>:<p className="ws-muted">{t.groupReadOnly}</p>}</>:<NoGroup locale={locale}/>}</section>
    <section className="ws-panel"><h2>{t.language}</h2><p className="ws-muted">{t.languageHint}</p><ActionForm action={setLanguageAction} locale={locale}><Field label={t.language}><select name="locale" defaultValue={locale}><option value="de">Deutsch</option><option value="en">English</option></select></Field><div><SubmitButton locale={locale}>{t.saveLanguage}</SubmitButton></div></ActionForm></section>
    <section className="ws-panel"><h2>{t.secureArea}</h2><p className="ws-muted">{t.supportHint}</p><div className="ws-inline" style={{marginTop:18,marginBottom:22}}><Link className="ws-link" href="/kontakt">{t.help}<Icon name="arrow"/></Link></div><AccountControls email={session.user.email} locale={locale}/></section>
  </div></section>;
}
