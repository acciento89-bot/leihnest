"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { monthCells, loansOnDay, dayKey, type DashboardLoan } from "@/features/design/dashboard-model";
import { type WorkspaceLocale } from "@/features/workspace/workspace";
import { NestIcon } from "./icons";
import { dashboardCopy } from "./dashboard-copy";
const subscribe=()=>()=>{};
export function LoanCalendar({ loans, now, locale }: { loans: DashboardLoan[]; now:string; locale: WorkspaceLocale }) {
  const t=dashboardCopy[locale];
  const zone=useSyncExternalStore(subscribe,()=>Intl.DateTimeFormat().resolvedOptions().timeZone,()=>"Europe/Berlin");
  const today=dayKey(now,zone);const [offset,setOffset]=useState(0);const [chosen,setChosen]=useState<string|null>(null);
  const [year,month]=today.split("-").map(Number);const first=new Date(Date.UTC(year,month-1+offset,1));
  const cells=monthCells(first.getUTCFullYear(),first.getUTCMonth());
  const selected=chosen ?? today;
  const rows=loansOnDay(loans,selected,zone);
  function moveMonth(delta: number) {
    const nextOffset = offset + delta;
    const nextMonth = new Date(Date.UTC(year, month - 1 + nextOffset, 1));
    setOffset(nextOffset);
    setChosen(nextOffset === 0 ? today : nextMonth.toISOString().slice(0, 10));
  }
  const title=new Intl.DateTimeFormat(locale,{month:"long",year:"numeric",timeZone:"UTC"}).format(first);
  return <section className="dash-panel dash-calendar"><h2><NestIcon name="calendar"/>{t.calendar}</h2><div className="dash-calendar-toolbar"><strong>{title}</strong><div><button type="button" aria-label={t.previous} onClick={()=>moveMonth(-1)}><NestIcon name="back"/></button><button type="button" aria-label={t.next} onClick={()=>moveMonth(1)}><NestIcon name="chevron"/></button></div></div>
    <div className="dash-calendar-grid" aria-label={title}>{t.weekdays.map(day=><small key={day}>{day}</small>)}{cells.map(cell=>{
      const matches=loansOnDay(loans,cell.key,zone);const confirmed=matches.some(row=>row.status!=="PENDING");
      return <button key={cell.key} type="button" className={`${!cell.inMonth?"outside":""} ${matches.length?(confirmed?"has-loans":"has-requests"):""} ${cell.key===selected?"selected":""}`} aria-label={`${cell.key}: ${matches.length} ${t.active}`} aria-pressed={cell.key===selected} aria-current={cell.key===today?"date":undefined} onClick={()=>setChosen(cell.key)}><span>{cell.day}</span>{matches.length>0 && <i aria-hidden="true"/>}</button>;
    })}</div>
    <div className="dash-calendar-key"><span><i/>{t.confirmed}</span><span><i/>{t.pending}</span></div>
    <div className="dash-selected-day" aria-live="polite"><h3>{t.selected} {new Intl.DateTimeFormat(locale,{day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(`${selected}T12:00:00Z`))}</h3>{rows.length ? <ul>{rows.slice(0,3).map(row=><li key={row.id}><Link href={`/app/reservations?filter=all#reservation-${encodeURIComponent(row.id)}`}>{row.item.name}<span>{row.user.name}</span></Link></li>)}</ul> : <p>{t.emptyDay}</p>}</div>
    <Link className="dash-calendar-all" href="/app/reservations">{t.viewAll}<NestIcon name="arrow"/></Link><p className="dash-calendar-note">{t.calendarNote}</p>
  </section>;
}
