# LeihNest Multi-Group and Member Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LeihNest truly multi-group and complete the invitation/member/ownership lifecycle without weakening server-side authorization.

**Architecture:** Introduce explicit active-group context while keeping every service authorization scoped to the requested `groupId`. Membership/ownership changes run transactionally and enforce exactly one OWNER per group. The active group is UX state, never an authorization primitive.

**Tech Stack:** Next.js 16, Prisma 7, PostgreSQL 17, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`

## Global Constraints

- A user may belong to multiple groups.
- No route/action trusts a cookie group ID without re-checking membership.
- Exactly one OWNER per group.
- ADMIN can manage MEMBER but cannot create/remove/replace OWNER.
- Last OWNER cannot leave.
- Existing group data and billing state stay attached to the correct group.

## Review Focus

1. Tampered active-group cookie cannot expose another group.
2. Ownership transfer is atomic.
3. Removing a member also removes their future access but preserves historical reservation records.
4. Invitation revoke/resend never revives an already accepted invitation.
5. Deleting/archive group cannot orphan an active Stripe subscription.

---

### Task 1: Add explicit active-group context

**Files:**
- Create: `src/features/groups/active-group.ts`
- Create: `src/features/groups/active-group.test.ts`
- Modify: `src/features/groups/group-service.ts`
- Modify: `src/features/workspace/locale.ts`

**Interfaces:**
- Produces `getMembershipsForUser(userId)`.
- Produces `resolveActiveGroup(userId, requestedGroupId?): MembershipWithGroup | null`.

- [ ] **Step 1: Write failing tampered-cookie test**

```ts
it("ignores an active group id the user does not belong to", async () => {
  const resolved = await resolveActiveGroup(userId, foreignGroupId);
  expect(resolved?.groupId).toBe(ownedGroupId);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/groups/active-group.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement deterministic fallback**

Lookup all memberships ordered by creation date. Use requested group only if membership exists; otherwise fall back to first membership or null.

- [ ] **Step 4: Replace primary-membership read path**

Keep `getPrimaryMembership` temporarily as compatibility wrapper, but new pages/services should use explicit active-group resolver.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/groups`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/groups src/features/workspace/locale.ts
git commit -m "feat: add explicit active group context"
```

---

### Task 2: Add group switcher and multi-group workspace routing

**Files:**
- Modify: `src/app/(app)/app/layout.tsx`
- Create: `src/components/app/group-switcher.tsx`
- Create: `src/app/(app)/app/group-actions.ts`
- Modify: `src/features/workspace/workspace.ts`
- Create: `src/app/(app)/app/group-switcher.test.tsx`

**Interfaces:**
- Consumes `resolveActiveGroup`.
- Produces server action `setActiveGroupAction(formData)`.

- [ ] **Step 1: Write failing rendering test**

```tsx
it("shows every group membership and marks the active group", () => {
  render(<GroupSwitcher memberships={memberships} activeGroupId="g2" locale="de" />);
  expect(screen.getByText("Gartenfreunde")).toBeInTheDocument();
  expect(screen.getByText("Hausgemeinschaft")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/app/\(app\)/app/group-switcher.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement signed-safe cookie selection**

Server action validates requested group against current user's memberships, then writes `leihnest-active-group=<groupId>` as HttpOnly false, SameSite Lax, Secure in production.

- [ ] **Step 4: Update workspace pages and allow additional group creation**

Dashboard/items/reservations/members/settings resolve active group from validated context. The group switcher/settings exposes a `Neue Gruppe` / `Create group` action even when the user already has memberships; it reuses `createGroupAction`, selects the newly created group, and does not replace existing memberships.

- [ ] **Step 5: Run GREEN**

Run:

```sh
npm test -- src/features/groups src/app/\(app\)/app/group-switcher.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/app/\(app\)/app src/components/app/group-switcher.tsx src/features/workspace/workspace.ts
git commit -m "feat: add multi-group workspace switching"
```

---

### Task 3: Add invitation resend and revoke

**Files:**
- Modify: `src/features/invitations/invitation-service.ts`
- Create: `src/features/invitations/invitation-lifecycle.test.ts`
- Modify: `src/app/(app)/app/actions.ts`
- Modify: `src/app/(app)/app/members/page.tsx`
- Modify: `src/features/workspace/workspace.ts`

**Interfaces:**
- Produces `revokeInvitation(groupId, actorId, invitationId)`.
- Produces `resendInvitation(groupId, actorId, invitationId, locale)`.

- [ ] **Step 1: Write failing accepted-invite guard test**

```ts
it("cannot resend an already accepted invitation", async () => {
  await expect(resendInvitation(groupId, ownerId, acceptedInviteId, "de"))
    .rejects.toThrow("INVITATION_INVALID");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/invitations/invitation-lifecycle.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement revoke/resend**

Revoke deletes or marks unusable only pending invitation. Resend generates a fresh token hash and fresh seven-day expiry; old token becomes invalid.

- [ ] **Step 4: Add member page controls**

OWNER/ADMIN can resend/revoke. UI shows localized result.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/invitations`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/invitations src/app/\(app\)/app/actions.ts src/app/\(app\)/app/members/page.tsx src/features/workspace/workspace.ts
git commit -m "feat: manage pending invitations"
```

---

### Task 4: Add role changes and member removal

**Files:**
- Create: `src/features/groups/member-service.ts`
- Create: `src/features/groups/member-service.test.ts`
- Modify: `src/app/(app)/app/actions.ts`
- Modify: `src/app/(app)/app/members/page.tsx`

**Interfaces:**
- Produces `changeMemberRole(groupId, actorId, memberUserId, role)`.
- Produces `removeMember(groupId, actorId, memberUserId)`.

- [ ] **Step 1: Write failing ADMIN boundary test**

```ts
it("does not allow an ADMIN to promote a MEMBER to OWNER", async () => {
  await expect(changeMemberRole(groupId, adminId, memberId, "OWNER"))
    .rejects.toThrow("FORBIDDEN");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/groups/member-service.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement role matrix**

OWNER: may manage ADMIN/MEMBER.  
ADMIN: may manage MEMBER only.  
Neither service path directly changes OWNER; ownership has dedicated transfer method.

- [ ] **Step 4: Preserve history on removal**

Delete `Membership`, not User/Reservation rows. Historical reservations remain.

- [ ] **Step 5: Add UI controls and run GREEN**

Run:

```sh
npm test -- src/features/groups/member-service.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/groups/member-service* src/app/\(app\)/app/actions.ts src/app/\(app\)/app/members/page.tsx
git commit -m "feat: manage group member roles"
```

---

### Task 5: Add atomic ownership transfer and leave-group flow

**Files:**
- Modify: `src/features/groups/member-service.ts`
- Modify: `src/features/groups/member-service.test.ts`
- Create: `src/components/app/group-membership-controls.tsx`
- Modify: `src/app/(app)/app/settings/page.tsx`

**Interfaces:**
- Produces `transferOwnership(groupId, currentOwnerId, newOwnerId)`.
- Produces `leaveGroup(groupId, userId)`.

- [ ] **Step 1: Write failing owner invariant test**

```ts
it("transfers ownership in one transaction and leaves one owner", async () => {
  await transferOwnership(groupId, ownerId, adminId);
  expect(await countOwners(groupId)).toBe(1);
  expect(await getOwnerId(groupId)).toBe(adminId);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/groups/member-service.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement transaction**

Demote old OWNER to ADMIN and promote new member to OWNER inside one Prisma transaction. Validate new owner is existing group member.

- [ ] **Step 4: Implement leave rules**

MEMBER/ADMIN may leave. OWNER must transfer ownership or delete/archive group first.

- [ ] **Step 5: Add destructive confirmation UI and run GREEN**

Run: `npm test -- src/features/groups/member-service.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/groups/member-service* src/components/app/group-membership-controls.tsx src/app/\(app\)/app/settings/page.tsx
git commit -m "feat: add ownership transfer and leave group"
```

---

### Task 6: Add group archive/delete lifecycle with billing guard

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_group_lifecycle/migration.sql`
- Create: `src/features/groups/group-lifecycle.ts`
- Create: `src/features/groups/group-lifecycle.test.ts`
- Modify: `src/app/(app)/app/settings/page.tsx`
- Create: `src/components/app/group-danger-zone.tsx`

**Interfaces:**
- Produces `archiveGroup(groupId, ownerId)`.
- Produces `deleteGroup(groupId, ownerId, confirmation)`.

- [ ] **Step 1: Write failing active-subscription deletion test**

```ts
it("blocks hard deletion while Stripe subscription is active", async () => {
  await expect(deleteGroup(groupId, ownerId, groupName))
    .rejects.toThrow("ACTIVE_SUBSCRIPTION");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/groups/group-lifecycle.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add lifecycle fields**

Add `archivedAt DateTime?` to Group. Archived group is read-only except owner recovery/delete/billing management.

- [ ] **Step 4: Implement hard-delete prerequisites**

Require exact group-name confirmation, owner role, no active paid entitlement, no unresolved Stripe checkout state. Cleanup media through existing media lifecycle before relational deletion.

- [ ] **Step 5: Run migration/tests**

Run:

```sh
npx prisma migrate dev --name group_lifecycle
npm test -- src/features/groups
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/groups src/app/\(app\)/app/settings/page.tsx src/components/app/group-danger-zone.tsx
git commit -m "feat: add safe group lifecycle controls"
```

---

### Task 7: Multi-group E2E and billing regression

**Files:**
- Create: `e2e/multi-group.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes complete group/member lifecycle.
- Produces browser regression coverage.

- [ ] **Step 1: Write end-to-end multi-group test**

Scenario:

```text
User A creates Group A
User A accepts invite to Group B
switch to Group B
cannot read Group A item through Group B context
switch back
transfer Group A ownership
leave Group A
Group B subscription/settings remain untouched
```

- [ ] **Step 2: Run and fix only real integration gaps**

Run: `npx playwright test e2e/multi-group.spec.ts`  
Expected after implementation: PASS.

- [ ] **Step 3: Run full gate**

Run:

```sh
npm test
npm run lint
npm run typecheck
npm run build
npx playwright test e2e/multi-group.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```sh
git add e2e/multi-group.spec.ts .github/workflows/ci.yml
git commit -m "test: cover multi-group member lifecycle"
```
