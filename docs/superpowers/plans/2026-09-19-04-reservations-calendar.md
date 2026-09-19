# LeihNest Reservation Integrity and Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make reservation availability accurate before and during approval, safe under concurrency, editable before approval, maintenance-aware, and easy to understand through group/member/item calendar views.

**Architecture:** Availability is centralized in one domain service that uses `effectiveQuantity(item)`. Approval serializes per item using a PostgreSQL transaction-level advisory lock before recomputing committed quantity. Calendar views are query projections over existing reservations rather than duplicate calendar data.

**Tech Stack:** Prisma 7, PostgreSQL 17, Zod, Vitest, Playwright, Next.js.

**Spec:** `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`

## Global Constraints

- PENDING reservations do not consume committed inventory.
- APPROVED and HANDED_OUT reservations consume inventory for overlapping ranges.
- Effective inventory quantity includes maintenance/out-of-service deductions.
- OUT_OF_SERVICE and RETIRED items cannot receive new reservations.
- Approval must re-check availability while holding the item approval lock.
- A MEMBER can edit only their own PENDING reservation.
- Historical reservations remain immutable except explicitly supported manager corrections.

## Review Focus

1. Two concurrent approvals cannot overbook one item.
2. Editing a PENDING reservation cannot move it to another group's item.
3. Availability preview is advisory; approval remains authoritative.
4. Boundary ranges where one ends exactly when another starts do not overlap.
5. Calendar queries never expose reservations from another group.

---

### Task 1: Centralize effective reservation availability

**Files:**
- Modify: `src/features/reservations/availability.ts`
- Modify: `src/features/reservations/availability.test.ts`
- Create: `src/features/reservations/availability-service.ts`
- Create: `src/features/reservations/availability-service.test.ts`

**Interfaces:**
- Produces `getAvailability(groupId, itemId, startsAt, endsAt, excludeReservationId?): Promise<AvailabilityResult>`.

```ts
type AvailabilityResult = {
  effectiveQuantity: number;
  committedQuantity: number;
  remainingQuantity: number;
  reservable: boolean;
  reason?: "OUT_OF_SERVICE" | "RETIRED";
};
```

- [ ] **Step 1: Write failing maintenance-aware test**

```ts
it("subtracts unavailable units before overlapping reservations", async () => {
  const result = await service.getAvailability(groupId, itemId, start, end);
  expect(result).toMatchObject({
    effectiveQuantity: 8,
    committedQuantity: 3,
    remainingQuantity: 5,
    reservable: true,
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/reservations/availability*`  
Expected: FAIL.

- [ ] **Step 3: Implement service**

Load active group item. Reject cross-group item. Call `effectiveQuantity`. Aggregate only APPROVED/HANDED_OUT ranges matching:

```ts
startsAt: { lt: proposedEnd },
endsAt: { gt: proposedStart },
```

Optionally exclude the current reservation during edit.

- [ ] **Step 4: Keep boundary semantics pinned**

Add test where existing `endsAt === proposed.startsAt`; expected no overlap.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/reservations/availability*`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/reservations/availability*
git commit -m "feat: centralize reservation availability"
```

---

### Task 2: Make approval safe under concurrent requests

**Files:**
- Modify: `src/features/reservations/reservation-service.ts`
- Create: `src/features/reservations/concurrent-approval.integration.test.ts`

**Interfaces:**
- Produces internal `lockReservationItem(tx, itemId): Promise<void>`.

- [ ] **Step 1: Write failing concurrent approval integration test**

Create one item with quantity 1 and two overlapping PENDING reservations of quantity 1. Execute:

```ts
const results = await Promise.allSettled([
  approveReservation(groupId, adminA, reservationA),
  approveReservation(groupId, adminB, reservationB),
]);

expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
expect(await db.reservation.count({
  where: { itemId, status: "APPROVED" },
})).toBe(1);
```

- [ ] **Step 2: Run RED against isolated PostgreSQL**

Run: `LEIHNEST_TEST_DATABASE_URL=... npm test -- src/features/reservations/concurrent-approval.integration.test.ts`  
Expected: FAIL if both approvals can commit.

- [ ] **Step 3: Add per-item transaction lock**

Inside the existing approval transaction, before reading committed quantity:

```ts
await tx.$queryRaw`
  SELECT pg_advisory_xact_lock(hashtext(${reservation.itemId}))
`;
```

Then reload item and availability after the lock. Use parameterized Prisma tagged query only.

- [ ] **Step 4: Re-check item effective quantity under lock**

Reject if item became OUT_OF_SERVICE/RETIRED or if maintenance reduced quantity.

- [ ] **Step 5: Run GREEN repeatedly**

Run the concurrency test at least 20 times through a loop wrapper or Vitest repeated case; expected exactly one approval each run.

- [ ] **Step 6: Commit**

```sh
git add src/features/reservations/reservation-service.ts src/features/reservations/concurrent-approval.integration.test.ts
git commit -m "fix: prevent concurrent reservation overbooking"
```

---

### Task 3: Add availability preview to reservation form

**Files:**
- Create: `src/app/api/reservations/availability/route.ts`
- Create: `src/app/api/reservations/availability/route.test.ts`
- Create: `src/components/app/availability-preview.tsx`
- Modify: `src/app/(app)/app/reservations/page.tsx`
- Modify: `src/features/workspace/workspace.ts`

**Interfaces:**
- Produces authenticated `GET /api/reservations/availability?itemId=&startsAt=&endsAt=`.

- [ ] **Step 1: Write failing cross-group API test**

```ts
it("returns 404 for an item outside the active user's memberships", async () => {
  const response = await requestAvailability(otherGroupItemId, actor);
  expect(response.status).toBe(404);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/app/api/reservations/availability/route.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement validated API**

Parse ISO times with Zod; require end > start. Resolve membership for item group. Return remaining/effective/committed values without other users' reservation details.

- [ ] **Step 4: Add client preview**

Debounce request after item/start/end change. Show:
- available quantity;
- out-of-service message;
- “final availability checked again on approval”.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/app/api/reservations/availability src/features/reservations
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/app/api/reservations/availability src/components/app/availability-preview.tsx src/app/\(app\)/app/reservations/page.tsx src/features/workspace/workspace.ts
git commit -m "feat: preview reservation availability"
```

---

### Task 4: Add PENDING reservation editing and manager cancellation

**Files:**
- Modify: `src/features/reservations/reservation-service.ts`
- Modify: `src/features/reservations/reservation-schema.ts`
- Create: `src/features/reservations/reservation-edit.test.ts`
- Modify: `src/app/(app)/app/actions.ts`
- Modify: `src/app/(app)/app/reservations/page.tsx`

**Interfaces:**
- Produces `updatePendingReservation(groupId, userId, reservationId, input)`.
- Produces `managerCancelReservation(groupId, actorId, reservationId, reason?)`.

- [ ] **Step 1: Write failing ownership/state tests**

```ts
it("does not edit another member's pending reservation", async () => {
  await expect(updatePendingReservation(groupId, userB, reservationA, input))
    .rejects.toThrow("FORBIDDEN");
});

it("does not edit an approved reservation", async () => {
  await expect(updatePendingReservation(groupId, ownerUser, approvedId, input))
    .rejects.toThrow("INVALID_STATE");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/reservations/reservation-edit.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement edit**

Allow item/quantity/start/end/purpose changes only while PENDING and owned by caller. Validate new item belongs to same group and is reservable.

- [ ] **Step 4: Add manager cancellation**

OWNER/ADMIN may cancel PENDING/APPROVED with optional max-300 reason; never HANDED_OUT/RETURNED.

- [ ] **Step 5: Add UI and run GREEN**

Run:

```sh
npm test -- src/features/reservations
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/reservations src/app/\(app\)/app/actions.ts src/app/\(app\)/app/reservations/page.tsx
git commit -m "feat: edit and manage pending reservations"
```

---

### Task 5: Add reservation calendar query model

**Files:**
- Create: `src/features/reservations/calendar-service.ts`
- Create: `src/features/reservations/calendar-service.test.ts`
- Create: `src/components/app/reservation-calendar.tsx`
- Create: `src/app/(app)/app/calendar/page.tsx`
- Modify: `src/components/app/workspace-controls.tsx`
- Modify: `src/features/workspace/workspace.ts`

**Interfaces:**
- Produces `getCalendarEvents(groupId, actorId, range, scope)`.
- Scope: `GROUP | MINE | ITEM`.

- [ ] **Step 1: Write failing scope test**

```ts
it("MINE scope includes only the actor's reservations", async () => {
  const events = await getCalendarEvents(groupId, userA, range, { type: "MINE" });
  expect(events.every(event => event.userId === userA)).toBe(true);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/reservations/calendar-service.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement bounded range query**

Limit requested calendar range to maximum 13 months. Fetch only reservations intersecting range. Group view requires membership; item view requires item group membership.

- [ ] **Step 4: Implement responsive month/week/list UI**

Mobile defaults to agenda/list; desktop can render month/week grid. Status visually distinct without relying only on color.

- [ ] **Step 5: Add navigation and run GREEN**

Run:

```sh
npm test -- src/features/reservations/calendar-service.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/reservations/calendar-service* src/components/app/reservation-calendar.tsx src/app/\(app\)/app/calendar src/components/app/workspace-controls.tsx src/features/workspace/workspace.ts
git commit -m "feat: add reservation calendar"
```

---

### Task 6: Add item reservation history/detail integration

**Files:**
- Modify: `src/app/(app)/app/items/[itemId]/page.tsx`
- Create: `src/components/app/item-reservation-history.tsx`
- Create: `src/features/reservations/item-reservation-query.test.ts`

**Interfaces:**
- Consumes calendar/reservation query service.
- Produces current/upcoming/history sections for an item.

- [ ] **Step 1: Write failing history privacy test**

```ts
it("does not return item reservations to a non-member", async () => {
  await expect(getItemReservationHistory(itemId, outsiderId))
    .rejects.toThrow("FORBIDDEN");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/reservations/item-reservation-query.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement query and UI**

Show status/times/quantity/requester within group only. Paginate historical rows.

- [ ] **Step 4: Run GREEN/build**

Run:

```sh
npm test -- src/features/reservations
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add src/app/\(app\)/app/items src/components/app/item-reservation-history.tsx src/features/reservations
git commit -m "feat: show item reservation history"
```

---

### Task 7: Reservation integrity E2E

**Files:**
- Create: `e2e/reservations-calendar.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Covers preview, edit, approval, conflict, handover, return, calendar.

- [ ] **Step 1: Write E2E flow**

Create 10-unit item, mark 2 unavailable, reserve 5, approve, preview second overlapping request as 3 remaining, attempt 4 and confirm manager approval rejects.

- [ ] **Step 2: Run E2E**

Run: `npx playwright test e2e/reservations-calendar.spec.ts`  
Expected after implementation: PASS.

- [ ] **Step 3: Run full reservation suite**

Run:

```sh
npm test -- src/features/reservations
npm run lint
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```sh
git add e2e/reservations-calendar.spec.ts .github/workflows/ci.yml
git commit -m "test: cover reservation integrity and calendar"
```
