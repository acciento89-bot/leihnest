import { db } from "@/lib/db";
import { canInvite, type GroupRole } from "@/features/groups/permissions";
import { invitationInputSchema } from "./invitation-schema";
import { hashInvitationToken, invitationExpiresAt, newInvitationToken } from "./invitation-token";

async function requireInviter(groupId: string, userId: string) {
  const membership = await db.membership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership || !canInvite(membership.role as GroupRole)) throw new Error("FORBIDDEN");
}

export async function createInvitation(groupId: string, userId: string, input: unknown) {
  await requireInviter(groupId, userId);
  const data = invitationInputSchema.parse(input);
  const token = newInvitationToken();
  const tokenHash = hashInvitationToken(token);

  await db.$transaction(async (tx) => {
    await tx.invitation.deleteMany({
      where: { groupId, email: data.email, acceptedAt: null },
    });
    await tx.invitation.create({
      data: {
        groupId,
        email: data.email,
        role: data.role,
        tokenHash,
        expiresAt: invitationExpiresAt(),
        createdByUserId: userId,
      },
    });
  });

  return token;
}

export async function acceptInvitation(token: string, userId: string, userEmail: string) {
  const tokenHash = hashInvitationToken(token);
  const invitation = await db.invitation.findUnique({ where: { tokenHash } });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
    throw new Error("INVITATION_INVALID");
  }
  if (invitation.email !== userEmail.trim().toLowerCase()) {
    throw new Error("INVITATION_EMAIL_MISMATCH");
  }

  await db.$transaction([
    db.membership.upsert({
      where: { groupId_userId: { groupId: invitation.groupId, userId } },
      create: { groupId: invitation.groupId, userId, role: invitation.role },
      update: {},
    }),
    db.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);
}
