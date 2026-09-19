# LeihNest Release-Readiness Design

Date: 2026-09-19
Status: Proposed for implementation
Branch: feat/release-ready-media-billing-20260919
Base: main @ f243de859752d64f4b146fee242dd8527c8ad769

## 1. Goal

Finish LeihNest for production use without redesigning the approved public homepage or breaking the existing member workflow.

This release adds:

- persistent image uploads for items, user profiles, and groups;
- group-level LeihNest Plus subscriptions through Stripe;
- a durable entitlement layer that keeps the free product usable;
- Stripe Checkout, Customer Portal, and signed webhook synchronization;
- production-safe storage, validation, permissions, cleanup, and deployment configuration;
- billing and upload UI integrated into the existing workspace;
- privacy/legal text updates required by the new data and payment flows;
- automated tests and operational documentation.

PayPal is explicitly out of scope.

## 2. Existing Constraints

LeihNest is an existing Next.js 16 / React 19 application with Better Auth, Prisma 7, PostgreSQL, Docker/Portainer deployment, and an authenticated group workspace.

Current production deployment follows the `main` branch.

The public homepage design is approved and must not be reinterpreted as part of this project. Only functionality needed for uploads/billing may be linked from the authenticated workspace.

Existing core functionality must remain available on the Free tier:

- group creation and membership;
- item management;
- reservation lifecycle;
- return handling;
- basic search and history;
- one profile image;
- one group image;
- one image per item.

## 3. Product Plans

### Free

Price: EUR 0.

Includes all existing core LeihNest functionality plus:

- one profile image per user;
- one group image per group;
- one item image per item.

Free is intentionally usable and is not a trial.

### LeihNest Plus

Billing owner: group OWNER.
Entitlement beneficiary: the complete group.

Prices:

- EUR 4.99 monthly;
- EUR 39.99 yearly.

No free trial.

Plus includes:

- up to five images per item;
- image ordering and title-image selection;
- CSV export for inventory and reservation data;
- enhanced group statistics/analytics in the authenticated dashboard;
- future Plus capabilities may be added later without changing the billing ownership model.

A group never needs multiple subscriptions for multiple members.

## 4. Media Storage Architecture

### 4.1 Storage location

Images are stored on the existing server in a dedicated Docker named volume:

`leihnest-uploads:/data/uploads`

The web container receives:

`UPLOADS_DIR=/data/uploads`

The volume survives container rebuilds and redeployments.

Images are not stored as database blobs and are not written into the repository or `public/`.

### 4.2 File organization

Physical storage keys are generated server-side from random identifiers. User-supplied filenames are never used as filesystem paths.

Logical groupings are:

- profile images;
- group images;
- item images.

The exact physical path is implementation detail and must not expose raw original filenames.

### 4.3 Accepted input and normalization

Accepted source formats:

- JPEG;
- PNG;
- WebP.

Maximum upload size: 8 MiB per source image.

The server must validate the actual decoded image rather than trusting filename extensions or browser MIME headers.

Images are decoded and normalized through `sharp`:

- EXIF and nonessential metadata removed;
- output format WebP;
- bounded input pixel count;
- orientation normalized;
- generated variants:
  - thumbnail: max 256 px;
  - card: max 640 px;
  - large: max 1600 px.

Uploads with invalid image data, unsupported formats, excessive dimensions/pixel count, or size above the limit are rejected before permanent commit.

Writes use a temporary file followed by an atomic rename where supported. Failed database operations must not leave permanent orphan files.

### 4.4 Database model

Add a `MediaAsset` model containing at minimum:

- `id`;
- `kind` enum: PROFILE, GROUP, ITEM;
- `storageKey`;
- `mimeType`;
- source byte size;
- source width/height;
- `position`;
- timestamps;
- optional relation to `userId`;
- optional relation to `groupId`;
- optional relation to `itemId`.

Integrity rules:

- PROFILE assets belong to exactly one user;
- GROUP assets belong to exactly one group;
- ITEM assets belong to exactly one item and its group;
- profile/group image replacement removes the prior asset after successful database replacement;
- deleting an item removes its item images through controlled cleanup.

The existing Better Auth `User.image` field remains compatible. The application may expose the selected profile media through an authenticated media URL, but media ownership remains represented in `MediaAsset`.

### 4.5 Serving media

Uploaded files are never exposed through a public static directory.

Use an authenticated route such as:

`GET /api/media/:assetId/:variant`

Access checks:

- ITEM/GROUP: requester must be a member of the asset's group;
- PROFILE: requester must either be the profile owner or share at least one group with the profile owner.

Responses use:

- fixed `image/webp` content type;
- private cache headers;
- no user-controlled content-disposition filename;
- 404 for inaccessible and nonexistent assets to avoid existence disclosure.

## 5. Upload Permissions and UI

### Profile image

- user can upload, replace, and delete only their own profile image;
- shown in header/settings/member list where applicable;
- initials remain the fallback.

### Group image

- OWNER and ADMIN can upload, replace, and delete;
- shown in group/settings UI;
- existing icon fallback remains.

### Item images

- existing inventory-management permission controls upload, reordering, title selection, and deletion;
- Free: maximum one image per item;
- Plus: maximum five images per item;
- first ordered image is the title image unless explicitly reordered;
- item cards use title image;
- item edit UI displays the image collection and controls.

The server enforces limits and permissions. The UI is not the security boundary.

## 6. Stripe Billing Architecture

### 6.1 Stripe resources

Use the connected live Stripe account:

`Kamilunavo` / `acct_1U17udJy26xczTEt`.

Create one active service product:

`LeihNest Plus`

with metadata identifying service `leihnest` and plan `PLUS`.

Create two recurring EUR prices:

- 499 cents / month;
- 3999 cents / year.

Price IDs are stored in runtime environment variables, never hard-coded as the entitlement source.

No PayPal payment method integration is added.

### 6.2 Runtime integration

Use the official Stripe Node SDK server-side only.

Required runtime secrets/configuration:

- `STRIPE_SECRET_KEY`;
- `STRIPE_WEBHOOK_SECRET`;
- `STRIPE_PLUS_MONTHLY_PRICE_ID`;
- `STRIPE_PLUS_YEARLY_PRICE_ID`;
- existing `PUBLIC_URL`.

Secrets never enter Git, browser bundles, logs, screenshots, or user-facing error messages.

If the production server already has a suitable Stripe secret, reuse it through Portainer secrets/environment. Otherwise it must be added out of band in Portainer; it must not be pasted into chat or committed.

### 6.3 Group subscription model

Add a one-to-one `GroupSubscription` record linked to `Group`.

Store at minimum:

- `groupId`;
- `stripeCustomerId`;
- `stripeSubscriptionId`;
- `stripePriceId`;
- `interval` enum MONTH/YEAR;
- Stripe subscription `status`;
- `currentPeriodEnd`;
- `cancelAtPeriodEnd`;
- timestamps.

Also add a `ProcessedStripeEvent` table keyed by Stripe event ID to make webhook processing idempotent.

Stripe is the payment source of truth. Local state is a synchronized projection used for entitlements and UI.

### 6.4 Checkout

Only the group OWNER can create a Checkout Session.

Checkout runs in subscription mode and uses the selected existing Stripe price ID.

The Checkout Session and created subscription carry stable metadata containing the LeihNest `groupId`.

Customer strategy:

- one Stripe Customer per LeihNest group;
- customer metadata contains `groupId`;
- owner email may be used as the billing contact but ownership of the Stripe Customer remains the group, so owner changes do not create a second subscription.

Do not permit duplicate active subscriptions for the same group.

Success URL returns to the authenticated billing settings with a "payment being confirmed" state. Plus is not enabled solely because the browser returned from Checkout.

### 6.5 Customer Portal

Only the group OWNER can create a Stripe Customer Portal session.

Portal provides:

- payment method maintenance;
- invoice/receipt history;
- cancellation;
- normal Stripe-hosted subscription self-service allowed by the configured portal.

Cancellation defaults to period end where Stripe portal configuration allows it.

### 6.6 Webhooks

Add a public POST endpoint dedicated to Stripe webhooks.

Requirements:

- read raw request body;
- verify Stripe signature using `STRIPE_WEBHOOK_SECRET`;
- reject unverifiable payloads;
- process events idempotently using `ProcessedStripeEvent`;
- update subscription projection transactionally.

Minimum event coverage:

- `checkout.session.completed`;
- `customer.subscription.created`;
- `customer.subscription.updated`;
- `customer.subscription.deleted`;
- `invoice.payment_failed`;
- `invoice.paid` when useful for status refresh.

Webhook processing must resolve the target group only through trusted Stripe IDs/metadata created by LeihNest, never from untrusted request query parameters.

### 6.7 Entitlement calculation

Create a single domain function/service responsible for Plus status.

Plus is granted when synchronized Stripe status represents an active subscription and the current paid period has not ended.

Recommended handling:

- `active`: Plus;
- `trialing`: Plus defensively, although this product launches without trials;
- `past_due`: keep Plus during Stripe recovery while the paid/current period remains valid;
- `canceled`, `unpaid`, `incomplete_expired`: Free;
- cancel-at-period-end remains Plus until `currentPeriodEnd`.

Features query this service rather than checking Stripe fields directly.

## 7. Billing UI

Add a dedicated LeihNest Plus card/section in authenticated Settings.

For OWNER:

Free state shows:

- Free plan;
- Plus benefits;
- EUR 4.99/month;
- EUR 39.99/year;
- monthly/yearly choice;
- "Auf Plus wechseln" / English equivalent.

Active Plus state shows:

- Plus badge;
- billing interval;
- renewal/current-period date;
- cancellation-at-period-end message when applicable;
- "Abo verwalten" button opening Customer Portal.

For ADMIN/MEMBER:

- display current group plan;
- no purchase/billing-management button;
- explain that billing is managed by the group owner.

The UI preserves current LeihNest workspace visual language and does not restyle the approved public homepage.

## 8. Plus Features for This Release

The billing release must include real entitlement-backed value, not a decorative subscription badge.

### Image allowance

- Free: 1 image/item;
- Plus: up to 5 images/item.

### CSV exports

Plus group managers receive authenticated export endpoints for:

- inventory;
- reservations.

CSV output must escape spreadsheet formula prefixes to prevent CSV injection.

### Enhanced analytics

Plus dashboard adds only metrics that can be derived from existing reservation data:

- reservation count for the last 30 days;
- monthly reservation counts for the last six calendar months;
- top five most borrowed items over the last 90 days, excluding REJECTED and CANCELLED reservations;
- current split of PENDING, APPROVED, HANDED_OUT, RETURNED, REJECTED, and CANCELLED reservations;
- average completed-loan duration based only on RETURNED reservations with valid timestamps.

Groups without enough data receive a clear empty/insufficient-data state. No fabricated metrics or claims are displayed.

## 9. Security and Abuse Controls

All mutating endpoints/actions require authenticated sessions and server-side authorization.

Additional requirements:

- CSRF protection continues to rely on framework/Better Auth protections for authenticated actions;
- upload endpoints verify ownership/role server-side;
- upload byte size and decoded pixel count limited;
- image content re-encoded, so original active metadata is not served;
- path traversal impossible because storage keys are generated;
- media API does not accept arbitrary filesystem paths;
- billing actions require OWNER role on the current group;
- Stripe price selection is an allowlist of the configured two Price IDs, not an arbitrary client-provided Price ID;
- webhook signature verification occurs before database writes;
- Stripe event IDs are unique in the processed-event table;
- rate-limit authenticated upload mutations to 10 requests per user per minute and Stripe Checkout/Portal session creation to 5 requests per OWNER per minute; the current single web-container deployment may use an in-process fixed-window limiter, and the limiter must be isolated behind a small service so it can be replaced with a shared store before horizontal scaling;
- customer-facing errors remain generic; detailed errors stay server-side without secrets.

## 10. Data Lifecycle

### Replacing/deleting media

Database ownership changes are committed before old files are removed where appropriate.

If file deletion fails after a successful database update, log the orphan key for later cleanup rather than rolling the user-facing operation back.

### Group/user deletion

Deletion workflows must remove or schedule removal of related media.

Stripe subscriptions are not silently canceled merely because a local destructive operation partially fails. Any future group-deletion feature must explicitly coordinate subscription cancellation before irreversible deletion.

## 11. Deployment and Operations

Update both canonical Portainer compose files identically.

Add:

- `leihnest-uploads` named volume;
- mount at `/data/uploads`;
- `UPLOADS_DIR`;
- Stripe environment variable pass-throughs.

The migration container keeps only database dependencies; no upload volume is required there.

Operational documentation must include:

- upload-volume backup command/process;
- restore expectations;
- Stripe webhook endpoint path;
- required Portainer environment variables;
- Stripe product/price IDs;
- production smoke-test checklist.

Do not delete or recreate the PostgreSQL volume.

## 12. Privacy and Legal Surface

Update LeihNest privacy text to accurately disclose:

- user-uploaded profile/group/item images stored on the LeihNest server;
- purpose and retention of those images;
- Stripe as payment processor for Plus subscriptions;
- billing information is processed by Stripe and raw payment-card data is not stored by LeihNest;
- webhook/billing identifiers stored locally for subscription management.

The Impressum is not redesigned or rewritten unless a factual legal detail actually needs correction.

## 13. Testing Strategy

Implementation follows test-first development.

Required automated coverage:

### Media

- invalid format rejected;
- oversized input rejected;
- malformed image rejected;
- metadata stripped/re-encoded;
- correct variants generated;
- profile/group/item authorization;
- Free one-image limit, including concurrent upload attempts;
- Plus five-image limit, including concurrent upload attempts;
- replacement/removal cleanup;
- inaccessible media returns 404.

### Billing

- only OWNER can start Checkout or Portal;
- only monthly/yearly configured prices can be selected;
- group metadata included in Checkout;
- duplicate active subscription prevented, including repeated Checkout clicks;
- webhook invalid signature rejected;
- webhook events idempotent;
- subscription state maps correctly to entitlements;
- cancel-at-period-end behavior;
- past-due grace within paid period;
- non-Plus users cannot call Plus export endpoints.

### UI

- image controls appear for permitted users;
- fallback avatars/icons remain;
- Free/Plus billing states render correctly in DE/EN;
- member/admin billing controls are read-only;
- homepage regression tests remain unchanged and green.

### Full verification

Before merge:

- `npm test`;
- `npm run lint`;
- `npm run typecheck`;
- `npm run build`;
- Docker Compose config parity check;
- Docker build;
- isolated PostgreSQL integration tests;
- Stripe webhook tests with fixed test fixtures/signatures;
- upload tests using temporary filesystem storage, never production volume.

## 14. Release Sequence

1. Implement schema + migrations + entitlement domain.
2. Implement media storage/service/API and UI.
3. Implement Stripe server integration, Checkout, Portal, webhook endpoint.
4. Implement billing UI and Plus-gated exports/analytics.
5. Update Docker/Portainer configuration and legal/ops documentation.
6. Run complete CI and code review.
7. Create Stripe live product and two live prices if not already present.
8. Deploy code to production from `main`.
9. Configure required Stripe runtime secret(s) in Portainer out of band.
10. Register live Stripe webhook endpoint and store signing secret in Portainer.
11. Smoke test:
    - Free group;
    - image upload permissions/limits;
    - Checkout creation;
    - successful subscription synchronization;
    - Portal;
    - cancellation-at-period-end projection;
    - authenticated image serving.
12. Only after verified smoke tests consider the release complete.

## 15. Non-Goals

Not part of this release:

- PayPal;
- mobile in-app purchases;
- marketplace payments between LeihNest users;
- per-seat pricing;
- usage-based billing;
- public image CDN/object storage;
- rewriting the approved public homepage design;
- unrelated authentication/social-login changes.

## 16. Acceptance Criteria

The release is acceptable when:

- all existing Free workflows still function;
- uploaded images survive redeployment;
- no uploaded media is publicly enumerable;
- Free and Plus image limits are enforced server-side;
- profile/group/item images can be uploaded, replaced and deleted by authorized users;
- Stripe Plus can be purchased monthly/yearly by the group OWNER;
- webhook state, not browser return, activates Plus;
- all members of a paid group receive Plus entitlements;
- Customer Portal works for the OWNER;
- CSV/analytics Plus features are actually entitlement gated;
- privacy text reflects uploads and Stripe processing;
- no secrets are committed;
- migrations deploy safely;
- CI, production build, and Docker build pass;
- production smoke tests pass after deployment.
