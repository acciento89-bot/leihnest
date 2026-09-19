import type { PlusAnalytics } from "@/features/analytics/plus-analytics";
import type { WorkspaceLocale } from "@/features/workspace/workspace";

const copy={
  de:{title:"Plus-Auswertung",last30:"Reservierungen · 30 Tage",average:"Ø Ausleihdauer",hours:"Std.",top:"Am häufigsten ausgeliehen",exports:"Daten exportieren",items:"Gegenstände CSV",reservations:"Reservierungen CSV",empty:"Noch nicht genug Ausleihdaten für eine Rangliste."},
  en:{title:"Plus analytics",last30:"Reservations · 30 days",average:"Avg. loan duration",hours:"hrs",top:"Most borrowed",exports:"Export data",items:"Items CSV",reservations:"Reservations CSV",empty:"Not enough borrowing data for a ranking yet."},
} as const;

export function PlusAnalyticsPanel({locale,data}:{locale:WorkspaceLocale;data:PlusAnalytics}){
  const t=copy[locale];
  const averageLabel=data.averageCompletedLoanHours!==null?t.average+" · "+t.hours:t.average;
  return <section className="ws-plus-analytics">
    <header><div><p className="ws-eyebrow">LeihNest Plus</p><h2>{t.title}</h2></div><div className="ws-plus-exports"><span>{t.exports}</span><a className="ws-button ws-secondary" href="/api/exports/items">{t.items}</a><a className="ws-button ws-secondary" href="/api/exports/reservations">{t.reservations}</a></div></header>
    <div className="ws-plus-metrics"><div><strong>{data.last30DaysReservations}</strong><span>{t.last30}</span></div><div><strong>{data.averageCompletedLoanHours??"–"}</strong><span>{averageLabel}</span></div></div>
    <div className="ws-plus-top"><h3>{t.top}</h3>{data.topItems.length?<ol>{data.topItems.map(item=><li key={item.itemId}><span>{item.name}</span><strong>{item.count}</strong></li>)}</ol>:<p className="ws-muted">{t.empty}</p>}</div>
    <div className="ws-plus-months" aria-label={locale==="de"?"Reservierungen der letzten sechs Monate":"Reservations over the last six months"}>{data.monthly.map(entry=><div key={entry.month}><span style={{height:String(Math.max(8,Math.min(100,entry.count*16)))+"%"}}/><small>{entry.month.slice(5)}</small></div>)}</div>
  </section>;
}
