import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { getWorkspaceText } from "@/features/workspace/locale";
import { initials } from "@/features/workspace/workspace";
import { AppNavigation } from "@/components/app/workspace-controls";
import { AccountControls } from "@/components/app/account-controls";
import { Icon } from "@/components/app/workspace-ui";
import "./workspace.css";
import "@/components/design/site.css";
import "./concept-workspace.css";
import { NestBrand } from "@/components/design/brand";
import { NestIcon } from "@/components/design/icons";
import { db } from "@/lib/db";

export const metadata: Metadata = { title:"Dein LeihNest", robots:{ index:false, follow:false } };
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session=await auth.api.getSession({ headers:await headers() });
  if (!session) redirect("/login");
  const [{locale,t}, membership,profileMedia]=await Promise.all([
    getWorkspaceText(),
    getPrimaryMembership(session.user.id),
    db.mediaAsset.findFirst({where:{userId:session.user.id,kind:"PROFILE"},orderBy:{createdAt:"desc"},select:{id:true}}),
  ]);
  const [memberCount,groupMedia]=membership?await Promise.all([
    db.membership.count({where:{groupId:membership.groupId}}),
    db.mediaAsset.findFirst({where:{groupId:membership.groupId,kind:"GROUP"},orderBy:{createdAt:"desc"},select:{id:true}}),
  ]):[0,null];
  return <div className="workspace concept-workspace" lang={locale}>
    <a href="#workspace-content" className="ws-skip">{t.skip}</a>
    <aside className="ws-sidebar"><NestBrand href="/app" compact/>
      <AppNavigation locale={locale}/>
      <div className="nest-sidebar-motto" aria-hidden="true"><p>{locale==="de"?"Dinge verbinden. Menschen.":"Things connect. People."}</p></div>
      <div className="nest-sidebar-note"><span><NestIcon name="leaf"/></span><p>{locale==="de"?"Gemeinsam mehr möglich.":"More possible together."}</p></div>
      <div className="ws-sidebar-bottom"><a href="/kontakt" className="ws-support"><Icon name="people"/>{t.help}</a><AccountControls email={session.user.email} locale={locale}/></div>
    </aside>
    <div className="ws-main"><div className="ws-topbar"><div className="ws-person">{groupMedia?<img className="nest-group-picture ws-private-avatar" src={`/api/media/${groupMedia.id}/thumb`} alt=""/>:<span className="nest-group-picture" aria-hidden="true"/>}<div><strong>{membership?.group.name ?? t.welcome}</strong><small>{membership ? `${memberCount} ${t.members} · ` : ""}{locale==="de"?"Gemeinsam mehr möglich":"More possible together"}</small></div></div>
      <form action="/app/items" method="get" className="nest-workspace-search"><NestIcon name="search"/><input type="search" name="q" aria-label={t.searchItems} placeholder={t.searchItems}/><button type="submit" aria-label={t.search}><NestIcon name="arrow"/></button></form>
      <Link href="/app/settings" className="ws-person" aria-label={t.settings}><span className="ws-user-name">{session.user.name}</span>{profileMedia?<img className="ws-avatar ws-private-avatar" src={`/api/media/${profileMedia.id}/thumb`} alt=""/>:<span className="ws-avatar">{initials(session.user.name)}</span>}</Link>
    </div><main id="workspace-content" className="ws-content">{children}</main></div>
  </div>;
}
