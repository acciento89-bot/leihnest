# LeihNest MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-shaped LeihNest web application with authentication, groups, inventory and quantity-safe reservation lifecycle.

**Architecture:** A self-hosted Next.js App Router application uses PostgreSQL through Prisma and Better Auth for sessions. Domain rules live in focused server modules and are exercised with Vitest before UI/server actions consume them.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, Tailwind CSS 4.3, PostgreSQL, Prisma ORM 7, Better Auth 1.6, Zod, Vitest, Docker Compose, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-17-leihnest-mvp-design.md`

## Global Constraints

- German default locale and English `/en` locale.
- No Supabase or other hosted backend dependency.
- No public marketplace or member-to-member payments.
- Every product mutation verifies membership and role server-side.
- Reservation approval re-checks quantity availability transactionally.
- Responsive public site and authenticated workspace.
- Secrets are environment variables and never committed.

---

### Task 1: Application foundation and CI

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Create: `src/test/setup.ts`, `vitest.config.ts`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces a strict TypeScript Next.js application and `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` quality gates.

- [ ] Write a failing Vitest smoke test asserting the LeihNest brand constants exist.
- [ ] Run `npm test` and verify RED because the brand module is absent.
- [ ] Add the minimum application/configuration and `src/lib/brand.ts` exporting `APP_NAME = "LeihNest"` and `TAGLINE_DE = "Gemeinsam nutzen. Einfach organisiert."`.
- [ ] Run test, lint and typecheck; verify GREEN.
- [ ] Add CI using Node 22, `npm ci`, test, lint, typecheck and build.
- [ ] Commit foundation.

### Task 2: Database and authentication foundation

**Files:**
- Create: `prisma/schema.prisma`, `prisma.config.ts`
- Create: `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/auth-client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Create: `src/features/auth/auth-schema.ts`, `src/features/auth/auth-schema.test.ts`

**Interfaces:**
- Produces Better Auth `auth`, browser `authClient`, Prisma client `db`, and validated registration/login inputs.

- [ ] Write failing tests for valid and invalid email/password input.
- [ ] Verify RED.
- [ ] Implement Zod schemas and Better Auth Prisma adapter configuration.
- [ ] Add Better Auth model tables plus LeihNest domain models to Prisma schema.
- [ ] Run tests and Prisma validation; verify GREEN.
- [ ] Commit auth/database foundation.

### Task 3: Group membership authorization

**Files:**
- Create: `src/features/groups/permissions.ts`, `src/features/groups/permissions.test.ts`
- Create: `src/features/groups/group-schema.ts`, `src/features/groups/group-schema.test.ts`
- Create: `src/features/groups/group-service.ts`

**Interfaces:**
- Produces `canManageInventory(role)`, `canManageReservations(role)`, `canInvite(role)`, `createGroupForUser(input, userId)`.

- [ ] Write failing permission matrix tests for OWNER, ADMIN and MEMBER.
- [ ] Verify RED.
- [ ] Implement the minimal role policy.
- [ ] Write failing group-name/slug validation tests.
- [ ] Implement schemas and transactional group creation with OWNER membership.
- [ ] Run all tests; verify GREEN.
- [ ] Commit group domain.

### Task 4: Inventory domain

**Files:**
- Create: `src/features/items/item-schema.ts`, `src/features/items/item-schema.test.ts`
- Create: `src/features/items/item-service.ts`

**Interfaces:**
- Produces `itemInputSchema`, `createItem`, `updateItem`, `archiveItem`.

- [ ] Write failing tests requiring non-empty name and positive integer `totalQuantity`.
- [ ] Verify RED.
- [ ] Implement validation.
- [ ] Implement role-protected item service operations.
- [ ] Run tests; verify GREEN.
- [ ] Commit inventory domain.

### Task 5: Reservation availability engine

**Files:**
- Create: `src/features/reservations/availability.ts`, `src/features/reservations/availability.test.ts`
- Create: `src/features/reservations/reservation-schema.ts`, `src/features/reservations/reservation-schema.test.ts`

**Interfaces:**
- Produces `rangesOverlap(aStart, aEnd, bStart, bEnd)`, `remainingQuantity(total, reservations, proposedRange)`, and `reservationInputSchema`.

- [ ] Write failing boundary tests proving adjacent ranges do not overlap and intersecting ranges do.
- [ ] Verify RED.
- [ ] Implement overlap logic.
- [ ] Write failing quantity tests covering multiple concurrent committed reservations and ignoring PENDING/RETURNED/CANCELLED.
- [ ] Implement remaining-quantity calculation.
- [ ] Write failing validation tests for reversed dates, zero quantity and quantity above item total.
- [ ] Implement reservation schema.
- [ ] Run all tests; verify GREEN.
- [ ] Commit availability engine.

### Task 6: Reservation lifecycle service

**Files:**
- Create: `src/features/reservations/reservation-service.ts`
- Create: `src/features/reservations/status-machine.ts`, `src/features/reservations/status-machine.test.ts`

**Interfaces:**
- Produces `createReservation`, `approveReservation`, `rejectReservation`, `recordHandover`, `recordReturn`, `cancelReservation`, and `canTransition(from, to)`.

- [ ] Write failing status transition tests for the allowed lifecycle and forbidden skips.
- [ ] Verify RED.
- [ ] Implement status machine.
- [ ] Implement reservation creation with membership validation.
- [ ] Implement approval in a database transaction that re-reads overlapping committed reservations before changing status.
- [ ] Implement admin/owner reject, handover and return operations and member self-cancellation policy.
- [ ] Run tests; verify GREEN.
- [ ] Commit lifecycle domain.

### Task 7: Bilingual public site and authentication UI

**Files:**
- Create: `src/i18n/dictionaries.ts`, `src/i18n/dictionaries.test.ts`
- Create: `src/components/site/header.tsx`, `src/components/site/footer.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/en/page.tsx`
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
- Create: `src/components/auth/auth-form.tsx`

**Interfaces:**
- Produces typed `de`/`en` dictionaries and responsive public/auth pages.

- [ ] Write failing dictionary parity test ensuring both locales have identical keys.
- [ ] Verify RED.
- [ ] Implement typed dictionaries.
- [ ] Build approved bright sage/emerald LeihNest landing page and responsive header/footer.
- [ ] Build login/register forms using Better Auth client.
- [ ] Run tests, lint and typecheck; verify GREEN.
- [ ] Commit public/auth UI.

### Task 8: Authenticated workspace UI

**Files:**
- Create: `src/app/(app)/app/layout.tsx`
- Create: `src/app/(app)/app/page.tsx`
- Create: `src/app/(app)/app/items/page.tsx`
- Create: `src/app/(app)/app/reservations/page.tsx`
- Create: `src/app/(app)/app/members/page.tsx`
- Create: `src/app/(app)/app/settings/page.tsx`
- Create: `src/components/app/app-shell.tsx`, `src/components/app/stat-card.tsx`, `src/components/app/item-card.tsx`

**Interfaces:**
- Produces protected dashboard navigation and server-rendered operational views.

- [ ] Write failing helper tests for dashboard status aggregation: borrowed, due soon, overdue and pending.
- [ ] Implement aggregation helper.
- [ ] Implement protected app shell and dashboard.
- [ ] Implement inventory, reservation and member views with role-sensitive actions.
- [ ] Verify mobile layout has no intentional horizontal scrolling.
- [ ] Run tests, lint and typecheck; verify GREEN.
- [ ] Commit workspace UI.

### Task 9: Mutations and forms

**Files:**
- Create: `src/app/(app)/app/actions.ts`
- Create: `src/components/app/item-form.tsx`, `src/components/app/reservation-form.tsx`, `src/components/app/reservation-actions.tsx`

**Interfaces:**
- Server actions bridge authenticated forms to the domain services and return typed success/error states.

- [ ] Write failing tests for mapping Zod validation and reservation conflicts to safe form errors.
- [ ] Implement action result mapper.
- [ ] Implement create/edit item and reservation forms.
- [ ] Implement approval/rejection/handover/return buttons for admins/owners.
- [ ] Run tests, lint and typecheck; verify GREEN.
- [ ] Commit operational forms.

### Task 10: Self-hosted deployment and final verification

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- Modify: `README.md`

**Interfaces:**
- Produces a standalone production container and local PostgreSQL deployment contract.

- [ ] Add Docker build using Next.js standalone output and non-root runtime user.
- [ ] Add Compose services for `web` and PostgreSQL with persistent database volume and health check.
- [ ] Document environment, migration and deployment commands.
- [ ] Run full `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- [ ] Build Docker image when CI runner supports Docker.
- [ ] Verify no secrets are committed.
- [ ] Open PR from `feat/leihnest-mvp` to `main` only after CI is green.
