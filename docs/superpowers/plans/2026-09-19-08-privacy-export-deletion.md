# LeihNest Privacy, Data Export, and Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give users a complete personal data export and safe account deletion path while preserving group operational history in pseudonymized form and preventing orphaned ownership/billing state.

**Architecture:** Product relations that represent historical actions become nullable toward `User` where identity is not required for referential integrity. Account deletion first checks group ownership, then lets Better Auth remove auth data while database `SET NULL` behavior preserves reservation/item/maintenance/audit records without retaining the deleted user's identity. Personal export is generated server-side from an explicit allowlist.

**Tech Stack:** Prisma 7, PostgreSQL 17, Better Auth 1.6, Next.js 16, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`

## Global Constraints

- Personal export is available on Free and is not a Plus entitlement.
- Export never contains password hashes, session tokens, OAuth access/refresh tokens, Passkey public key material, Stripe secrets, SMTP secrets, invitation raw tokens, or internal encryption keys.
- Account deletion is blocked while user is OWNER of any group.
- Historical group reservations/items/maintenance/audit survive in pseudonymized form.
- Deleted users lose all memberships and auth access immediately.
- Privacy copy describes actual providers/features in use.

## Review Focus

1. Export excludes every credential/token-bearing field even when models later gain new columns.
2. Deleting a former borrower does not cascade-delete reservation history.
3. Sole-owner deletion is blocked before Better Auth removes the user.
4. Deleted user cannot remain recipient of queued notifications.
5. Data export cannot be requested for another user ID by tampering with URL/body.

---

### Task 1: Make historical user relations deletion-safe

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_privacy_nullable_history_actors/migration.sql`
- Modify: `src/app/(app)/app/reservations/page.tsx`
- Modify: `src/features/maintenance/maintenance-service.ts`
- Create: `src/features/privacy/deletion-relations.integration.test.ts`

**Interfaces:**
- Changes historical relations to nullable `onDelete: SetNull`.

- [ ] **Step 1: Write failing deletion-history test**

```ts
it("preserves a returned reservation after borrower deletion", async () => {
  await seedReturnedReservation({ userId });
  await deleteTestUser(userId);
  const reservation = await db.reservation.findUniqueOrThrow({ where: { id: reservationId } });
  expect(reservation.status).toBe("RETURNED");
  expect(reservation.userId).toBeNull();
});
```

- [ ] **Step 2: Run RED**

Run with isolated PostgreSQL:

`npm test -- src/features/privacy/deletion-relations.integration.test.ts`

Expected: FAIL with current cascade relation.

- [ ] **Step 3: Change historical actor relations**

At minimum:

```text
Reservation.userId -> nullable, onDelete SetNull
Item.createdByUserId -> nullable, onDelete SetNull
MaintenanceEvent.createdByUserId -> nullable, onDelete SetNull
MaintenanceEvent.resolvedByUserId -> nullable, onDelete SetNull
AuditEvent.actorUserId -> already nullable/SetNull
```

Update UI to display localized “Deleted member” when historical user relation is null.

- [ ] **Step 4: Add migration**

Migration alters foreign keys without deleting rows.

- [ ] **Step 5: Run migration/GREEN**

Run:

```sh
npx prisma migrate dev --name privacy_nullable_history_actors
npm test -- src/features/privacy/deletion-relations.integration.test.ts src/features/reservations
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/privacy src/app/\(app\)/app/reservations/page.tsx src/features/maintenance
git commit -m "fix: preserve history after account deletion"
```

---

### Task 2: Add explicit personal data export projection

**Files:**
- Create: `src/features/privacy/personal-export.ts`
- Create: `src/features/privacy/personal-export.test.ts`
- Create: `src/app/api/privacy/export/route.ts`

**Interfaces:**
- Produces `buildPersonalDataExport(userId): Promise<PersonalDataExport>`.

- [ ] **Step 1: Write failing secret-field test**

```ts
it("never exports credential or session secret fields", async () => {
  const exportData = await buildPersonalDataExport(userId);
  const serialized = JSON.stringify(exportData);
  expect(serialized).not.toMatch(/password|accessToken|refreshToken|sessionToken|privateKey/i);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/privacy/personal-export.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement allowlisted export**

Include only:

```ts
{
  generatedAt,
  user: { id, name, email, emailVerified, createdAt, updatedAt },
  memberships: [{ groupId, groupName, role, joinedAt }],
  reservations: [{ id, groupId, itemName, quantity, startsAt, endsAt, status, createdAt }],
  connectedProviders: ["credential", "google", "apple"],
  notificationPreferences,
  securityEventSummaries
}
```

Do not serialize raw Prisma user/account/session models.

- [ ] **Step 4: Add authenticated route**

Route derives user ID from session only. Ignore/reject any supplied `userId`. Return UTF-8 JSON attachment with `Cache-Control: no-store`.

- [ ] **Step 5: Run GREEN**

Run:

```sh
npm test -- src/features/privacy
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/privacy src/app/api/privacy/export
git commit -m "feat: add personal data export"
```

---

### Task 3: Coordinate account deletion cleanup

**Files:**
- Modify: `src/features/auth/account-deletion.ts`
- Create: `src/features/privacy/account-cleanup.ts`
- Create: `src/features/privacy/account-cleanup.test.ts`
- Modify: `src/features/auth/auth-options.ts`

**Interfaces:**
- Produces `prepareAccountDeletion(userId): Promise<void>`.
- Produces `afterAccountDeletion(userId): Promise<void>`.

- [ ] **Step 1: Write failing queued-notification cleanup test**

```ts
it("removes notification delivery targets before auth user deletion", async () => {
  await prepareAccountDeletion(userId);
  expect(await db.notification.count({ where: { userId } })).toBe(0);
  expect(await db.notificationPreference.count({ where: { userId } })).toBe(0);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/privacy/account-cleanup.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement pre-delete rules**

1. assert no OWNER memberships;
2. revoke/delete pending invitations created by user;
3. remove notification preferences/deliveries safely;
4. delete memberships or rely on cascade;
5. set any non-FK safe actor-name audit snapshot to null if it directly identifies deleted account;
6. keep group history rows with actor IDs null after deletion.

- [ ] **Step 4: Wire Better Auth hooks**

Use `beforeDelete` to call ownership guard/preparation; `afterDelete` to log only non-identifying cleanup result.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/privacy src/features/auth/account-deletion.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/privacy src/features/auth
git commit -m "feat: coordinate privacy-safe account deletion"
```

---

### Task 4: Add complete owner group export

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/features/exports/group-export.ts`
- Create: `src/features/exports/group-export.test.ts`
- Create: `src/app/api/exports/group/route.ts`

**Interfaces:**
- Produces `buildGroupExport(groupId, ownerId)`.
- Returns ZIP containing JSON/CSV datasets.

- [ ] **Step 1: Write failing owner-only test**

```ts
it("rejects group export for ADMIN", async () => {
  await expect(buildGroupExport(groupId, adminId))
    .rejects.toThrow("FORBIDDEN");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/exports/group-export.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Install archive writer**

Run: `npm install archiver && npm install -D @types/archiver`.

- [ ] **Step 4: Build explicit export datasets**

ZIP contains:
- `group.json`;
- `items.csv`;
- `reservations.csv`;
- `members.csv`;
- `maintenance.csv`;
- `activity.csv`.

CSV uses existing formula-neutralization helper. No auth provider/token data.

- [ ] **Step 5: Run GREEN**

Run:

```sh
npm test -- src/features/exports
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add package.json package-lock.json src/features/exports src/app/api/exports/group
git commit -m "feat: add complete owner group export"
```

---

### Task 5: Add privacy and deletion UI

**Files:**
- Create: `src/components/app/privacy-controls.tsx`
- Modify: `src/app/(app)/app/settings/page.tsx`
- Modify: `src/features/workspace/workspace.ts`
- Create: `src/features/privacy/privacy-controls.test.tsx`

**Interfaces:**
- Consumes personal export route and Better Auth delete-user flow.

- [ ] **Step 1: Write failing owner-block message test**

```tsx
it("explains ownership transfer requirement before account deletion", () => {
  render(<PrivacyControls ownedGroups={["Gartenfreunde"]} locale="de" />);
  expect(screen.getByText(/Eigentuemer.*uebertragen/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/privacy/privacy-controls.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement UI**

Buttons:
- “Meine Daten exportieren”;
- “Konto loeschen”.

Deletion control lists blocking owned groups and links to group ownership settings.

- [ ] **Step 4: Add explicit confirmation**

Never delete from a single accidental click. Trigger Better Auth verified deletion flow.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/privacy
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/components/app/privacy-controls.tsx src/app/\(app\)/app/settings/page.tsx src/features/workspace/workspace.ts src/features/privacy
git commit -m "feat: add privacy export and deletion controls"
```

---

### Task 6: Update privacy/legal surface to actual providers

**Files:**
- Modify: `src/app/datenschutz/page.tsx`
- Create: `src/features/privacy/privacy-copy.test.ts`

**Interfaces:**
- Documents actual processing only.

- [ ] **Step 1: Write content regression test**

Assert privacy copy mentions:
- server-stored uploads;
- Stripe;
- SMTP email delivery;
- Google Sign-In;
- Sign in with Apple;
- Passkeys/WebAuthn;
- notification/reminder processing;
- deletion/export rights.

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/privacy/privacy-copy.test.ts`  
Expected: FAIL until copy is updated.

- [ ] **Step 3: Update DE privacy page factually**

Do not claim tracking/analytics or data sale. Do not add unsupported legal guarantees.

- [ ] **Step 4: Keep existing Impressum untouched**

Only privacy processing disclosure changes.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/privacy/privacy-copy.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/app/datenschutz/page.tsx src/features/privacy/privacy-copy.test.ts
git commit -m "docs: update LeihNest privacy processing disclosures"
```

---

### Task 7: Privacy deletion E2E

**Files:**
- Create: `e2e/privacy-deletion.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Covers export, ownership block, transfer, verified delete fixture, preserved group history.

- [ ] **Step 1: Write browser/integration scenario**

User owns group → deletion blocked → transfer ownership → export data → delete account → former reservation remains visible to group as “Deleted member”.

- [ ] **Step 2: Run**

Run: `npx playwright test e2e/privacy-deletion.spec.ts`  
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
git add e2e/privacy-deletion.spec.ts .github/workflows/ci.yml
git commit -m "test: verify privacy export and account deletion"
```
