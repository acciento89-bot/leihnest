"use client";

import { createContext, useContext, useSyncExternalStore, useRef, useState, useTransition, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./workspace-ui";
import { workspaceText, type WorkspaceLocale } from "@/features/workspace/workspace";

const subscribeToBrowser = () => () => {};

export type WorkspaceResult = { error?: string; success?: string; invitation?: string };
const PendingContext = createContext(false);

export function ActionForm({ action, locale, children, className = "ws-form", resetOnSuccess = false }: {
  action: (data: FormData) => Promise<WorkspaceResult | void>; locale: WorkspaceLocale;
  children: ReactNode; className?: string; resetOnSuccess?: boolean;
}) {
  const [result,setResult]=useState<WorkspaceResult>({});
  const [pending,startTransition]=useTransition();
  const formRef=useRef<HTMLFormElement>(null);
  const t=workspaceText[locale];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const submitter=(event.nativeEvent as SubmitEvent).submitter;
    const data=new FormData(event.currentTarget,submitter);
    for (const name of ["startsAt","endsAt"]) {
      const value=data.get(name);
      if (typeof value === "string" && value) {
        const parsed=new Date(value);
        if (Number.isNaN(parsed.getTime())) { setResult({ error:t.error }); return; }
        data.set(name,parsed.toISOString());
      }
    }
    const start=data.get("startsAt"); const end=data.get("endsAt");
    if (typeof start === "string" && typeof end === "string" && end <= start) {
      setResult({error:locale === "de" ? "Die Rückgabe muss nach der Abholung liegen." : "The return must be after collection."}); return;
    }
    setResult({});
    startTransition(async () => {
      try {
        const next=await action(data);
        setResult(next ?? {success:t.saved});
        if (!next?.error && resetOnSuccess) formRef.current?.reset();
      } catch {
        setResult({error:t.error});
      }
    });
  }
  return <PendingContext.Provider value={pending}><form ref={formRef} method="post" onSubmit={submit} className={className} aria-busy={pending}>
    {children}
    {result.error && <p className="ws-feedback ws-error" role="alert">{result.error}</p>}
    {result.success && <p className="ws-feedback ws-success" role="status">{result.success}</p>}
    {result.invitation && <CopyInvitation path={`/invite/${result.invitation}`} locale={locale}/>}
  </form></PendingContext.Provider>;
}

export function SubmitButton({ children, locale, name, value, secondary=false, confirm }: {
  children: ReactNode; locale: WorkspaceLocale; name?: string; value?: string; secondary?: boolean; confirm?: string;
}) {
  const pending=useContext(PendingContext);
  return <button type="submit" name={name} value={value} disabled={pending} formNoValidate={Boolean(confirm)} className={secondary ? "ws-button ws-secondary" : "ws-button"}
    onClick={event => {if (confirm && !window.confirm(confirm)) event.preventDefault();}}>
    {pending ? workspaceText[locale].working : children}
  </button>;
}

export function AppNavigation({ locale }: { locale: WorkspaceLocale }) {
  const path=usePathname(); const t=workspaceText[locale];
  const entries=[ ["/app",t.overview,"home"], ["/app/items",t.items,"box"], ["/app/reservations",t.reservations,"calendar"], ["/app/members",t.members,"people"], ["/app/settings",t.settings,"settings"] ] as const;
  return <nav className="ws-navigation" aria-label={t.navigation}>{entries.map(([href,label,icon])=>
    <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={path === href ? "is-active" : ""}><Icon name={icon}/><span className="ws-nav-desktop">{label}</span><span className="ws-nav-mobile">{href === "/app/reservations" ? (locale === "de" ? "Ausleihen" : "Loans") : label}</span></Link>
  )}</nav>;
}

export function CopyInvitation({ path, locale }: { path: string; locale: WorkspaceLocale }) {
  const origin=useSyncExternalStore(subscribeToBrowser,()=>window.location.origin,()=>"https://leihnest.de");
  const [message,setMessage]=useState(""); const t=workspaceText[locale];
  const url=`${origin}${path}`;
  return <div className="ws-invitation"><h3>{t.inviteCreated}</h3><p>{t.inviteShare}</p><div className="ws-inline">
    <input type="text" value={url} readOnly aria-label={t.copyLink} onFocus={event=>event.currentTarget.select()}/>
    <button type="button" className="ws-button ws-secondary" onClick={async()=>{try {await navigator.clipboard.writeText(url);setMessage(t.copied);} catch {setMessage(t.copyFailed);}}}>{t.copyLink}</button>
  </div><p role="status">{message}</p></div>;
}

export function LocalTime({ value, locale }: { value: string; locale: WorkspaceLocale }) {
  const zone=useSyncExternalStore(subscribeToBrowser,()=>Intl.DateTimeFormat().resolvedOptions().timeZone,()=>"Europe/Berlin");
  const formatted=new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:zone,timeZoneName:"short"}).format(new Date(value));
  return <time dateTime={value}>{formatted}</time>;
}
