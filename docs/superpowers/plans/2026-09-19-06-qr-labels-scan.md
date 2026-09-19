# LeihNest QR Labels and Scan Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every inventory item a stable QR identity, printable labels, mobile scanning, and role-aware scan actions for reservation, handover, return, and maintenance.

**Architecture:** Each item receives a separate random QR token that is only a locator, never an authorization credential. Scanning resolves the token server-side, requires authentication and current group membership, then redirects into the existing item detail/workflow pages.

**Tech Stack:** Prisma 7, PostgreSQL 17, qrcode, @zxing/browser, Next.js 16, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`

## Global Constraints

- QR token is non-sequential and unrelated to authorization.
- Unknown/inaccessible tokens return 404 after authentication.
- Labels contain no member, reservation, billing, or private maintenance data.
- Existing item IDs remain internal.
- Scan actions reuse existing reservation/maintenance authorization.
- QR scanner has manual-code fallback.

## Review Focus

1. Knowing a valid token without group membership does not reveal the item.
2. A retired item label remains resolvable for managers/history but cannot start a new reservation.
3. Bulk label sheet does not include items from another group.
4. Camera permission denial leaves manual code entry usable.
5. Token remains stable across item rename/edit.

---

### Task 1: Add stable item QR token

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_item_qr_token/migration.sql`
- Create: `src/features/qr/qr-token.ts`
- Create: `src/features/qr/qr-token.test.ts`
- Create: `src/features/qr/qr-service.ts`
- Create: `src/features/qr/qr-service.test.ts`

**Interfaces:**
- Produces `resolveItemQrToken(token, userId)`.
- Produces `getItemQrUrl(item, publicUrl)`.

- [ ] **Step 1: Write failing authorization test**

```ts
it("does not resolve an item QR token for a non-member", async () => {
  await expect(resolveItemQrToken(item.qrToken, outsiderId))
    .rejects.toThrow("NOT_FOUND");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/qr`  
Expected: FAIL.

- [ ] **Step 3: Add unique token field and backfill**

Add:

```prisma
qrToken String @unique
```

Migration:
1. add nullable column;
2. backfill existing items with `gen_random_uuid()::text`;
3. add unique index;
4. set NOT NULL.

New items receive `crypto.randomUUID()` from item service.

- [ ] **Step 4: Implement resolver**

Resolve item by token, then verify current user membership in item.groupId. Return `NOT_FOUND` for missing or inaccessible.

- [ ] **Step 5: Run migration/GREEN**

Run:

```sh
npx prisma migrate dev --name item_qr_token
npm test -- src/features/qr
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/qr src/features/items/item-service.ts
git commit -m "feat: add stable item QR identities"
```

---

### Task 2: Add authenticated scan target route

**Files:**
- Create: `src/app/i/[token]/page.tsx`
- Create: `src/features/qr/scan-target.test.ts`
- Modify: `src/features/auth/safe-next-path.test.ts`

**Interfaces:**
- Consumes `resolveItemQrToken`.
- Produces `/i/<token>` locator route.

- [ ] **Step 1: Write failing login-return test**

```ts
it("builds a safe login return path for a QR target", () => {
  expect(safeNextPath("/i/550e8400-e29b-41d4-a716-446655440000"))
    .toBe("/i/550e8400-e29b-41d4-a716-446655440000");
});
```

- [ ] **Step 2: Run RED if current guard rejects the path**

Run: `npm test -- src/features/auth/safe-next-path.test.ts src/features/qr/scan-target.test.ts`.

- [ ] **Step 3: Implement route**

No session → redirect to:

```
/login?next=/i/<token>
```

Authorized session → resolve item → set active group if necessary → redirect to `/app/items/<itemId>?source=qr`.

- [ ] **Step 4: Preserve 404 privacy**

Authenticated outsider receives `notFound()`.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/qr src/features/auth/safe-next-path.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/app/i src/features/qr src/features/auth/safe-next-path.test.ts
git commit -m "feat: resolve authenticated item QR scans"
```

---

### Task 3: Generate printable single and bulk QR labels

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/features/qr/label-service.ts`
- Create: `src/features/qr/label-service.test.ts`
- Create: `src/app/(app)/app/items/[itemId]/label/page.tsx`
- Create: `src/app/(app)/app/labels/page.tsx`
- Create: `src/components/app/qr-label.tsx`

**Interfaces:**
- Produces `createQrSvg(url): Promise<string>`.
- Produces printable item labels.

- [ ] **Step 1: Write failing label-content test**

```ts
it("contains only safe item label fields", async () => {
  const label = await buildLabelModel(item, "https://leihnest.de");
  expect(label).toEqual({
    name: item.name,
    inventoryCode: item.inventoryCode,
    shortId: expect.any(String),
    qrUrl: expect.stringContaining("/i/"),
  });
  expect(label).not.toHaveProperty("location");
  expect(label).not.toHaveProperty("maintenanceNote");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/qr/label-service.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Install QR generator**

Run: `npm install qrcode && npm install -D @types/qrcode`.

- [ ] **Step 4: Implement print views**

Single label and A4 bulk sheet. Bulk query requires group membership and explicit selected item IDs all belonging to active group.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/qr
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add package.json package-lock.json src/features/qr src/app/\(app\)/app/items src/app/\(app\)/app/labels src/components/app/qr-label.tsx
git commit -m "feat: add printable QR inventory labels"
```

---

### Task 4: Add mobile QR scanner with manual fallback

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/app/(app)/app/scan/page.tsx`
- Create: `src/components/app/qr-scanner.tsx`
- Create: `src/features/qr/scan-input.ts`
- Create: `src/features/qr/scan-input.test.ts`
- Modify: `src/components/app/workspace-controls.tsx`
- Modify: `src/features/workspace/workspace.ts`

**Interfaces:**
- Produces `parseLeihNestQrInput(value): string | null`.

- [ ] **Step 1: Write failing parser test**

```ts
it("accepts a full LeihNest QR URL and extracts only its token", () => {
  expect(parseLeihNestQrInput(
    "https://leihnest.de/i/550e8400-e29b-41d4-a716-446655440000"
  )).toBe("550e8400-e29b-41d4-a716-446655440000");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/qr/scan-input.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Install camera scanner**

Run: `npm install @zxing/browser`.

Use `BrowserQRCodeReader` only after explicit user action. Stop camera tracks when component unmounts or a code is found.

- [ ] **Step 4: Add fallback**

If camera permission/API fails, show a text input for full URL/token and a “Code oeffnen” button.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/qr
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add package.json package-lock.json src/app/\(app\)/app/scan src/components/app/qr-scanner.tsx src/features/qr src/components/app/workspace-controls.tsx src/features/workspace/workspace.ts
git commit -m "feat: add mobile QR scanning"
```

---

### Task 5: Add role-aware quick actions after scan

**Files:**
- Modify: `src/app/(app)/app/items/[itemId]/page.tsx`
- Create: `src/components/app/item-quick-actions.tsx`
- Create: `src/features/qr/quick-actions.test.ts`

**Interfaces:**
- Produces `availableQuickActions(item, membership, reservationState)`.

- [ ] **Step 1: Write failing role matrix test**

```ts
it("gives MEMBER reserve but not handover actions", () => {
  expect(availableQuickActions(item, { role: "MEMBER" }, state))
    .toEqual(expect.arrayContaining(["RESERVE"]));
  expect(availableQuickActions(item, { role: "MEMBER" }, state))
    .not.toEqual(expect.arrayContaining(["HANDOVER"]));
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/qr/quick-actions.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement quick actions**

MEMBER: availability/reserve.  
ADMIN/OWNER: reserve + pending/approved handover/return links + maintenance action.  
RETIRED/OUT_OF_SERVICE: no reserve.

- [ ] **Step 4: Reuse existing domain actions**

No scan-only bypass; quick actions submit/route into existing authorized services.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/qr
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/app/\(app\)/app/items src/components/app/item-quick-actions.tsx src/features/qr
git commit -m "feat: add QR item quick actions"
```

---

### Task 6: QR browser smoke

**Files:**
- Create: `e2e/qr-scan.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Covers label → unauthenticated redirect → login → item → role actions.

- [ ] **Step 1: Write E2E scenario**

Use generated token directly instead of CI camera hardware. Confirm outsider returns 404 and group member reaches the item.

- [ ] **Step 2: Run**

Run: `npx playwright test e2e/qr-scan.spec.ts`  
Expected: PASS.

- [ ] **Step 3: Full gate**

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
git add e2e/qr-scan.spec.ts .github/workflows/ci.yml
git commit -m "test: verify QR inventory workflow"
```
