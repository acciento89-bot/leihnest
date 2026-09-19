# LeihNest Inventory and Maintenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade LeihNest inventory from basic name/location/quantity records into structured, searchable, maintainable shared equipment with categories, tags, inventory IDs, effective quantities, maintenance, damage, and item detail pages.

**Architecture:** Keep `Item` as the inventory aggregate. Add optional category/tag relations, operational status, and unavailable quantity. Maintenance/damage history is stored separately in `MaintenanceEvent`; photos reuse existing protected item media and are linked through a join table.

**Tech Stack:** Prisma 7, PostgreSQL 17, Zod, Sharp/media service, Vitest, Next.js.

**Spec:** `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`

## Global Constraints

- Existing items migrate to `AVAILABLE` with `unavailableQuantity = 0`.
- `unavailableQuantity` must be between 0 and `totalQuantity`.
- Effective quantity is `totalQuantity - unavailableQuantity`.
- OUT_OF_SERVICE and RETIRED items are not reservable.
- Existing reservation/media history is preserved.
- Categories/tags are group-scoped.
- Item media remains protected by existing group membership rules.

## Review Focus

1. Reducing total quantity below unavailable quantity must fail.
2. RETIRED item stays visible in history but disappears from active inventory by default.
3. Tag/category IDs from another group must be rejected.
4. Damage photos must not become public URLs.
5. A resolved maintenance event does not silently change quantities unless the explicit resolution requests it.

---

### Task 1: Add item operational status and effective quantity

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_item_operational_status/migration.sql`
- Modify: `src/features/items/item-schema.ts`
- Modify: `src/features/items/item-schema.test.ts`
- Modify: `src/features/items/item-service.ts`
- Create: `src/features/items/effective-quantity.ts`
- Create: `src/features/items/effective-quantity.test.ts`

**Interfaces:**
- Produces `ItemOperationalStatus = AVAILABLE | PARTIALLY_UNAVAILABLE | OUT_OF_SERVICE | RETIRED`.
- Produces `effectiveQuantity(item): number`.

- [ ] **Step 1: Write failing quantity/status tests**

```ts
it("subtracts unavailable quantity from total", () => {
  expect(effectiveQuantity({
    totalQuantity: 10,
    unavailableQuantity: 2,
    operationalStatus: "PARTIALLY_UNAVAILABLE",
  })).toBe(8);
});

it("returns zero for out-of-service items", () => {
  expect(effectiveQuantity({
    totalQuantity: 10,
    unavailableQuantity: 0,
    operationalStatus: "OUT_OF_SERVICE",
  })).toBe(0);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/items/effective-quantity.test.ts src/features/items/item-schema.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add fields and migration**

Add to `Item`:

```prisma
operationalStatus   ItemOperationalStatus @default(AVAILABLE)
unavailableQuantity Int                   @default(0)
inventoryCode       String?
barcode             String?
```

Add a service-level invariant:

```ts
if (unavailableQuantity < 0 || unavailableQuantity > totalQuantity) {
  throw new Error("INVALID_UNAVAILABLE_QUANTITY");
}
```

- [ ] **Step 4: Update item create/update**

Existing forms default to AVAILABLE/0. Archive maps to RETIRED instead of only setting `active=false`; keep `active` compatible during migration and set it false for RETIRED.

- [ ] **Step 5: Run migration and GREEN**

Run:

```sh
npx prisma migrate dev --name item_operational_status
npm test -- src/features/items
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/items
git commit -m "feat: add operational inventory quantities"
```

---

### Task 2: Add group-scoped categories and tags

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_item_categories_tags/migration.sql`
- Create: `src/features/items/category-tag-service.ts`
- Create: `src/features/items/category-tag-service.test.ts`
- Modify: `src/features/items/item-service.ts`

**Interfaces:**
- Produces `createCategory(groupId, actorId, name)`.
- Produces `setItemCategory(groupId, actorId, itemId, categoryId | null)`.
- Produces `setItemTags(groupId, actorId, itemId, tagIds)`.

- [ ] **Step 1: Write failing cross-group test**

```ts
it("rejects assigning a category from another group", async () => {
  await expect(setItemCategory(groupA, ownerA, itemA, categoryFromGroupB))
    .rejects.toThrow("FORBIDDEN");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/items/category-tag-service.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add schema**

Models:

```text
ItemCategory(groupId, name, normalizedName)
Tag(groupId, name, normalizedName)
ItemTag(itemId, tagId)
```

Unique category/tag name per group after normalization.

- [ ] **Step 4: Seed system suggestions without locking users**

UI may suggest Werkzeug, Veranstaltung, Garten, Sport, Elektronik, Haushalt, Fahrzeuge/Zubehoer, Sonstiges; persistence still uses normal group categories.

- [ ] **Step 5: Run migration/GREEN**

Run:

```sh
npx prisma migrate dev --name item_categories_tags
npm test -- src/features/items/category-tag-service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/items
git commit -m "feat: add inventory categories and tags"
```

---

### Task 3: Add maintenance and damage records

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_maintenance_events/migration.sql`
- Create: `src/features/maintenance/maintenance-schema.ts`
- Create: `src/features/maintenance/maintenance-service.ts`
- Create: `src/features/maintenance/maintenance-service.test.ts`

**Interfaces:**
- Produces `createMaintenanceEvent(groupId, actorId, itemId, input)`.
- Produces `resolveMaintenanceEvent(groupId, actorId, eventId, input)`.

- [ ] **Step 1: Write failing damage-quantity test**

```ts
it("can mark part of a pooled item unavailable when damage is reported", async () => {
  await createMaintenanceEvent(groupId, adminId, itemId, {
    type: "DAMAGE",
    quantity: 2,
    note: "Two benches have broken hinges",
    markUnavailable: true,
  });
  expect((await db.item.findUniqueOrThrow({ where: { id: itemId } })).unavailableQuantity).toBe(2);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/maintenance/maintenance-service.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add models**

```text
MaintenanceEvent
- id
- groupId
- itemId
- type: DAMAGE | MAINTENANCE | INSPECTION | REPAIR
- status: OPEN | RESOLVED
- quantity
- note
- resolutionNote?
- createdByUserId
- resolvedByUserId?
- createdAt
- resolvedAt?
```

- [ ] **Step 4: Implement transactional quantity changes**

When `markUnavailable=true`, increase unavailable quantity but never above total. Resolve action accepts explicit `restoreQuantity`; only then decrease unavailable quantity.

- [ ] **Step 5: Run migration/GREEN**

Run:

```sh
npx prisma migrate dev --name maintenance_events
npm test -- src/features/maintenance
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/maintenance
git commit -m "feat: track inventory maintenance and damage"
```

---

### Task 4: Link protected item photos to maintenance events

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_maintenance_media_links/migration.sql`
- Create: `src/features/maintenance/maintenance-media.ts`
- Create: `src/features/maintenance/maintenance-media.test.ts`
- Modify: `src/features/media/media-service.ts`

**Interfaces:**
- Produces `linkMaintenancePhoto(groupId, actorId, eventId, assetId)`.
- Reuses existing ITEM media authorization.

- [ ] **Step 1: Write failing foreign-item media test**

```ts
it("rejects linking an image that belongs to another item", async () => {
  await expect(linkMaintenancePhoto(groupId, adminId, eventForItemA, assetForItemB))
    .rejects.toThrow("FORBIDDEN");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/maintenance/maintenance-media.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add join table**

```text
MaintenanceMedia(eventId, mediaAssetId)
```

Require media kind ITEM and matching `itemId`.

- [ ] **Step 4: Keep media protection unchanged**

No public URL and no new media serving path; existing authenticated media route remains authoritative.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/maintenance src/features/media`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/maintenance src/features/media/media-service.ts
git commit -m "feat: attach protected photos to maintenance"
```

---

### Task 5: Add item detail page and maintenance UI

**Files:**
- Create: `src/app/(app)/app/items/[itemId]/page.tsx`
- Create: `src/components/app/item-detail.tsx`
- Create: `src/components/app/maintenance-controls.tsx`
- Modify: `src/app/(app)/app/items/page.tsx`
- Modify: `src/features/workspace/workspace.ts`
- Create: `src/app/(app)/app/items/item-detail.test.tsx`

**Interfaces:**
- Consumes item/category/tag/media/maintenance services.
- Produces detailed inventory view used later by QR scan.

- [ ] **Step 1: Write failing status rendering test**

```tsx
it("shows effective availability and open maintenance", () => {
  render(<ItemDetail item={fixtureItem} openMaintenance={fixtureEvents} locale="de" />);
  expect(screen.getByText(/8.*verfuegbar/i)).toBeInTheDocument();
  expect(screen.getByText(/2.*ausser Betrieb/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/app/\(app\)/app/items/item-detail.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement page/UI**

Display images, category, tags, inventory code/barcode, location, total/effective/unavailable quantity, reservation CTA, open/resolved maintenance, manager controls.

- [ ] **Step 4: Add damage/maintenance forms**

Managers can report/resolve events and optionally upload/link photos.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/maintenance src/app/\(app\)/app/items/item-detail.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/app/\(app\)/app/items src/components/app src/features/workspace/workspace.ts
git commit -m "feat: add inventory detail and maintenance UI"
```

---

### Task 6: Add structured inventory filters and management UI

**Files:**
- Create: `src/features/items/item-filter.ts`
- Create: `src/features/items/item-filter.test.ts`
- Modify: `src/app/(app)/app/items/page.tsx`
- Modify: `src/app/(app)/app/actions.ts`
- Create: `src/components/app/inventory-filters.tsx`
- Create: `src/components/app/category-tag-controls.tsx`

**Interfaces:**
- Produces `buildItemWhere(groupId, filter): Prisma.ItemWhereInput`.

- [ ] **Step 1: Write failing filter-combination test**

```ts
it("combines category tag status and text within one group", () => {
  const where = buildItemWhere("g1", {
    q: "beamer",
    categoryId: "c1",
    tagIds: ["t1"],
    status: "AVAILABLE",
  });
  expect(where.groupId).toBe("g1");
  expect(where.operationalStatus).toBe("AVAILABLE");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/items/item-filter.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement bounded filters**

Filter values are validated IDs/enums/text length <= 120. No raw SQL from URL parameters.

- [ ] **Step 4: Add category/tag management**

OWNER/ADMIN can create/rename/archive categories/tags. Archive keeps historical item relations readable.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/items
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/items src/app/\(app\)/app src/components/app
git commit -m "feat: add structured inventory filtering"
```

---

### Task 7: Inventory E2E regression

**Files:**
- Create: `e2e/inventory-maintenance.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Covers create item → category/tag → partial outage → damage photo → resolve → retire.

- [ ] **Step 1: Write the E2E flow**

Assert that a 10-unit item with 2 unavailable displays 8 available and cannot be reserved above 8 in the later reservation UI.

- [ ] **Step 2: Run suite**

Run: `npx playwright test e2e/inventory-maintenance.spec.ts`  
Expected after implementation: PASS.

- [ ] **Step 3: Run full code gate**

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
git add e2e/inventory-maintenance.spec.ts .github/workflows/ci.yml
git commit -m "test: cover inventory maintenance lifecycle"
```
