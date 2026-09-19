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
  const rows=await db.reservation.findMany({
    where:{groupId:membership.groupId},
    include:{item:{select:{name:true}},user:{select:{name:true,email:true}}},
    orderBy:{createdAt:"desc"},
  });
  const csv=toCsv([
    ["Gegenstand","Mitglied","E-Mail","Status","Anzahl","Abholung","Rückgabe","Zweck","Rückgabehinweis"],
    ...rows.map(row=>[
      row.item.name,row.user.name,row.user.email,row.status,row.quantity,row.startsAt.toISOString(),row.endsAt.toISOString(),
      row.purpose??"",row.returnNote??"",
    ]),
  ]);
  return new Response(csv,{headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="leihnest-reservierungen.csv"',
    "X-Content-Type-Options":"nosniff",
  }});
}
