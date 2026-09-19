"use client";
import { useState } from "react";
import Link from "next/link";
import { NestBrand } from "./brand";
import { NestIcon, type NestIconName } from "./icons";
import { ItemPhoto, type PhotoKind } from "./item-photo";
import { siteCopy, type SiteLocale } from "./site-copy";
const kinds: PhotoKind[]=["pavilion","speaker","projector","chair","toolbox","benches"];
const categories=[1,2,2,3,4,3];
export function InventoryPreview({ locale }: { locale: SiteLocale }) {
  const t=siteCopy[locale];const [category,setCategory]=useState(0);const [search,setSearch]=useState("");
  const names=[t.all,t.garden,t.technology,t.events,t.household];
  const shown=kinds.map((kind,index)=>({kind,index})).filter(({index})=>(category===0 || categories[index]===category) && t.itemNames[index].toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <section className="nest-demo-window" aria-label={t.demo}>
    <div className="nest-demo-side"><NestBrand compact/><div className="nest-demo-nav" aria-hidden="true">{t.nav.map((label,index)=><div key={label} className={index===1?"active":""}><NestIcon name={(["home","box","calendar","people","settings"] as NestIconName[])[index]}/>{label}</div>)}</div><small>{t.demo}</small></div>
    <div className="nest-demo-main"><div className="nest-demo-toolbar"><label><NestIcon name="search"/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search} aria-label={t.search}/></label><Link href={`/register${locale === "en" ? "?lang=en" : ""}`}><NestIcon name="plus"/>{t.add}</Link></div>
      <h2>{t.inventory}</h2><div className="nest-demo-filters" aria-label={locale === "de" ? "Beispielkategorien" : "Sample categories"}>{names.map((name,index)=><button key={name} type="button" onClick={()=>setCategory(index)} aria-pressed={category===index}>{name}</button>)}</div>
      <div className="nest-demo-items">{shown.map(({kind,index})=><article key={kind}><ItemPhoto name={t.itemNames[index]} kind={kind} eager/><h3>{t.itemNames[index]}</h3><div><span className={index===1 || index===5 ? "reserved" : ""}>{index===1 || index===5 ? t.reserved : t.available}</span><NestIcon name="calendar"/></div></article>)}</div>
      {shown.length===0 && <p className="nest-demo-empty">{locale === "de" ? "Keine passenden Gegenstände." : "No matching items."}</p>}
      <p className="nest-demo-caption">{t.demoHint}</p>
    </div>
  </section>;
}
export function PreviewCalendar({ locale }: { locale: SiteLocale }) {
  const t=siteCopy[locale];const [offset,setOffset]=useState(0);const year=2026;const month=3+offset;
  const start=new Date(Date.UTC(year,month,1));const n=(start.getUTCDay()+6)%7;
  const title=new Intl.DateTimeFormat(locale,{month:"long",year:"numeric",timeZone:"UTC"}).format(start);
  return <aside className="nest-preview-calendar" aria-label={t.calendarDemo}><div className="nest-preview-item"><ItemPhoto kind="pavilion" name={t.itemNames[0]}/><div><strong>{t.itemNames[0]}</strong><span>{t.available}</span></div></div><div className="nest-preview-month"><button type="button" onClick={()=>setOffset(offset-1)} aria-label={locale === "de" ? "Vorheriger Beispielmonat" : "Previous example month"}><NestIcon name="back"/></button><b>{title}</b><button type="button" onClick={()=>setOffset(offset+1)} aria-label={locale === "de" ? "Nächster Beispielmonat" : "Next example month"}><NestIcon name="chevron"/></button></div><div className="nest-preview-days">{t.weekdays.map(day=><small key={day}>{day}</small>)}{Array.from({length:Math.ceil((n+new Date(Date.UTC(year,month+1,0)).getUTCDate())/7)*7},(_,i)=>{const date=new Date(Date.UTC(year,month,i-n+1));const day=date.getUTCDate();return <span key={i} className={`${date.getUTCMonth()!==start.getUTCMonth()?"outside":""} ${offset===0 && day>=16 && day<=19 && date.getUTCMonth()===3?"marked":""}`}>{day}</span>;})}</div><small className="nest-calendar-caption">{t.calendarDemo}</small></aside>;
}
