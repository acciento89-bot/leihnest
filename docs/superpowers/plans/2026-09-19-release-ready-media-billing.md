# LeihNest Release-Ready Media + Stripe Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ship durable self-hosted image uploads and group-level LeihNest Plus billing through Stripe while preserving all existing Free workflows and the approved public homepage.

**Architecture:** Media is normalized server-side with sharp, persisted in a dedicated Docker volume, indexed by Prisma, and served only through authenticated routes. Billing is group-scoped: Stripe Checkout and Customer Portal are OWNER-only, signed webhooks synchronize a local subscription projection, and a single entitlement service gates Plus limits, exports, and analytics.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Prisma 7/PostgreSQL, Better Auth, Stripe Node SDK, sharp, Vitest, Docker/Portainer.

**Spec:** docs/superpowers/specs/2026-09-19-release-ready-media-billing-design.md

## Global Constraints

- Production deploys from main; implementation happens on feat/release-ready-media-billing-20260919.
- Do not reinterpret or redesign the approved public homepage.
- PayPal is out of scope.
- Free remains usable and gets one profile image, one group image, and one image per item.
- Plus is group-scoped at EUR 4.99/month or EUR 39.99/year and grants up to five images per item.
- Only the group OWNER can start Stripe Checkout or Customer Portal.
- OWNER and ADMIN may manage group and item images; users manage only their own profile image.
- Uploaded sources are JPEG/PNG/WebP, maximum 8 MiB, decoded and re-encoded to WebP.
- Uploaded media is stored in leihnest-uploads:/data/uploads, never in PostgreSQL blobs or the repository.
- Uploaded media is not public static content and must be authorized on every read.
- Stripe webhooks are the billing source of truth; Checkout browser return never grants Plus by itself.
- Never commit Stripe secrets, webhook secrets, raw payment data, or Portainer production credentials.
- PostgreSQL production data and the existing leihnest-db volume must never be reset or recreated.

## Review Focus

1. Simultaneous item-image uploads at a plan limit: concurrent requests must not exceed one image on Free or five on Plus.
2. Stripe retry/out-of-order events: replayed or older events must not overwrite a newer local subscription projection.
3. Image replacement failure after filesystem write: failed DB persistence must remove the newly written asset.
4. Former member requesting cached media: authorization is rechecked on every request and must return 404 after membership removal.
5. CSV cells beginning with =, +, -, or @: exports must neutralize spreadsheet formulas.

---

### Task 1: Add persistence models and entitlement boundary

**Files:**
- Modify: prisma/schema.prisma
- Create: prisma/migrations/20260919_media_billing/migration.sql
- Create: src/features/billing/billing-types.ts
- Create: src/features/billing/entitlements.ts
- Create/Test: src/features/billing/billing.test.ts
- Create/Test: src/features/release/media-billing.integration.test.ts

**Interfaces:**
- Produces hasPlus(subscription, now): boolean
- Produces itemImageLimit(subscription, now): 1 | 5
- Produces Prisma models MediaAsset, GroupSubscription, ProcessedStripeEvent

- [ ] **Step 1: Write failing entitlement tests**

~~~ts
import { describe, expect, it } from "vitest";
import { hasPlus, itemImageLimit } from "./entitlements";

const now = new Date("2026-09-19T10:00:00Z");
const future = new Date("2026-10-19T10:00:00Z");
const past = new Date("2026-09-18T10:00:00Z");

describe("LeihNest Plus entitlements", () => {
  it.each(["active", "trialing"])("grants Plus for %s inside a live period", status => {
    expect(hasPlus({ status, currentPeriodEnd: future, cancelAtPeriodEnd: false }, now)).toBe(true);
  });
  it("keeps Plus for past_due inside the paid period", () => {
    expect(hasPlus({ status: "past_due", currentPeriodEnd: future, cancelAtPeriodEnd: false }, now)).toBe(true);
  });
  it.each(["canceled", "unpaid", "incomplete_expired"])("rejects %s", status => {
    expect(hasPlus({ status, currentPeriodEnd: future, cancelAtPeriodEnd: false }, now)).toBe(false);
  });
  it("expires Plus after the paid period", () => {
    expect(hasPlus({ status: "active", currentPeriodEnd: past, cancelAtPeriodEnd: true }, now)).toBe(false);
  });
  it("maps Free to one image and Plus to five", () => {
    expect(itemImageLimit(null, now)).toBe(1);
    expect(itemImageLimit({ status: "active", currentPeriodEnd: future, cancelAtPeriodEnd: false }, now)).toBe(5);
  });
});
~~~

- [ ] **Step 2: Run targeted test and confirm RED**

~~~bash
npm test -- src/features/billing/billing.test.ts
~~~

Expected: FAIL because entitlements.ts does not exist.

- [ ] **Step 3: Add additive Prisma models**

Add enums MediaKind(PROFILE,GROUP,ITEM) and BillingInterval(MONTH,YEAR).

Add MediaAsset fields: id, kind, storageKey unique, mimeType, sourceBytes, sourceWidth, sourceHeight, position, optional userId/groupId/itemId, createdAt, updatedAt, plus relations and indexes.

Add GroupSubscription fields: id, groupId unique, stripeCustomerId unique, stripeSubscriptionId optional unique, stripePriceId optional, interval optional, status, currentPeriodEnd optional, cancelAtPeriodEnd, stripeUpdatedAt optional, createdAt, updatedAt.

Add ProcessedStripeEvent fields: id primary key, stripeType, createdAt.

Add relations User.media, Group.media, Group.subscription, Item.media.

Create the migration as additive SQL only: CREATE TYPE/TABLE/INDEX/CONSTRAINT and foreign keys with ON DELETE CASCADE. It must contain no DROP, TRUNCATE, or DELETE.

- [ ] **Step 4: Implement entitlement functions**

~~~ts
import type { SubscriptionSnapshot } from "./billing-types";

const PLUS_STATUSES = new Set(["active", "trialing", "past_due"]);

export function hasPlus(subscription: SubscriptionSnapshot | null | undefined, now = new Date()) {
  if (!subscription || !PLUS_STATUSES.has(subscription.status)) return false;
  if (!subscription.currentPeriodEnd) return subscription.status === "active" || subscription.status === "trialing";
  return subscription.currentPeriodEnd.getTime() > now.getTime();
}

export function itemImageLimit(subscription: SubscriptionSnapshot | null | undefined, now = new Date()): 1 | 5 {
  return hasPlus(subscription, now) ? 5 : 1;
}
~~~

- [ ] **Step 5: Update isolated DB integration setup**

Apply both migration files in order to the per-run schema. Add a persisted test that creates and reloads one subscription and one media asset.

- [ ] **Step 6: Verify and commit**

~~~bash
npm run db:generate
npm test -- src/features/billing/billing.test.ts src/features/release/media-billing.integration.test.ts
npm run typecheck
git add prisma src/features/billing src/features/release/media-billing.integration.test.ts
git commit -m "feat: add media and group billing persistence"
~~~

---

### Task 2: Build secure image normalization and filesystem storage

**Files:**
- Modify: package.json, package-lock.json
- Create: src/features/media/media-types.ts
- Create: src/features/media/image-processor.ts
- Create: src/features/media/media-store.ts
- Create/Test: src/features/media/media.test.ts

**Interfaces:**
- processImage(input: Buffer): Promise<ProcessedImage>
- writeImageVariants(assetId, variants, rootOverride?): Promise<string>
- readVariant(storageKey, variant, rootOverride?): Promise<Buffer>
- removeAsset(storageKey, rootOverride?): Promise<void>

- [ ] **Step 1: Install sharp**

~~~bash
npm install sharp
~~~

- [ ] **Step 2: Write failing processor/store tests**

Tests must reject input above 8 MiB, malformed bytes, unsupported decoded formats, and excessive pixel count. A valid PNG fixture must produce WebP thumb/card/large variants with maximum widths 256/640/1600 and no EXIF.

Use a temporary directory to test write/read/remove and verify temp directories are removed after simulated write failure.

- [ ] **Step 3: Run tests and confirm RED**

~~~bash
npm test -- src/features/media/media.test.ts
~~~

- [ ] **Step 4: Implement media constants**

~~~ts
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 40_000_000;
export const MEDIA_VARIANTS = { thumb: 256, card: 640, large: 1600 } as const;
export type MediaVariant = keyof typeof MEDIA_VARIANTS;
~~~

- [ ] **Step 5: Implement sharp normalization**

Use sharp(input, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS }), require decoded jpeg/png/webp, call rotate(), resize with fit inside and withoutEnlargement, then webp({ quality: 84 }). Do not call withMetadata().

- [ ] **Step 6: Implement safe generated-key filesystem storage**

Storage key is crypto.randomUUID(). Validate any read/delete key against UUID syntax. Write variants into a .tmp-UUID directory with mode 0600, then rename atomically to the final UUID directory. Remove temp tree on failure.

- [ ] **Step 7: Verify and commit**

~~~bash
npm test -- src/features/media/media.test.ts
npm run lint
npm run typecheck
git add package.json package-lock.json src/features/media
git commit -m "feat: add secure volume-backed image processing"
~~~

---

### Task 3: Add authorized media persistence, limits, and endpoints

**Files:**
- Create: src/features/media/media-service.ts
- Create: src/features/media/rate-limit.ts
- Modify/Test: src/features/media/media.test.ts
- Modify: src/features/groups/permissions.ts
- Create: src/app/api/media/[assetId]/[variant]/route.ts
- Create: src/app/api/media/profile/route.ts
- Create: src/app/api/media/group/route.ts
- Create: src/app/api/media/items/[itemId]/route.ts

**Interfaces:**
- uploadProfileImage(userId, file)
- uploadGroupImage(groupId, userId, file)
- uploadItemImage(groupId, itemId, userId, file)
- deleteMedia(assetId, userId)
- reorderItemMedia(groupId, itemId, userId, assetIds)
- getAuthorizedMedia(assetId, userId)

- [ ] **Step 1: Write failing permission and concurrency tests**

Add permission expectations:
OWNER/ADMIN can manage group image; MEMBER cannot. Only OWNER can manage billing.

Integration tests must prove:
- Free second item image fails with IMAGE_LIMIT.
- Plus sixth image fails with IMAGE_LIMIT.
- Two simultaneous Free uploads yield exactly one success.
- A former member can no longer read group/item media after membership deletion.
- A user cannot replace another user's profile image.
- A DB failure after file write removes the new storage directory.

- [ ] **Step 2: Run targeted tests and confirm RED**

~~~bash
npm test -- src/features/media/media.test.ts src/features/release/media-billing.integration.test.ts
~~~

- [ ] **Step 3: Add explicit permission helpers**

~~~ts
export const canManageGroupImage = isManager;
export const canManageBilling = (role: GroupRole) => role === "OWNER";
~~~

- [ ] **Step 4: Implement transactional media service**

For item upload, open a transaction and serialize the item before counting:

~~~ts
await tx.$queryRawUnsafe(
  'SELECT id FROM "Item" WHERE id = $1 AND "groupId" = $2 FOR UPDATE',
  itemId,
  groupId,
);
const subscription = await tx.groupSubscription.findUnique({ where: { groupId } });
const limit = itemImageLimit(subscription);
const count = await tx.mediaAsset.count({ where: { itemId, kind: "ITEM" } });
if (count >= limit) throw new Error("IMAGE_LIMIT");
~~~

Sequence: process image -> write generated variants -> authorize/count/create DB row -> remove new file tree on DB failure. For replacement, commit DB replacement before removing old storage.

- [ ] **Step 5: Implement authenticated read route**

No session, invalid variant, unauthorized membership, missing DB row, or missing file all return 404. Successful response has Content-Type image/webp, Cache-Control private,max-age=300, and X-Content-Type-Options nosniff.

- [ ] **Step 6: Implement upload/delete/reorder routes**

All routes use Better Auth server session and accept no filesystem path from the client. Media mutation limiter: 10 requests per authenticated user per 60 seconds.

Rate limiter API:

~~~ts
export function consumeLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean
~~~

Test it with explicit now values.

- [ ] **Step 7: Verify and commit**

~~~bash
npm test -- src/features/media/media.test.ts src/features/release/media-billing.integration.test.ts
npm run lint
npm run typecheck
git add src/features/media src/features/groups/permissions.ts src/app/api/media
git commit -m "feat: authorize and persist private media uploads"
~~~

---

### Task 4: Add profile, group, and item image UI

**Files:**
- Create: src/components/app/media-controls.tsx
- Modify: src/app/(app)/app/settings/page.tsx
- Modify: src/app/(app)/app/items/page.tsx
- Modify: src/features/groups/group-service.ts
- Modify: src/features/workspace/workspace.ts
- Modify: src/app/(app)/app/workspace.css
- Modify/Test: src/features/workspace/workspace-experience.test.ts

**Interfaces:**
- SingleImageControl(locale, kind, assetId, canEdit, fallbackLabel)
- ItemImageGallery(locale, itemId, assets, limit, canEdit)

- [ ] **Step 1: Add failing DE/EN UI regression tests**

Require profile image, group image, item images, JPEG/PNG/WebP accept list, upload/delete labels, Free/Plus image limit copy, and existing fallbacks.

- [ ] **Step 2: Run UI test and confirm RED**

~~~bash
npm test -- src/features/workspace/workspace-experience.test.ts
~~~

- [ ] **Step 3: Implement client controls**

Single-image control previews /api/media/ASSET/thumb, POSTs FormData to profile/group endpoint, DELETEs existing asset, handles localized pending/error state, and router.refresh() after success.

Item gallery previews ordered media, POSTs new file, DELETEs selected asset, PATCHes ordered asset IDs, and displays the server-derived 1/5 image limit.

- [ ] **Step 4: Query real media in settings/items**

Settings loads the user's PROFILE asset plus current group's GROUP asset/subscription. Items include ordered ITEM media. Item cards use the first persisted image if present, otherwise retain ItemPhoto fallback.

- [ ] **Step 5: Add member-area-only styles/copy**

All new CSS stays inside workspace classes. Do not modify src/components/home/reference-home.css or the approved public homepage.

- [ ] **Step 6: Verify and commit**

~~~bash
npm test -- src/features/workspace/workspace-experience.test.ts src/app/landing-regression.test.ts src/features/design/concept-fidelity.test.tsx
npm run lint
npm run typecheck
npm run build
git add src/components/app/media-controls.tsx src/app src/features/groups/group-service.ts src/features/workspace
git commit -m "feat: add profile group and item image controls"
~~~

---

### Task 5: Add Stripe Checkout, Customer Portal, and webhook synchronization

**Files:**
- Modify: package.json, package-lock.json
- Create: src/features/billing/stripe.ts
- Create: src/features/billing/billing-service.ts
- Create: src/features/billing/webhook-service.ts
- Modify/Test: src/features/billing/billing.test.ts
- Create/Test: src/features/billing/webhook.test.ts
- Create: src/app/api/billing/checkout/route.ts
- Create: src/app/api/billing/portal/route.ts
- Create: src/app/api/stripe/webhook/route.ts

**Interfaces:**
- getStripe(): Stripe
- resolvePriceId(interval): string
- createCheckout(groupId, ownerId, interval): Promise<string>
- createPortal(groupId, ownerId): Promise<string>
- applyStripeEvent(event): Promise<void>

- [ ] **Step 1: Install Stripe**

~~~bash
npm install stripe
~~~

- [ ] **Step 2: Write failing price/role/Checkout tests**

Price interval is only month or year and maps only to STRIPE_PLUS_MONTHLY_PRICE_ID or STRIPE_PLUS_YEARLY_PRICE_ID. OWNER allowed; ADMIN/MEMBER rejected. Active subscription prevents another Checkout.

Checkout SDK call must contain mode subscription, one configured price, quantity 1, client_reference_id groupId, session metadata groupId, and subscription_data metadata service=leihnest plus groupId.

- [ ] **Step 3: Confirm RED**

~~~bash
npm test -- src/features/billing/billing.test.ts
~~~

- [ ] **Step 4: Implement lazy Stripe config**

getStripe requires STRIPE_SECRET_KEY only at runtime. resolvePriceId refuses any interval outside month/year or missing configured IDs. PUBLIC_URL defaults to https://leihnest.de.

- [ ] **Step 5: Implement group-owned Customer/Checkout/Portal**

One Stripe Customer per group; metadata service=leihnest and groupId. Checkout success URL is /app/settings?billing=confirming and cancel URL /app/settings?billing=cancelled. Portal return URL is /app/settings.

Billing-session limiter: 5 requests per OWNER per 60 seconds.

- [ ] **Step 6: Write signed webhook tests before implementation**

Use Stripe webhooks.generateTestHeaderString with a fixed test secret. Cover invalid signature, replayed event ID, created/updated/deleted subscriptions, cancel_at_period_end, unknown group metadata, and older event state not overwriting newer stripeUpdatedAt.

- [ ] **Step 7: Confirm webhook RED**

~~~bash
npm test -- src/features/billing/webhook.test.ts
~~~

- [ ] **Step 8: Implement raw-body webhook route and transactional event service**

Read request.text(), verify Stripe-Signature with STRIPE_WEBHOOK_SECRET before any DB write, insert ProcessedStripeEvent in the same transaction, synchronize only known LeihNest group/customer/subscription identities, and ignore stale subscription snapshots.

Minimum handled event names:
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_failed
invoice.paid

- [ ] **Step 9: Verify and commit**

~~~bash
npm test -- src/features/billing/billing.test.ts src/features/billing/webhook.test.ts src/features/release/media-billing.integration.test.ts
npm run lint
npm run typecheck
npm run build
git add package.json package-lock.json src/features/billing src/app/api/billing src/app/api/stripe
git commit -m "feat: add Stripe group subscriptions"
~~~

---

### Task 6: Add billing UI, safe CSV exports, and real Plus analytics

**Files:**
- Create: src/components/app/billing-controls.tsx
- Modify: src/app/(app)/app/settings/page.tsx
- Create: src/features/exports/csv.ts
- Create: src/app/api/exports/items/route.ts
- Create: src/app/api/exports/reservations/route.ts
- Create: src/features/analytics/plus-analytics.ts
- Modify: src/app/(app)/app/page.tsx
- Modify: src/components/design/dashboard-view.tsx
- Modify: src/features/workspace/workspace.ts
- Modify: src/app/(app)/app/workspace.css
- Modify tests in billing/workspace suites

**Interfaces:**
- csvCell(value): string
- getPlusAnalytics(groupId, now): Promise<PlusAnalytics>

- [ ] **Step 1: Write formula-injection tests**

~~~ts
it.each(["=1+1", "+SUM(A1:A2)", "-10+20", "@cmd"])("neutralizes %s", value => {
  expect(csvCell(value)).toBe('"\'' + value.replaceAll('"', '""') + '"');
});
~~~

Also test commas, quotes, CR/LF, empty and null values.

- [ ] **Step 2: Write analytics fixture tests**

Require exactly:
- reservation count last 30 days;
- six calendar month buckets;
- top five items over last 90 days excluding REJECTED/CANCELLED;
- status counts;
- average completed-loan hours only for RETURNED with handedOutAt and returnedAt.

- [ ] **Step 3: Confirm RED**

~~~bash
npm test -- src/features/billing/billing.test.ts src/features/workspace/workspace-experience.test.ts
~~~

- [ ] **Step 4: Implement safe CSV**

Prefix dangerous formula-leading text with apostrophe, double embedded quotes, and wrap every cell in double quotes. Export endpoints authenticate, require manager plus hasPlus, scope queries to the current group, and return 403 otherwise.

- [ ] **Step 5: Implement analytics**

Return:

~~~ts
type PlusAnalytics = {
  last30DaysReservations: number;
  monthly: Array<{ month: string; count: number }>;
  topItems: Array<{ itemId: string; name: string; count: number }>;
  statusCounts: Record<ReservationStatus, number>;
  averageCompletedLoanHours: number | null;
};
~~~

No fake data. Empty groups render an insufficient-data state.

- [ ] **Step 6: Implement billing UI**

OWNER Free: plan, 4.99/month, 39.99/year, month/year selector, Auf Plus wechseln.
OWNER Plus: interval, renewal/current-period date, cancel-at-period-end message, Abo verwalten.
ADMIN/MEMBER: read-only group plan; owner manages billing.

Checkout/Portal fetch endpoints return URL and client redirects with window.location.assign(url).

- [ ] **Step 7: Verify and commit**

~~~bash
npm test -- src/features/billing/billing.test.ts src/features/workspace/workspace-experience.test.ts
npm run lint
npm run typecheck
npm run build
git add src/components/app/billing-controls.tsx src/features/exports src/features/analytics src/app/api/exports src/app src/components/design/dashboard-view.tsx src/features/workspace
git commit -m "feat: surface Plus billing exports and analytics"
~~~

---

### Task 7: Make Docker/Portainer persistence and privacy production-safe

**Files:**
- Modify: Dockerfile
- Modify: compose.portainer.yaml
- Modify: docker-compose.portainer.yml
- Modify: .github/workflows/ci.yml
- Modify: src/app/datenschutz/page.tsx
- Create: docs/operations/media-billing.md
- Create/Test: src/features/release/release-config.test.ts

- [ ] **Step 1: Write failing config/privacy tests**

Require identical compose files; leihnest-uploads:/data/uploads mount; UPLOADS_DIR; all four Stripe env names; privacy copy mentioning Stripe, Profilbilder, Gruppenbilder, Gegenstandsbilder, and no raw card storage.

- [ ] **Step 2: Confirm RED**

~~~bash
npm test -- src/features/release/release-config.test.ts
~~~

- [ ] **Step 3: Update Docker runner**

Before USER nextjs:

~~~dockerfile
RUN mkdir -p /data/uploads && chown -R nextjs:nodejs /data/uploads
~~~

- [ ] **Step 4: Update both compose files identically**

web.environment gains:
UPLOADS_DIR=/data/uploads
STRIPE_SECRET_KEY pass-through
STRIPE_WEBHOOK_SECRET pass-through
STRIPE_PLUS_MONTHLY_PRICE_ID pass-through
STRIPE_PLUS_YEARLY_PRICE_ID pass-through

web.volumes gains leihnest-uploads:/data/uploads.
Top-level volumes gains leihnest-uploads.
Do not alter leihnest-db.

- [ ] **Step 5: Add inert CI values**

Use /tmp/leihnest-uploads, sk_test_ci_only, whsec_ci_only, price_ci_month, price_ci_year.

- [ ] **Step 6: Update privacy copy factually**

State self-hosted image storage/retention; Stripe as Plus payment processor; local storage of billing identifiers/status; no raw card storage; applicable contractual/legal retention. Update page date to 19 September 2026. Do not redesign Impressum or privacy layout.

- [ ] **Step 7: Add operations runbook**

Include required Portainer variables, upload-volume backup/restore, webhook URL https://leihnest.de/api/stripe/webhook, subscribed event list, migration expectations, and production smoke-test checklist.

- [ ] **Step 8: Verify and commit**

~~~bash
npm test -- src/features/release/release-config.test.ts
cmp compose.portainer.yaml docker-compose.portainer.yml
docker compose -f compose.portainer.yaml config
npm run lint
npm run typecheck
npm run build
docker build -t leihnest:media-billing-ci .
git add Dockerfile compose.portainer.yaml docker-compose.portainer.yml .github/workflows/ci.yml src/app/datenschutz/page.tsx docs/operations/media-billing.md src/features/release/release-config.test.ts
git commit -m "ops: persist media and document Stripe production runtime"
~~~

---

### Task 8: Whole-branch verification and review before live Stripe writes

**Files:** only files required to fix evidence-backed failures.

- [ ] **Step 1: Run full tests**

~~~bash
npm test
~~~

Expected: zero failures; CI must execute DB integration tests with LEIHNEST_TEST_DATABASE_URL.

- [ ] **Step 2: Run static/build/container checks**

~~~bash
npm run lint
npm run typecheck
npm run build
cmp compose.portainer.yaml docker-compose.portainer.yml
docker compose -f compose.portainer.yaml config
docker build -t leihnest:release-candidate .
~~~

- [ ] **Step 3: Check homepage isolation and secrets**

~~~bash
git diff main...HEAD -- src/components/home src/app/page.tsx src/app/en/page.tsx
git diff main...HEAD | grep -E 'sk_live_|whsec_[A-Za-z0-9]+' && exit 1 || true
~~~

Expected: no public-homepage implementation change and no live secrets.

- [ ] **Step 4: Fresh whole-branch review**

Reviewer focus: destructive migration risk; media authorization/path traversal; concurrent image limit; webhook replay/order; Checkout price allowlist/OWNER role; CSV injection; volume persistence; privacy accuracy. Fix Critical/Important findings and rerun Steps 1-3.

- [ ] **Step 5: Commit review fixes if present**

~~~bash
git add -A
git commit -m "fix: address media billing release review"
~~~

Skip commit if tree is clean.

---

### Task 9: Create/reuse live Stripe product and prices

**External resource:** connected live account Kamilunavo / acct_1U17udJy26xczTEt.

- [ ] **Step 1: Search active products again immediately before writes**

Reuse exact matching LeihNest Plus product if another operator created it. Do not duplicate blindly.

- [ ] **Step 2: Create product if absent**

Name: LeihNest Plus
Description: LeihNest Plus für eine gemeinsame Gruppe mit erweiterten Bildern, Exporten und Statistiken.
Metadata: service=leihnest, plan=PLUS, environment=live.

- [ ] **Step 3: Create/reuse monthly Price**

EUR 499, recurring interval month, metadata service=leihnest and interval=month.

- [ ] **Step 4: Create/reuse yearly Price**

EUR 3999, recurring interval year, metadata service=leihnest and interval=year.

- [ ] **Step 5: Read resources back**

Verify livemode true, eur, exact amounts, exact recurring intervals, same product. Do not create a Checkout Session or charge during this validation.

- [ ] **Step 6: Record only non-secret IDs in docs**

Put product/price IDs in docs/operations/media-billing.md. Never commit sk_live or webhook signing secrets.

- [ ] **Step 7: Commit mapping**

~~~bash
git add docs/operations/media-billing.md
git commit -m "docs: record LeihNest Plus Stripe price ids"
~~~

---

### Task 10: Final CI, PR, merge, Portainer configuration, webhook registration, smoke tests

- [ ] **Step 1: Open PR to main**

Title: Release LeihNest media uploads and Plus billing

Body must summarize persistent uploads, Free/Plus limits, Stripe Checkout/Portal/webhooks, exports/analytics, migration/volume/env changes, privacy disclosure, and exact verification results.

- [ ] **Step 2: Require green GitHub checks**

Inspect exact logs on failure and fix root cause only. Required: repository CI and GitGuardian.

- [ ] **Step 3: Merge green PR to main with expected head SHA**

Do not force-push main.

- [ ] **Step 4: Configure Portainer out of band**

Set UPLOADS_DIR=/data/uploads, both real price IDs, and STRIPE_SECRET_KEY. Do not paste the secret into GitHub or chat.

- [ ] **Step 5: Deploy main**

Verify existing leihnest-db volume is retained, leihnest-uploads is created, migrate exits 0, web is healthy, and existing accounts/groups/items/reservations remain.

- [ ] **Step 6: Register live Stripe webhook**

URL: https://leihnest.de/api/stripe/webhook

Events:
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_failed
invoice.paid

Store generated STRIPE_WEBHOOK_SECRET in Portainer and redeploy without recreating volumes.

- [ ] **Step 7: Smoke-test Free media**

Profile upload/replace/delete; group image OWNER/ADMIN; MEMBER denied; first item image accepted; second rejected; cross-group image request returns 404; uploaded image survives normal web redeploy.

- [ ] **Step 8: Smoke-test one deliberate live Plus flow**

Before confirming payment, verify Stripe-hosted Checkout shows LeihNest Plus and exact selected price. After completion verify return state does not grant Plus before webhook; webhook activates group Plus; fifth image works and sixth fails; Customer Portal is OWNER-only; period/cancellation status is correct.

- [ ] **Step 9: Smoke-test Plus value**

Inventory CSV, reservation CSV, formula neutralization, real analytics, and Free direct export denial.

- [ ] **Step 10: Record final release evidence**

Record merged SHA, migration success, upload volume, Stripe product/two price IDs, webhook status, CI result, and smoke-test results. Do not claim release complete without this evidence.
