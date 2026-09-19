import { db } from "@/lib/db";

export type AnalyticsStatus="PENDING"|"APPROVED"|"REJECTED"|"HANDED_OUT"|"RETURNED"|"CANCELLED";
export type AnalyticsReservation={
  itemId:string;
  itemName:string;
  status:AnalyticsStatus;
  createdAt:Date;
  handedOutAt:Date|null;
  returnedAt:Date|null;
};
export type PlusAnalytics={
  last30DaysReservations:number;
  monthly:Array<{month:string;count:number}>;
  topItems:Array<{itemId:string;name:string;count:number}>;
  statusCounts:Record<AnalyticsStatus,number>;
  averageCompletedLoanHours:number|null;
};

const STATUSES:AnalyticsStatus[]=["PENDING","APPROVED","REJECTED","HANDED_OUT","RETURNED","CANCELLED"];
const day=24*60*60*1000;

function monthKey(date:Date){return date.toISOString().slice(0,7);}
function startOfMonthUtc(date:Date,offset:number){
  return new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+offset,1));
}

export function buildPlusAnalytics(rows:AnalyticsReservation[],now=new Date()):PlusAnalytics{
  const last30=now.getTime()-30*day;
  const last90=now.getTime()-90*day;
  const statusCounts=Object.fromEntries(STATUSES.map(status=>[status,0])) as Record<AnalyticsStatus,number>;
  for(const row of rows)statusCounts[row.status]+=1;

  const months=Array.from({length:6},(_,index)=>startOfMonthUtc(now,index-5));
  const monthly=months.map(month=>({month:monthKey(month),count:0}));
  const byMonth=new Map(monthly.map((entry,index)=>[entry.month,index]));
  for(const row of rows){
    const index=byMonth.get(monthKey(row.createdAt));
    if(index!==undefined)monthly[index].count+=1;
  }

  const top=new Map<string,{itemId:string;name:string;count:number}>();
  for(const row of rows){
    if(row.createdAt.getTime()<last90 || row.createdAt.getTime()>now.getTime())continue;
    if(row.status==="REJECTED"||row.status==="CANCELLED")continue;
    const current=top.get(row.itemId)??{itemId:row.itemId,name:row.itemName,count:0};
    current.count+=1;top.set(row.itemId,current);
  }

  const completed=rows.filter(row=>row.status==="RETURNED"&&row.handedOutAt&&row.returnedAt&&row.returnedAt>row.handedOutAt);
  const averageCompletedLoanHours=completed.length
    ? Math.round((completed.reduce((sum,row)=>sum+((row.returnedAt!.getTime()-row.handedOutAt!.getTime())/(60*60*1000)),0)/completed.length)*10)/10
    : null;

  return {
    last30DaysReservations:rows.filter(row=>row.createdAt.getTime()>=last30&&row.createdAt.getTime()<=now.getTime()).length,
    monthly,
    topItems:[...top.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).slice(0,5),
    statusCounts,
    averageCompletedLoanHours,
  };
}

export async function getPlusAnalytics(groupId:string,now=new Date()){
  const rows=await db.reservation.findMany({
    where:{groupId},
    select:{itemId:true,status:true,createdAt:true,handedOutAt:true,returnedAt:true,item:{select:{name:true}}},
  });
  return buildPlusAnalytics(rows.map(row=>({
    itemId:row.itemId,itemName:row.item.name,status:row.status as AnalyticsStatus,
    createdAt:row.createdAt,handedOutAt:row.handedOutAt,returnedAt:row.returnedAt,
  })),now);
}
