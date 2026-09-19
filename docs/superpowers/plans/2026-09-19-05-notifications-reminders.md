# LeihNest Notifications and Reminder Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable in-app notifications, configurable email notifications, reservation reminders, and a PostgreSQL-backed background worker without introducing Redis.

**Architecture:** Domain mutations emit notification events through a local service. In-app rows are persisted transactionally with stable event keys. Email/reminder delivery is queued through pg-boss and handled by a separate worker container. Auth verification/reset mail remains direct through Better Auth because those flows are latency-sensitive and security-specific.

**Tech Stack:** Prisma 7, PostgreSQL 17, pg-boss, Nodemailer mail abstraction, Next.js 16, Vitest, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`

## Global Constraints

- Job retries must not duplicate in-app rows or email deliveries.
- Notification payloads contain only safe IDs/copy inputs, never secrets.
- Blocks/public-community concerns do not exist; notification audience is group membership and account ownership.
- Security-critical account email is not disabled by normal notification preferences.
- Reminder jobs re-check current reservation status before delivery.
- Worker uses the existing PostgreSQL service and no Redis.

## Review Focus

1. Retried email job sends at most once after successful durable delivery acknowledgement.
2. A canceled/returned reservation does not receive stale due reminders.
3. Removed members stop receiving future group notifications.
4. Event payload cannot leak another group's data.
5. Worker failure does not affect web health or corrupt queued jobs.

---

### Task 1: Add notification and preference models

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_notifications/migration.sql`
- Create: `src/features/notifications/notification-service.ts`
- Create: `src/features/notifications/notification-service.test.ts`
- Create: `src/features/notifications/notification-types.ts`

**Interfaces:**
- Produces `createNotificationOnce(input)`.
- Produces `markNotificationRead(userId, id)`.
- Produces `markAllNotificationsRead(userId)`.
- Produces `getNotificationPreferences(userId)`.

- [ ] **Step 1: Write failing event-key dedupe test**

```ts
it("creates one notification per recipient and event key", async () => {
  await service.createNotificationOnce(event);
  await service.createNotificationOnce(event);
  expect(await db.notification.count({
    where: { userId: event.userId, eventKey: event.eventKey },
  })).toBe(1);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/notifications/notification-service.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add schema**

```text
Notification
- id
- userId
- groupId?
- eventKey
- type
- resourceType?
- resourceId?
- safePayload Json
- readAt?
- createdAt
unique(userId, eventKey)

NotificationPreference
- userId
- category
- emailEnabled
- inAppEnabled
unique(userId, category)
```

- [ ] **Step 4: Implement service**

Unknown preference means both channels enabled for product notifications. Account security mail does not use this table.

- [ ] **Step 5: Migrate/run GREEN**

Run:

```sh
npx prisma migrate dev --name notifications
npm test -- src/features/notifications
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/notifications
git commit -m "feat: add durable notifications"
```

---

### Task 2: Add pg-boss queue abstraction

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/features/jobs/queue.ts`
- Create: `src/features/jobs/queue.test.ts`
- Create: `src/features/jobs/job-types.ts`

**Interfaces:**
- Produces:

```ts
export interface JobQueue {
  enqueue<T>(name: JobName, payload: T, options?: {
    singletonKey?: string;
    retryLimit?: number;
  }): Promise<string>;
}
```

- [ ] **Step 1: Write failing singleton test**

```ts
it("reuses a singleton job identity for duplicate logical work", async () => {
  const first = await queue.enqueue("notification.email", payload, {
    singletonKey: "email:event-1:user-1",
  });
  const second = await queue.enqueue("notification.email", payload, {
    singletonKey: "email:event-1:user-1",
  });
  expect(second).toBe(first);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/jobs/queue.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Install and implement pg-boss adapter**

Run:

```sh
npm install pg-boss
```

Use `DATABASE_URL`. Default retry limit 5 with exponential/backoff behavior supported by pg-boss.

- [ ] **Step 4: Add in-memory fake for unit tests**

No CI unit test requires external queue except dedicated integration tests.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/jobs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add package.json package-lock.json src/features/jobs
git commit -m "feat: add PostgreSQL job queue"
```

---

### Task 3: Add worker process and Docker service

**Files:**
- Modify: `package.json`
- Create: `src/worker/main.ts`
- Create: `src/worker/registry.ts`
- Create: `src/worker/health.ts`
- Modify: `Dockerfile`
- Modify: `compose.portainer.yaml`
- Modify: `docker-compose.portainer.yml`
- Modify: `docker-compose.yml`
- Create: `src/worker/worker-startup.test.ts`

**Interfaces:**
- Produces separate `worker` container/process.
- Worker registers handlers and schedules reminder scans.

- [ ] **Step 1: Write failing registry test**

```ts
it("registers all required notification jobs", () => {
  expect(buildWorkerRegistry().jobNames()).toEqual(
    expect.arrayContaining([
      "notification.email",
      "reminder.due-scan",
      "reminder.overdue-scan",
    ])
  );
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/worker/worker-startup.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add production worker command**

Install `tsx` as a runtime dependency and add:

```json
"worker": "tsx src/worker/main.ts"
```

Add Docker `worker` stage based on the dependency image, copying source/config/prisma and running `npm run worker`.

- [ ] **Step 4: Add compose worker**

Worker depends on migrate and receives DATABASE_URL plus SMTP/runtime URL variables. It does not expose a public port.

Both Portainer compose files remain identical.

- [ ] **Step 5: Run config/build verification**

Run:

```sh
cmp compose.portainer.yaml docker-compose.portainer.yml
docker compose -f compose.portainer.yaml config
docker build --target worker -t leihnest-worker:test .
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add package.json package-lock.json src/worker Dockerfile compose.portainer.yaml docker-compose.portainer.yml docker-compose.yml
git commit -m "feat: add notification worker service"
```

---

### Task 4: Add idempotent email delivery records

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_notification_deliveries/migration.sql`
- Create: `src/features/notifications/email-delivery-service.ts`
- Create: `src/features/notifications/email-delivery-service.test.ts`
- Create: `src/worker/jobs/send-notification-email.ts`
- Create: `src/worker/jobs/send-notification-email.test.ts`

**Interfaces:**
- Produces one durable delivery row per `notificationId + channel`.
- Produces worker handler `sendNotificationEmailJob(payload)`.

- [ ] **Step 1: Write failing retry test**

```ts
it("does not send twice after a completed delivery is retried", async () => {
  await handler({ deliveryId });
  await handler({ deliveryId });
  expect(fakeMailer.send).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/worker/jobs/send-notification-email.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add delivery model**

```text
NotificationDelivery
- id
- notificationId
- channel EMAIL
- status PENDING | PROCESSING | SENT | FAILED
- attempts
- providerMessageId?
- sentAt?
- lastErrorCode?
unique(notificationId, channel)
```

- [ ] **Step 4: Implement send handler**

Before sending, load current notification recipient and preference. After successful SMTP send, atomically mark SENT. Retry sees SENT and exits.

- [ ] **Step 5: Migrate/run GREEN**

Run:

```sh
npx prisma migrate dev --name notification_deliveries
npm test -- src/features/notifications src/worker/jobs/send-notification-email.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/notifications src/worker/jobs
git commit -m "feat: deliver notification emails idempotently"
```

---

### Task 5: Emit reservation/member/maintenance notifications

**Files:**
- Create: `src/features/notifications/domain-events.ts`
- Create: `src/features/notifications/domain-events.test.ts`
- Modify: `src/features/reservations/reservation-service.ts`
- Modify: `src/features/groups/member-service.ts`
- Modify: `src/features/maintenance/maintenance-service.ts`
- Modify: `src/features/invitations/invitation-service.ts`

**Interfaces:**
- Produces event helpers:
  - `notifyReservationRequested`
  - `notifyReservationStatusChanged`
  - `notifyMembershipChanged`
  - `notifyMaintenanceChanged`

- [ ] **Step 1: Write failing recipient test**

```ts
it("notifies managers of a new reservation but not unrelated members", async () => {
  await events.reservationRequested(reservation);
  const recipients = await notificationRecipientsFor(reservation.id);
  expect(recipients).toEqual(expect.arrayContaining([ownerId, adminId]));
  expect(recipients).not.toContain(unrelatedMemberId);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/notifications/domain-events.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement audience rules**

Reservation requested → OWNER/ADMIN.  
Approved/rejected/canceled/handover/return → requester.  
Maintenance open → OWNER/ADMIN plus reporter where different.  
Membership removed/role changed → affected member.  
Ownership transfer → old/new owner.

- [ ] **Step 4: Enqueue email only after notification row exists**

Use stable eventKey based on resource/action/version/status.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/notifications src/features/reservations src/features/groups src/features/maintenance`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/notifications src/features/reservations/reservation-service.ts src/features/groups/member-service.ts src/features/maintenance/maintenance-service.ts src/features/invitations/invitation-service.ts
git commit -m "feat: emit group domain notifications"
```

---

### Task 6: Add due-soon and overdue reminder scans

**Files:**
- Create: `src/features/notifications/reminder-service.ts`
- Create: `src/features/notifications/reminder-service.test.ts`
- Create: `src/worker/jobs/due-reminder-scan.ts`
- Create: `src/worker/jobs/overdue-reminder-scan.ts`
- Modify: `src/worker/registry.ts`

**Interfaces:**
- Produces `scanDueSoon(now)`.
- Produces `scanOverdue(now)`.

- [ ] **Step 1: Write failing stale-status test**

```ts
it("does not remind a reservation that was returned before the worker runs", async () => {
  await markReturned(reservationId);
  await service.scanOverdue(now);
  expect(await notificationsForReservation(reservationId)).toHaveLength(0);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/notifications/reminder-service.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement scans**

Due soon: APPROVED/HANDED_OUT relevant time window, create one event key per reminder type/reservation.  
Overdue: HANDED_OUT with `endsAt < now`, dedupe one initial overdue alert and optionally one daily bucket while still overdue.

- [ ] **Step 4: Schedule jobs**

Use pg-boss scheduling:
- due scan every 15 minutes;
- overdue scan every 30 minutes.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/notifications src/worker/jobs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/notifications src/worker
git commit -m "feat: add due and overdue reminders"
```

---

### Task 7: Add notification center and preferences UI

**Files:**
- Create: `src/app/(app)/app/notifications/page.tsx`
- Create: `src/components/app/notification-center.tsx`
- Create: `src/components/app/notification-preferences.tsx`
- Modify: `src/components/app/workspace-controls.tsx`
- Modify: `src/app/(app)/app/settings/page.tsx`
- Modify: `src/features/workspace/workspace.ts`
- Create: `src/features/notifications/notification-view.test.ts`

**Interfaces:**
- Consumes notification/preference service.
- Produces unread count, list/read-all, preference controls.

- [ ] **Step 1: Write failing safe-payload test**

```ts
it("drops a target title when the referenced item no longer belongs to the recipient's group", async () => {
  const view = await toNotificationView(notification, recipientId);
  expect(view.targetLabel).toBeNull();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/notifications/notification-view.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement query-time safe view**

Notification target links are re-authorized. Stale/inaccessible target becomes generic notification text without leaking resource details.

- [ ] **Step 4: Add UI**

Navigation bell/count; page with unread/read; mark all read; preferences for reservation/reminder/maintenance/member email.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/notifications
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/app/\(app\)/app/notifications src/components/app src/app/\(app\)/app/settings/page.tsx src/features/workspace/workspace.ts src/features/notifications
git commit -m "feat: add notification center and preferences"
```

---

### Task 8: Notification E2E and worker integration test

**Files:**
- Create: `e2e/notifications.spec.ts`
- Create: `src/features/release/notification-worker.integration.test.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Covers request → manager notification → approval → member notification → reminder dedupe.

- [ ] **Step 1: Write integration test**

Use isolated PostgreSQL and fake mailer to prove duplicate queue delivery results in one email.

- [ ] **Step 2: Write browser test**

Create reservation as MEMBER, log in as OWNER, approve via notification target, log back in as MEMBER, verify approval notification.

- [ ] **Step 3: Run**

```sh
npm test -- src/features/release/notification-worker.integration.test.ts
npx playwright test e2e/notifications.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run compose/build**

```sh
cmp compose.portainer.yaml docker-compose.portainer.yml
docker compose -f compose.portainer.yaml config
docker build --target worker -t leihnest-worker:ci .
docker build -t leihnest:ci .
```

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add e2e/notifications.spec.ts src/features/release/notification-worker.integration.test.ts .github/workflows/ci.yml
git commit -m "test: verify notifications and reminder worker"
```
