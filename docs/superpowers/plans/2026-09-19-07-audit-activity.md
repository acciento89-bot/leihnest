# LeihNest Audit and Activity History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a durable, privacy-aware activity history for important group and account security changes without storing secrets or mutable log blobs.

**Architecture:** Domain services append explicit typed audit events after successful state changes, preferably within the same database transaction. Events store only whitelisted safe metadata and immutable snapshots needed for human-readable history. Group events are visible to OWNER/ADMIN; personal security events are visible only to the affected user.

**Tech Stack:** Prisma 7, PostgreSQL 17, Zod, Vitest, Next.js.

**Spec:** `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`

## Global Constraints

- Audit is append-only.
- No passwords, auth/session tokens, OAuth tokens, invitation raw tokens, Stripe secrets, SMTP credentials, or image bytes.
- Historical actor name is a safe snapshot; account deletion may null the actor relation later.
- Group activity requires current OWNER/ADMIN membership to view.
- Personal security history is never visible to group managers merely because they share a group.
- Audit failure inside a critical transaction must not leave business data committed without its required audit event.

## Review Focus

1. Audit metadata sanitizer rejects unexpected secret-like keys.
2. Removed members cannot read old group audit just because they were involved in an event.
3. Account deletion can preserve pseudonymous historical events without dangling foreign keys.
4. Retried/idempotent webhook/job operations do not create duplicate logical audit events.
5. Audit pagination remains deterministic under concurrent new events.

---

### Task 1: Add audit schema and safe metadata builder

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_audit_events/migration.sql`
- Create: `src/features/audit/audit-types.ts`
- Create: `src/features/audit/safe-metadata.ts`
- Create: `src/features/audit/safe-metadata.test.ts`
- Create: `src/features/audit/audit-service.ts`
- Create: `src/features/audit/audit-service.test.ts`

**Interfaces:**
- Produces `recordAuditEvent(txOrDb, input)`.
- Produces `safeAuditMetadata(type, input)`.

- [ ] **Step 1: Write failing secret-key test**

```ts
it.each(["token", "password", "secret", "accessToken", "refreshToken"])(
  "rejects forbidden metadata key %s",
  (key) => {
    expect(() => safeAuditMetadata("GENERIC_TEST" as never, { [key]: "value" }))
      .toThrow("UNSAFE_AUDIT_METADATA");
  }
);
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/audit`  
Expected: FAIL.

- [ ] **Step 3: Add schema**

```text
AuditEvent
- id
- groupId?
- actorUserId?
- actorNameSnapshot?
- subjectUserId?
- eventKey?
- type
- resourceType?
- resourceId?
- safeMetadata Json
- createdAt

index(groupId, createdAt, id)
index(subjectUserId, createdAt, id)
unique(eventKey) when non-null through service/DB constraint strategy
```

Use nullable actor relation with `onDelete: SetNull`.

- [ ] **Step 4: Implement explicit metadata schemas**

Each event type has a Zod metadata schema. Do not accept arbitrary object pass-through.

- [ ] **Step 5: Migrate/run GREEN**

Run:

```sh
npx prisma migrate dev --name audit_events
npm test -- src/features/audit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/audit
git commit -m "feat: add safe append-only audit events"
```

---

### Task 2: Audit inventory and maintenance mutations

**Files:**
- Modify: `src/features/items/item-service.ts`
- Modify: `src/features/items/category-tag-service.ts`
- Modify: `src/features/maintenance/maintenance-service.ts`
- Create: `src/features/audit/inventory-audit.integration.test.ts`

**Interfaces:**
- Emits:
  - `ITEM_CREATED`
  - `ITEM_UPDATED`
  - `ITEM_RETIRED`
  - `ITEM_AVAILABILITY_CHANGED`
  - `MAINTENANCE_OPENED`
  - `MAINTENANCE_RESOLVED`
  - `CATEGORY_CHANGED`
  - `TAGS_CHANGED`.

- [ ] **Step 1: Write failing same-transaction test**

```ts
it("records an item unavailable-quantity change with before and after values", async () => {
  await maintenanceService.createMaintenanceEvent(groupId, adminId, itemId, input);
  const event = await latestAudit("ITEM_AVAILABILITY_CHANGED", itemId);
  expect(event.safeMetadata).toEqual({
    beforeUnavailableQuantity: 0,
    afterUnavailableQuantity: 2,
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/audit/inventory-audit.integration.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Emit inside business transactions**

Where mutation already uses `db.$transaction`, write audit through that transaction client.

- [ ] **Step 4: Keep metadata minimal**

Names/status/quantities/category IDs are allowed. Description text is not copied wholesale into audit.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/audit src/features/items src/features/maintenance`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/items src/features/maintenance src/features/audit
git commit -m "feat: audit inventory and maintenance changes"
```

---

### Task 3: Audit reservation lifecycle

**Files:**
- Modify: `src/features/reservations/reservation-service.ts`
- Create: `src/features/audit/reservation-audit.integration.test.ts`

**Interfaces:**
- Emits:
  - `RESERVATION_CREATED`
  - `RESERVATION_UPDATED`
  - `RESERVATION_APPROVED`
  - `RESERVATION_REJECTED`
  - `RESERVATION_CANCELLED`
  - `RESERVATION_HANDED_OUT`
  - `RESERVATION_RETURNED`.

- [ ] **Step 1: Write failing state transition test**

```ts
it("audits approval with quantity and date range but not auth data", async () => {
  await approveReservation(groupId, adminId, reservationId);
  const event = await latestAudit("RESERVATION_APPROVED", reservationId);
  expect(event.safeMetadata).toMatchObject({
    quantity: 1,
    startsAt: expect.any(String),
    endsAt: expect.any(String),
  });
  expect(JSON.stringify(event.safeMetadata)).not.toMatch(/token|password/i);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/audit/reservation-audit.integration.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Integrate audit after lock/state check**

Approval audit happens in the same transaction as approval.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- src/features/audit src/features/reservations`  
Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add src/features/reservations/reservation-service.ts src/features/audit
git commit -m "feat: audit reservation lifecycle"
```

---

### Task 4: Audit membership, group, billing, and security events

**Files:**
- Modify: `src/features/groups/member-service.ts`
- Modify: `src/features/groups/group-lifecycle.ts`
- Modify: `src/features/invitations/invitation-service.ts`
- Modify: `src/features/billing/webhook-service.ts`
- Create: `src/features/audit/account-security-events.ts`
- Create: `src/features/audit/security-audit.test.ts`

**Interfaces:**
- Emits group events for invitation/member/role/ownership/group lifecycle/Plus changes.
- Produces `recordSecurityEvent(userId, type, metadata)`.

- [ ] **Step 1: Write failing billing dedupe test**

```ts
it("records one logical Plus status audit event for one processed Stripe event", async () => {
  await processStripeEvent(event);
  await processStripeEvent(event);
  expect(await auditCountByEventKey(`stripe:${event.id}`)).toBe(1);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/audit/security-audit.test.ts src/features/billing/webhook.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add group lifecycle event types**

Include MEMBER_JOINED, MEMBER_REMOVED, ROLE_CHANGED, OWNERSHIP_TRANSFERRED, INVITATION_CREATED/REVOKED, GROUP_ARCHIVED, PLUS_STATUS_CHANGED.

- [ ] **Step 4: Add personal security types**

Include PASSWORD_CHANGED, PASSWORD_RESET, EMAIL_CHANGE_REQUESTED, EMAIL_CHANGED, PASSKEY_ADDED/REMOVED, SOCIAL_LINKED/UNLINKED, TWO_FACTOR_ENABLED/DISABLED, SESSION_REVOKED.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/audit src/features/groups src/features/billing`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/groups src/features/invitations src/features/billing src/features/audit
git commit -m "feat: audit membership billing and security"
```

---

### Task 5: Add group activity and personal security history UI

**Files:**
- Create: `src/features/audit/audit-query.ts`
- Create: `src/features/audit/audit-query.test.ts`
- Create: `src/app/(app)/app/activity/page.tsx`
- Create: `src/components/app/activity-timeline.tsx`
- Create: `src/components/app/security-history.tsx`
- Modify: `src/app/(app)/app/settings/page.tsx`
- Modify: `src/components/app/workspace-controls.tsx`
- Modify: `src/features/workspace/workspace.ts`

**Interfaces:**
- Produces `listGroupActivity(groupId, actorId, cursor)`.
- Produces `listSecurityHistory(userId, cursor)`.

- [ ] **Step 1: Write failing removed-member test**

```ts
it("denies group activity to a user whose membership was removed", async () => {
  await expect(listGroupActivity(groupId, removedUserId, null))
    .rejects.toThrow("FORBIDDEN");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/audit/audit-query.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement cursor pagination**

Order `createdAt DESC, id DESC`; cursor contains both values. Page size max 50.

- [ ] **Step 4: Add UI**

Group Activity navigation shown only OWNER/ADMIN. Settings security history shown only current user. Render human-readable localized messages from event type + safe metadata.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/audit
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/audit src/app/\(app\)/app/activity src/components/app src/app/\(app\)/app/settings/page.tsx src/components/app/workspace-controls.tsx src/features/workspace/workspace.ts
git commit -m "feat: add activity and security history"
```

---

### Task 6: Audit E2E regression

**Files:**
- Create: `e2e/activity-audit.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Covers item edit, approval, role change, visibility of audit to authorized/unauthorized members.

- [ ] **Step 1: Write browser test**

OWNER edits item, approves reservation, changes a MEMBER to ADMIN. Verify all three events appear. Log in as MEMBER and verify Activity is inaccessible.

- [ ] **Step 2: Run**

Run: `npx playwright test e2e/activity-audit.spec.ts`  
Expected: PASS.

- [ ] **Step 3: Run full gate**

Run:

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```sh
git add e2e/activity-audit.spec.ts .github/workflows/ci.yml
git commit -m "test: cover activity audit authorization"
```
