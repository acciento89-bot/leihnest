"use client";

import { useState } from "react";
import type { WorkspaceLocale } from "@/features/workspace/workspace";

type Snapshot={
  status:string;
  interval:"MONTH"|"YEAR"|null;
  currentPeriodEnd:string|null;
  cancelAtPeriodEnd:boolean;
  plus:boolean;
};

const copy={
  de:{
    title:"LeihNest Plus",free:"Kostenlos",plus:"Plus",owner:"Die Abrechnung wird von der verantwortlichen Person verwaltet.",
    monthly:"4,99 € / Monat",yearly:"39,99 € / Jahr",upgrade:"Auf Plus wechseln",manage:"Abo verwalten",
    working:"Wird geöffnet…",error:"Die Abrechnung konnte nicht geöffnet werden. Bitte versuche es erneut.",
    benefits:"Bis zu 5 Bilder je Gegenstand, CSV-Exporte und erweiterte Gruppenstatistiken.",
    renewal:"Nächste Abrechnung",ends:"Läuft aus am",
  },
  en:{
    title:"LeihNest Plus",free:"Free",plus:"Plus",owner:"Billing is managed by the group owner.",
    monthly:"€4.99 / month",yearly:"€39.99 / year",upgrade:"Upgrade to Plus",manage:"Manage subscription",
    working:"Opening…",error:"Billing could not be opened. Please try again.",
    benefits:"Up to 5 images per item, CSV exports and enhanced group analytics.",
    renewal:"Next billing date",ends:"Ends on",
  },
} as const;

async function open(url:string,body?:unknown){
  const response=await fetch(url,{method:"POST",headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok||typeof payload.url!=="string")throw new Error(payload.error||"BILLING_ERROR");
  window.location.assign(payload.url);
}

export function BillingControls({locale,canManage,snapshot,billingState}:{locale:WorkspaceLocale;canManage:boolean;snapshot:Snapshot|null;billingState?:string}){
  const t=copy[locale];const [interval,setInterval]=useState<"month"|"year">("year");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const plus=Boolean(snapshot?.plus);
  async function run(action:"checkout"|"portal"){
    setBusy(true);setError("");
    try{
      if(action==="checkout")await open("/api/billing/checkout",{interval});
      else await open("/api/billing/portal");
    }catch{setError(t.error);setBusy(false);}
  }
  const date=snapshot?.currentPeriodEnd?new Intl.DateTimeFormat(locale,{dateStyle:"medium"}).format(new Date(snapshot.currentPeriodEnd)):null;
  return <section className="ws-panel ws-billing-panel" id="billing"><div className="ws-billing-head"><div><p className="ws-eyebrow">{t.title}</p><h2>{plus?t.plus:t.free}</h2></div><span className={plus?"ws-plan-badge is-plus":"ws-plan-badge"}>{plus?"PLUS":"FREE"}</span></div>
    <p className="ws-muted">{t.benefits}</p>
    {billingState==="confirming"&&<p className="ws-note">{locale==="de"?"Zahlung wird bestätigt. Plus wird nach dem Stripe-Webhook aktiviert.":"Payment is being confirmed. Plus activates after the Stripe webhook."}</p>}
    {billingState==="cancelled"&&<p className="ws-note">{locale==="de"?"Der Bezahlvorgang wurde abgebrochen.":"Checkout was cancelled."}</p>}
    {plus&&date&&<p className="ws-billing-date"><strong>{snapshot?.cancelAtPeriodEnd?t.ends:t.renewal}:</strong> {date}</p>}
    {canManage?plus?<button className="ws-button" type="button" disabled={busy} onClick={()=>void run("portal")}>{busy?t.working:t.manage}</button>:<div className="ws-billing-upgrade">
      <label><input type="radio" name="billing-interval" checked={interval==="month"} onChange={()=>setInterval("month")}/><span>{t.monthly}</span></label>
      <label><input type="radio" name="billing-interval" checked={interval==="year"} onChange={()=>setInterval("year")}/><span>{t.yearly}</span></label>
      <button className="ws-button" type="button" disabled={busy} onClick={()=>void run("checkout")}>{busy?t.working:t.upgrade}</button>
    </div>:<p className="ws-note">{t.owner}</p>}
    {error&&<p className="ws-feedback ws-error" role="alert">{error}</p>}
  </section>;
}
