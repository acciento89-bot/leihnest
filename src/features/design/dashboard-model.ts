import type { ReservationState } from "@/features/workspace/workspace";
export type DashboardLoan={id:string;itemId:string;item:{id:string;name:string};user:{name:string};quantity:number;status:ReservationState;startsAt:string;endsAt:string;createdAt:string;updatedAt:string;approvedAt:string|null;handedOutAt:string|null;returnedAt:string|null};
export type MonthCell={key:string;day:number;inMonth:boolean};
export type MonthUsage={key:string;date:string;count:number};
const active=new Set<ReservationState>(["PENDING","APPROVED","HANDED_OUT"]);
export function monthCells(year:number,month:number):MonthCell[]{
  const first=new Date(Date.UTC(year,month,1));
  const offset=(first.getUTCDay()+6)%7;
  const days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  return Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>{
    const date=new Date(Date.UTC(year,month,i-offset+1));
    return {key:date.toISOString().slice(0,10),day:date.getUTCDate(),inMonth:date.getUTCMonth()===first.getUTCMonth()};
  });
}
export function dayKey(value:string,zone="Europe/Berlin"):string{
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(value));
  return ["year","month","day"].map(key=>parts.find(p=>p.type===key)?.value ?? "").join("-");
}
export function loansOnDay(rows:DashboardLoan[],key:string,zone="Europe/Berlin"):DashboardLoan[]{
  return rows.filter(row=>{
    if(!active.has(row.status))return false;
    const start=Date.parse(row.startsAt);const end=Date.parse(row.endsAt);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return false;
    // End is exclusive: a return at local midnight does not occupy the following day.
    return dayKey(row.startsAt,zone)<=key && dayKey(new Date(end-1).toISOString(),zone)>=key;
  });
}
export function usageSeries(rows:DashboardLoan[],now:string):MonthUsage[]{
  const [year,month]=dayKey(now).slice(0,7).split("-").map(Number);
  const buckets=Array.from({length:6},(_,index)=>{
    const date=new Date(Date.UTC(year,month-1-5+index,1));
    return {key:date.toISOString().slice(0,7),date:date.toISOString(),count:0};
  });
  for(const row of rows){
    if(!row.handedOutAt || !["HANDED_OUT","RETURNED"].includes(row.status))continue;
    const time=Date.parse(row.handedOutAt);
    if(!Number.isFinite(time)||time>Date.parse(now))continue;
    const key=dayKey(row.handedOutAt).slice(0,7);const bucket=buckets.find(b=>b.key===key);
    if(bucket)bucket.count++;
  }
  return buckets;
}
export function inventoryLabelKey(itemId:string,rows:DashboardLoan[],now:string):"inStock"|"reserved"|"onLoan"{
  const relevant=rows.filter(row=>row.itemId===itemId);
  if(relevant.some(row=>row.status==="HANDED_OUT"))return "onLoan";
  if(relevant.some(row=>row.status==="APPROVED" && row.startsAt<=now && row.endsAt>now))return "reserved";
  return "inStock";
}
export function activityTime(row:DashboardLoan):string {
  if(row.status==="RETURNED")return row.returnedAt ?? row.updatedAt;
  if(row.status==="HANDED_OUT")return row.handedOutAt ?? row.updatedAt;
  if(row.status==="APPROVED")return row.approvedAt ?? row.updatedAt;
  return row.status==="PENDING" ? row.createdAt : row.updatedAt;
}
