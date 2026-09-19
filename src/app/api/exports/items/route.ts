import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canManageInventory } from "@/features/groups/permissions";
import { hasPlus } from "@/features/billing/entitlements";
import { toCsv } from "@/features/exports/csv";

export async function GET(){
  const session=await auth.api.getSession({headers:await headers()});if(!session)return new Response(null,{status:401});
  const membership=await getPrimaryMembership(session.user.id);if(!membership||!canManageInventory(membership.role))return new Response(null,{status:403});
  const subscription=await db.groupSubscription.findUnique({where:{groupId:membership.groupId}});
  if(!hasPlus(subscription))return new Response(null,{status:403});
  const items=await db.item.findMany({where:{groupId:membership.groupId},orderBy:{name:"asc"}});
  const csv=toCsv([
    ["Name","Beschreibung","Lagerort","Anzahl","Aktiv"],
    ...items.map(item=>[item.name,item.description??"",item.location??"",item.totalQuantity,item.active?"ja":"nein"]),
  ]);
  return new Response(csv,{headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="leihnest-gegenstaende.csv"',
    "X-Content-Type-Options":"nosniff",
  }});
}
