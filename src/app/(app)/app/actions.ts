"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { toActionError } from "@/features/actions/action-result";
import { createGroupForUser, getPrimaryMembership } from "@/features/groups/group-service";
import { archiveItem, createItem, updateItem } from "@/features/items/item-service";
import { createInvitation } from "@/features/invitations/invitation-service";
import {
  approveReservation,
  cancelReservation,
  createReservation,
  transitionReservation,
} from "@/features/reservations/reservation-service";

async function currentUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user.id;
}

async function primaryMembership(userId: string) {
  const membership = await getPrimaryMembership(userId);
  if (!membership) throw new Error("FORBIDDEN");
  return membership;
}

function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(toActionError(error))}`);
}

export async function createGroupAction(formData: FormData) {
  const userId = await currentUserId();

  try {
    await createGroupForUser({ name: formData.get("name") }, userId);
  } catch (error) {
    fail("/app", error);
  }

  revalidatePath("/app");
}

export async function createItemAction(formData: FormData) {
  const userId = await currentUserId();

  try {
    const membership = await primaryMembership(userId);
    await createItem(membership.groupId, userId, {
      name: formData.get("name"),
      description: formData.get("description"),
      location: formData.get("location"),
      totalQuantity: formData.get("totalQuantity"),
    });
  } catch (error) {
    fail("/app/items", error);
  }

  revalidatePath("/app/items");
}

export async function itemAction(formData: FormData) {
  const userId = await currentUserId();

  try {
    const membership = await primaryMembership(userId);
    const itemId = String(formData.get("itemId"));
    const action = String(formData.get("action"));

    if (action === "archive") {
      await archiveItem(membership.groupId, userId, itemId);
    } else if (action === "update") {
      await updateItem(membership.groupId, userId, itemId, {
        name: formData.get("name"),
        description: formData.get("description"),
        location: formData.get("location"),
        totalQuantity: formData.get("totalQuantity"),
      });
    }
  } catch (error) {
    fail("/app/items", error);
  }

  revalidatePath("/app/items");
  revalidatePath("/app");
}

export async function createInvitationAction(formData: FormData) {
  const userId = await currentUserId();
  let token: string;

  try {
    const membership = await primaryMembership(userId);
    token = await createInvitation(membership.groupId, userId, {
      email: formData.get("email"),
      role: formData.get("role"),
    });
  } catch (error) {
    fail("/app/members", error);
  }

  redirect(`/app/members?invite=${encodeURIComponent(token)}`);
}

export async function createReservationAction(formData: FormData) {
  const userId = await currentUserId();

  try {
    const membership = await primaryMembership(userId);
    await createReservation(membership.groupId, userId, {
      itemId: formData.get("itemId"),
      quantity: formData.get("quantity"),
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt"),
      purpose: formData.get("purpose"),
    });
  } catch (error) {
    fail("/app/reservations", error);
  }

  revalidatePath("/app/reservations");
}

export async function reservationAction(formData: FormData) {
  const userId = await currentUserId();

  try {
    const membership = await primaryMembership(userId);
    const reservationId = String(formData.get("reservationId"));
    const action = String(formData.get("action"));

    if (action === "approve") {
      await approveReservation(membership.groupId, userId, reservationId);
    } else if (action === "cancel") {
      await cancelReservation(membership.groupId, userId, reservationId);
    } else if (action === "reject" || action === "handover" || action === "return") {
      await transitionReservation(
        membership.groupId,
        userId,
        reservationId,
        action,
        action === "return" ? formData.get("returnNote") : undefined
      );
    }
  } catch (error) {
    fail("/app/reservations", error);
  }

  revalidatePath("/app");
  revalidatePath("/app/reservations");
}
