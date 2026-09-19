# LeihNest Product Completion Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish LeihNest as a production-ready closed-group lending platform by completing account security, multi-group workflows, inventory/maintenance, reservation integrity, notifications, QR, audit, privacy, PWA/calendar integration, and operational hardening.

**Architecture:** The existing Next.js/Prisma/PostgreSQL application remains the product core. New work extends the current domain modules instead of replacing them. Background reminders/notifications use a PostgreSQL-backed queue and a separate worker process; user-facing authorization remains server-side in the web application.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Better Auth 1.6, @better-auth/passkey, Prisma 7, PostgreSQL 17, Nodemailer, pg-boss, Sharp, Stripe, Vitest, Playwright, Docker Compose, Portainer.

**Spec:** `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`

## Global Constraints

- Existing public homepage visual design remains intact.
- Existing inventory/reservation/media/billing behavior must not regress.
- Free remains genuinely usable.
- No public marketplace, user-to-user payments, advertising, or public group discovery.
- All new user-facing functionality is German/English.
- Server-side authorization is authoritative.
- Database migrations are additive and production-safe.
- Existing PostgreSQL and `leihnest-uploads` persistent data must survive redeploys.
- `main` is the integrated source branch.
- Existing production Portainer deployment consumes `portainer-preview` and `compose.portainer.yaml`; do not silently change that contract.
- Each task follows TDD and ends with a focused green test run plus commit.

## Review Focus

1. **Cross-group data leakage:** changing active group in the UI must never authorize access to a group the session user does not belong to.
2. **Reservation overbooking:** concurrent approvals must never exceed effective available quantity after maintenance/out-of-service deductions.
3. **Account takeover/lockout:** social linking must be explicit and unlink/delete operations must not strand users without a login route.
4. **Notification duplication/privacy:** job retries must not send duplicates or leak another member's private details.
5. **Destructive lifecycle actions:** group/account deletion must coordinate ownership, Stripe, media, audit, and retention without orphaning data.

---

## Plan Set

1. `2026-09-19-01-auth-account-completion.md`
2. `2026-09-19-02-multi-group-member-lifecycle.md`
3. `2026-09-19-03-inventory-maintenance.md`
4. `2026-09-19-04-reservations-calendar.md`
5. `2026-09-19-05-notifications-reminders.md`
6. `2026-09-19-06-qr-labels-scan.md`
7. `2026-09-19-07-audit-activity.md`
8. `2026-09-19-08-privacy-export-deletion.md`
9. `2026-09-19-09-pwa-calendar-integration.md`
10. `2026-09-19-10-security-operations-release.md`
11. `2026-09-19-11-seo-search-console.md`

## Execution Order and Dependencies

### 01 — Auth & Account Completion
Independent foundation for all later account/security flows.

### 02 — Multi-Group & Member Lifecycle
Creates explicit group context and complete membership lifecycle used by all later domain pages.

### 03 — Inventory & Maintenance
Adds categories/tags/status/unavailable quantity and maintenance records required by final availability logic.

### 04 — Reservations & Calendar
Consumes effective item quantity and active group context.

### 05 — Notifications & Reminders
Consumes stable reservation/member/maintenance events.

### 06 — QR Labels & Scan
Consumes item detail, active group context, reservation actions, and maintenance actions.

### 07 — Audit & Activity
Integrates event recording across the now-stable domain mutations.

### 08 — Privacy, Export & Deletion
Consumes ownership transfer, audit, billing, and account lifecycle.

### 09 — PWA & Calendar Integration
Adds installability/offline shell and safe ICS flows on top of stable routing.

### 10 — Security, Operations & Release
Cross-system hardening, backup/restore, browser E2E, production release gate.

### 11 — SEO & Google Search Console
Runs after public routes and release plumbing are stable. Completes index policy, metadata, structured data, Lighthouse checks, Search Console Domain Property onboarding, sitemap submission and production SEO smoke verification.

## Shared Interfaces

- Existing `src/lib/auth.ts` remains the Better Auth server entry.
- Existing `src/lib/auth-client.ts` remains the browser auth client.
- Existing `src/lib/db.ts` remains the Prisma access point.
- New mail abstraction: `src/features/mail/mailer.ts`.
- New active-group service: `src/features/groups/active-group.ts`.
- New effective inventory function: `effectiveQuantity(item): number`.
- New notification service: `src/features/notifications/notification-service.ts`.
- New queue adapter: `src/features/jobs/queue.ts`.
- New audit service: `src/features/audit/audit-service.ts`.
- All server actions/routes receive or derive explicit group IDs and re-check membership server-side.

## Definition of Done

The master roadmap is complete only when:

- every child plan is complete;
- all unit/integration/E2E tests pass;
- email verification/reset/invites work live;
- Google/Apple/Passkeys work live;
- multi-group switching works without data leakage;
- maintenance affects available quantity correctly;
- concurrent approvals are safe;
- reminders are deduplicated;
- QR scan flows work on a real mobile browser;
- personal data export and safe deletion work;
- PWA installs;
- database + uploads restore has been proven;
- Portainer production deployment passes live smoke tests;
- no marketplace/payment-between-members behavior has been introduced;
- Search Console is verified for `leihnest.de`, the sitemap is submitted, and representative DE/EN public URLs pass SEO production verification.
