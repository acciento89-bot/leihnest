"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createGroupForUser, getPrimaryMembership } from "@/features/groups/group-service";
import { createItem } from "@/features/items/item-service";
import { createReservation, approveReservation, transitionReservation, cancelReservation } from "@/features/reservations/reservation-service";

async function userId() { const s = await auth.api.getSession({ headers: await headers() }); if (!s) redirect("/login"); return s.user.id; }
export async function createGroupAction(fd: FormData) { const uid = await userId(); await createGroupForUser({ name: fd.get("name") }, uid); revalidatePath("/app"); }
export async function createItemAction(fd: FormData) { const uid = await userId(); const m = await getPrimaryMembership(uid); if (!m) throw new Error("FORBIDDEN"); await createItem(m.groupId, uid, { name: fd.get("name"), description: fd.get("description"), location: fd.get("location"), totalQuantity: fd.get("totalQuantity") }); revalidatePath("/app/items"); }
export async function createReservationAction(fd: FormData) { const uid = await userId(); const m = await getPrimaryMembership(uid); if (!m) throw new Error("FORBIDDEN"); await createReservation(m.groupId, uid, { itemId: fd.get("itemId"), quantity: fd.get("quantity"), startsAt: fd.get("startsAt"), endsAt: fd.get("endsAt"), purpose: fd.get("purpose") }); revalidatePath("/app/reservations"); }
export async function reservationAction(fd: FormData) { const uid = await userId(); const m = await getPrimaryMembership(uid); if (!m) throw new Error("FORBIDDEN"); const id = String(fd.get("reservationId")); const action = String(fd.get("action")); if (action === "approve") await approveReservation(m.groupId, uid, id); else if (action === "cancel") await cancelReservation(m.groupId, uid, id); else if (action === "reject" || action === "handover" || action === "return") await transitionReservation(m.groupId, uid, id, action); revalidatePath("/app"); revalidatePath("/app/reservations"); }
