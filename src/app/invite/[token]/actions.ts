"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { toActionError } from "@/features/actions/action-result";
import { acceptInvitation } from "@/features/invitations/invitation-service";

export async function acceptInvitationAction(token: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  try {
    await acceptInvitation(token, session.user.id, session.user.email);
  } catch (error) {
    redirect(`/invite/${token}?error=${encodeURIComponent(toActionError(error))}`);
  }

  redirect("/app/members?joined=1");
}
