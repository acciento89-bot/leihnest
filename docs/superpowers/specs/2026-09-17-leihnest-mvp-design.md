# LeihNest MVP Design

## Product

LeihNest is a bilingual, responsive SaaS for closed groups such as clubs, leisure groups and house communities to manage shared equipment, reservations, handovers and returns.

Primary domain: `leihnest.de`.

Tagline: **Gemeinsam nutzen. Einfach organisiert.**

## Goals

The first releasable slice must support one complete end-to-end workflow:

1. A user registers and signs in.
2. The user creates a group.
3. The group owner adds equipment with total quantity, location and optional notes.
4. Members can be invited by email and assigned `OWNER`, `ADMIN` or `MEMBER` roles.
5. A member requests a reservation for a date/time range and quantity.
6. The system rejects reservations that would exceed available quantity for overlapping approved or active reservations.
7. An owner/admin approves or rejects a pending reservation.
8. An owner/admin records handover.
9. An owner/admin records return and optional condition note.
10. Dashboard views show what is upcoming, currently borrowed and overdue.

## Non-goals for the MVP

- No public marketplace.
- No payments, deposits or money transfer between members.
- No native iOS/Android app yet.
- No external hosted backend dependency such as Supabase.
- No multi-tenant public discovery.
- No complex asset depreciation, accounting or barcode inventory.

## Architecture

Use a single Next.js full-stack application with the App Router. PostgreSQL stores authentication and product data. Better Auth handles email/password authentication and sessions. Prisma ORM 7 provides typed PostgreSQL access and migrations. The application is packaged for self-hosted Docker deployment with a separate PostgreSQL service.

The web app is server-first: authenticated pages and mutations run on the server, while client components are limited to forms and interactive controls. This reduces exposed API surface and keeps authorization decisions server-side.

## Technology baseline

- Next.js 16.3.x Active LTS.
- React 19.
- TypeScript in strict mode.
- Tailwind CSS 4.3.x.
- PostgreSQL 17+.
- Prisma ORM 7.x, pinned to the stable major rather than Prisma 8 release candidates.
- Better Auth 1.6.x with email/password authentication and Prisma adapter.
- Vitest for unit/domain tests.
- Playwright for a later browser-level smoke suite once deployment secrets are available.
- Docker Compose for self-hosting.

## Domain model

### User
Managed by Better Auth. Product relations reference the Better Auth user id.

### Group
- `id`
- `name`
- `slug`
- `createdAt`
- `updatedAt`

### Membership
- `groupId`
- `userId`
- `role`: `OWNER | ADMIN | MEMBER`
- unique on `(groupId, userId)`

### Invitation
- `groupId`
- `email`
- `role`
- `tokenHash`
- `expiresAt`
- `acceptedAt`
- `createdByUserId`

### Item
- `groupId`
- `name`
- `description`
- `location`
- `totalQuantity` > 0
- `active`
- `createdByUserId`

Image upload is intentionally deferred from the first database slice; the UI reserves an image slot so object storage can be added without redesigning the cards.

### Reservation
- `groupId`
- `itemId`
- `userId`
- `quantity` > 0
- `startsAt`
- `endsAt`
- `status`: `PENDING | APPROVED | REJECTED | HANDED_OUT | RETURNED | CANCELLED`
- `purpose`
- approval metadata
- handover timestamp
- return timestamp
- return note

## Availability rule

For a proposed reservation `(itemId, startsAt, endsAt, quantity)`, calculate committed quantity from overlapping reservations in `APPROVED` or `HANDED_OUT` states. Two ranges overlap when:

`existing.startsAt < proposed.endsAt && existing.endsAt > proposed.startsAt`

The reservation is allowed only if:

`committedQuantity + proposed.quantity <= item.totalQuantity`

`PENDING` reservations do not consume inventory until approval. Approval must re-check availability in a transaction so two concurrent approvals cannot overbook inventory.

## Authorization

- Any authenticated group member may read group inventory and reservations.
- `MEMBER` may create and cancel their own pending/approved reservation before handover.
- `ADMIN` and `OWNER` may create/edit inventory, approve/reject reservations, record handover and return, and invite members.
- Only `OWNER` may promote another member to `OWNER` or delete the group in future versions.
- Every mutation must verify membership and role server-side.

## Public website

The public landing page uses the approved LeihNest visual direction: bright neutral background, sage/emerald accents, rounded cards, generous whitespace and real operational examples rather than generic marketing decoration.

Sections:
- Hero with product promise.
- Three-step explanation: erfassen, reservieren, zurückgeben.
- Example equipment grid.
- Audience section for clubs, communities and groups.
- Pricing placeholder with one simple group plan; checkout is not enabled in MVP.
- Login and registration calls to action.

## Authenticated workspace

Desktop navigation:
- Übersicht
- Gegenstände
- Reservierungen
- Mitglieder
- Einstellungen

Mobile uses a compact top bar and bottom/navigation menu without horizontal overflow.

Dashboard cards:
- currently borrowed
- due soon
- overdue
- pending approvals

## Internationalization

German is the default locale. English is available via `/en`. Public and authenticated copy must be sourced from typed dictionaries rather than duplicated ad hoc strings. Dates and numbers use locale-aware formatting.

## Validation and error handling

- Use Zod schemas for mutation inputs.
- Date range requires `endsAt > startsAt`.
- Quantity must be a positive integer and not exceed the item's total quantity.
- Authorization errors return a generic forbidden state without leaking group existence.
- Reservation conflicts return a specific user-facing availability error.

## Deployment

A production image builds the Next.js standalone output. `docker-compose.yml` defines `web` and `db` services. Runtime configuration uses environment variables only; secrets are never committed.

Required environment variables:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

## Quality gates

Before merge:
- unit/domain tests pass
- TypeScript check passes
- ESLint passes
- production build passes
- GitHub Actions is green

## Deferred follow-up slices

1. Item photos/object storage.
2. Transactional email for invitations/reminders.
3. Paid subscription/checkout.
4. Audit trail and damage photos.
5. PWA/native companion apps.
6. QR labels and scan-to-check-out.
