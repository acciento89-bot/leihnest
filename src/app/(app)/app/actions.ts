"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toActionError } from "@/features/actions/action-result";
import { getWorkspaceLocale } from "@/features/workspace/locale";
import { workspaceText, type WorkspaceLocale } from "@/features/workspace/workspace";
import type { WorkspaceResult } from "@/components/app/workspace-controls";
import { groupInputSchema } from "@/features/groups/group-schema";
import { createGroupForUser, getPrimaryMembership } from "@/features/groups/group-service";
import { archiveItem, createItem, updateItem } from "@/features/items/item-service";
import { createInvitation } from "@/features/invitations/invitation-service";
import { approveReservation, cancelReservation, createReservation, transitionReservation } from "@/features/reservations/reservation-service";

async function currentUserId() {
  const session=await auth.api.getSession({headers:await headers()});
  if(!session)redirect("/login");
  return session.user.id;
}
async function primaryMembership(userId:string){
  const membership=await getPrimaryMembership(userId);
  if(!membership)throw new Error("FORBIDDEN");
  return membership;
}
function refreshWorkspace(){revalidatePath("/app","layout");}
function success(locale:WorkspaceLocale,de?:string,en?:string):WorkspaceResult{return {success:(locale==="de"?de:en) ?? workspaceText[locale].saved};}
function itemData(data:FormData){return {name:data.get("name"),description:data.get("description"),location:data.get("location"),totalQuantity:data.get("totalQuantity")};}

export async function createGroupAction(data:FormData):Promise<WorkspaceResult>{
  const userId=await currentUserId();const locale=await getWorkspaceLocale();
  try{await createGroupForUser({name:data.get("name")},userId);}catch(error){return {error:toActionError(error,locale)};}
  refreshWorkspace();return success(locale);
}
export async function createItemAction(data:FormData):Promise<WorkspaceResult>{
  const userId=await currentUserId();const locale=await getWorkspaceLocale();
  try{const membership=await primaryMembership(userId);await createItem(membership.groupId,userId,itemData(data));}catch(error){return {error:toActionError(error,locale)};}
  refreshWorkspace();return success(locale,"Der Gegenstand wurde hinzugefügt.","The item has been added.");
}
export async function itemAction(data:FormData):Promise<WorkspaceResult>{
  const userId=await currentUserId();const locale=await getWorkspaceLocale();
  try{
    const membership=await primaryMembership(userId);const itemId=z.string().min(1).parse(data.get("itemId"));
    const action=z.enum(["archive","update"]).parse(data.get("action"));
    if(action==="archive")await archiveItem(membership.groupId,userId,itemId);
    else await updateItem(membership.groupId,userId,itemId,itemData(data));
  }catch(error){return {error:toActionError(error,locale)};}
  refreshWorkspace();return success(locale);
}
export async function createInvitationAction(data:FormData):Promise<WorkspaceResult>{
  const userId=await currentUserId();const locale=await getWorkspaceLocale();
  try{
    const membership=await primaryMembership(userId);
    const token=await createInvitation(membership.groupId,userId,{email:data.get("email"),role:data.get("role")});
    refreshWorkspace();return {invitation:token};
  }catch(error){return {error:toActionError(error,locale)};}
}
export async function createReservationAction(data:FormData):Promise<WorkspaceResult>{
  const userId=await currentUserId();const locale=await getWorkspaceLocale();
  try{
    const membership=await primaryMembership(userId);
    await createReservation(membership.groupId,userId,{itemId:data.get("itemId"),quantity:data.get("quantity"),startsAt:data.get("startsAt"),endsAt:data.get("endsAt"),purpose:data.get("purpose")});
  }catch(error){return {error:toActionError(error,locale)};}
  refreshWorkspace();return success(locale,"Deine Anfrage wurde gesendet. Du findest sie unter Aktuell und Meine Ausleihen.","Your request has been sent. You can find it under Current and My loans.");
}
export async function reservationAction(data:FormData):Promise<WorkspaceResult>{
  const userId=await currentUserId();const locale=await getWorkspaceLocale();
  try{
    const membership=await primaryMembership(userId);const reservationId=z.string().min(1).parse(data.get("reservationId"));
    const action=z.enum(["approve","cancel","reject","handover","return"]).parse(data.get("action"));
    if(action==="approve")await approveReservation(membership.groupId,userId,reservationId);
    else if(action==="cancel")await cancelReservation(membership.groupId,userId,reservationId);
    else await transitionReservation(membership.groupId,userId,reservationId,action,action==="return"?data.get("returnNote"):undefined);
  }catch(error){return {error:toActionError(error,locale)};}
  refreshWorkspace();return success(locale);
}
export async function updateProfileAction(data:FormData):Promise<WorkspaceResult>{
  await currentUserId();const locale=await getWorkspaceLocale();
  try{
    const name=z.string().trim().min(2).max(80).parse(data.get("name"));
    await auth.api.updateUser({headers:await headers(),body:{name}});
  }catch(error){return {error:toActionError(error,locale)};}
  refreshWorkspace();return success(locale);
}
export async function updateGroupAction(data:FormData):Promise<WorkspaceResult>{
  const userId=await currentUserId();const locale=await getWorkspaceLocale();
  try{
    const membership=await primaryMembership(userId);if(membership.role!=="OWNER")throw new Error("FORBIDDEN");
    const {name}=groupInputSchema.parse({name:data.get("name")});
    await db.group.update({where:{id:membership.groupId},data:{name}});
  }catch(error){return {error:toActionError(error,locale)};}
  refreshWorkspace();return success(locale);
}
export async function setLanguageAction(data:FormData):Promise<WorkspaceResult>{
  await currentUserId();const current=await getWorkspaceLocale();
  const parsed=z.enum(["de","en"]).safeParse(data.get("locale"));
  if(!parsed.success)return {error:toActionError(parsed.error,current)};
  (await cookies()).set("leihnest-language",parsed.data,{path:"/",sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:31536000});
  refreshWorkspace();return success(parsed.data);
}
