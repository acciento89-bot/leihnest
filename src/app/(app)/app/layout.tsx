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

export const metadata: Metadata = { title:"Dein LeihNest", robots:{ index:false, follow:false } };
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session=await auth.api.getSession({ headers:await headers() });
  if (!session) redirect("/login");
  const [{locale,t}, membership]=await Promise.all([getWorkspaceText(),getPrimaryMembership(session.user.id)]);
  return <div className="workspace" lang={locale}>
    <a href="#workspace-content" className="ws-skip">{t.skip}</a>
    <aside className="ws-sidebar"><Link href="/app" className="ws-brand"><span className="ws-brand-mark"><Icon name="home"/></span><span>LeihNest<small>{t.home}</small></span></Link>
      <AppNavigation locale={locale}/>
      <div className="ws-sidebar-bottom"><a href="/kontakt" className="ws-support"><Icon name="people"/>{t.help}</a><AccountControls email={session.user.email} locale={locale}/></div>
    </aside>
    <div className="ws-main"><div className="ws-topbar"><div className="ws-person"><span className="ws-action-icon"><Icon name="people"/></span><div><strong>{membership?.group.name ?? t.welcome}</strong><small>{t.privateGroup}</small></div></div>
      <Link href="/app/settings" className="ws-person" aria-label={t.settings}><span className="ws-user-name">{session.user.name}</span><span className="ws-avatar">{initials(session.user.name)}</span></Link>
    </div><main id="workspace-content" className="ws-content">{children}</main></div>
  </div>;
}
