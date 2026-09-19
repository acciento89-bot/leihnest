import Link from "next/link";
import type { ReactNode } from "react";
import { workspaceText, type WorkspaceLocale, type ReservationState } from "@/features/workspace/workspace";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <header className="ws-heading"><div>{eyebrow && <p className="ws-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="ws-muted">{description}</p></div>{action}</header>;
}
export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="ws-empty"><span className="ws-empty-icon" aria-hidden="true"><Icon name="box" /></span><h2>{title}</h2><p className="ws-muted">{description}</p>{children}</div>;
}
export function NoGroup({ locale }: { locale: WorkspaceLocale }) {
  const t=workspaceText[locale];
  return <EmptyState title={t.noGroup} description={t.noGroupHint}><Link className="ws-button" href="/app">{t.createGroup}<Icon name="arrow" /></Link></EmptyState>;
}
export function StatusBadge({ status, locale }: { status: ReservationState; locale: WorkspaceLocale }) {
  return <span className={`ws-badge ws-status-${status.toLowerCase()}`}><span aria-hidden="true" />{workspaceText[locale].statuses[status]}</span>;
}
export function Flash({ error }: { error?: string }) {
  return error ? <p className="ws-feedback ws-error" role="alert">{error}</p> : null;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="ws-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function Icon({ name }: { name: "box" | "calendar" | "people" | "home" | "settings" | "arrow" | "plus" | "check" | "pin" | "shield" }) {
  const paths = {
    box: <><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10"/><path d="m7 5 10 5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-8h6v8"/></>,
    settings: <><path d="M5 3v18M12 3v18M19 3v18"/><path d="M2 8h6m1 8h6m1-9h6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    check: <path d="m4 12 5 5L20 6"/>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></>,
  };
  return <svg className="ws-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
