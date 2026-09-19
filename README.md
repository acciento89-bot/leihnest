# LeihNest

**Gemeinsam nutzen. Einfach organisiert.**

LeihNest is a German/English self-hosted web application for closed groups to manage shared equipment, reservations, handovers, returns and member invitations. Product domain: `leihnest.de`.

## Current product status and completion roadmap

LeihNest already has the core closed-group lending workflow, but the product is **not yet considered fully finished**. The remaining work is documented as a complete step-by-step roadmap so future development sessions can continue without reconstructing decisions from chat history.

### Already implemented

- German/English public website and authenticated workspace
- email/password registration and login
- PostgreSQL + Better Auth + Prisma
- group creation and OWNER / ADMIN / MEMBER roles
- inventory with search
- reservations with approval, handover and return
- hashed, email-bound invitation links
- protected profile/group/item image uploads
- LeihNest Plus with Stripe Checkout and Customer Portal
- Free/Plus image limits
- Plus CSV exports and analytics
- Docker/Portainer deployment
- CI, lint, typecheck, tests and production build

### Still to be completed

1. **Auth & account completion**
   - email verification and resend
   - forgot/reset password
   - real invitation emails
   - Google login
   - Sign in with Apple
   - Passkeys
   - explicit account linking/unlinking
   - password/email changes
   - active session management
   - verified account deletion
   - optional TOTP 2FA + recovery codes

2. **True multi-group support and member lifecycle**
   - switch between multiple groups
   - create additional groups
   - resend/revoke invitations
   - change roles
   - remove members
   - transfer ownership
   - leave/archive/delete groups safely

3. **Inventory and maintenance**
   - categories and tags
   - inventory/barcode fields
   - AVAILABLE / PARTIALLY_UNAVAILABLE / OUT_OF_SERVICE / RETIRED states
   - unavailable partial quantities
   - maintenance, inspection, repair and damage history
   - protected damage photos
   - item detail pages and advanced filters

4. **Reservation integrity and calendar**
   - maintenance-aware availability preview
   - concurrency-safe approvals
   - edit pending reservations
   - manager cancellation
   - group/my/item calendar
   - item reservation history

5. **Notifications and reminders**
   - in-app notification center
   - email preferences
   - reservation/member/maintenance events
   - due-soon and overdue reminders
   - PostgreSQL-backed queue and worker

6. **QR labels and scanning**
   - stable item QR IDs
   - printable individual/bulk labels
   - mobile camera scanner with manual fallback
   - role-aware scan actions

7. **Audit and activity history**
   - inventory/reservation/member/billing/security events
   - OWNER/ADMIN activity view
   - personal security history
   - append-only safe audit records

8. **Privacy, export and deletion**
   - personal data export
   - complete owner group export
   - privacy-safe historical records after deletion
   - ownership-aware account deletion
   - updated privacy disclosures

9. **PWA and calendar integration**
   - installable PWA
   - privacy-safe offline shell
   - reservation `.ics` downloads
   - private revocable personal calendar feed

10. **Security, operations and release hardening**
    - security headers/CSP
    - centralized rate limits and mutation-origin checks
    - request IDs and redacted structured logs
    - database-aware health and worker heartbeat
    - coordinated PostgreSQL + upload backups
    - real isolated restore test
    - complete Playwright critical-path suite
    - one-command release gate
    - external production smoke test

### Canonical roadmap documents

- Product completion design: `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`
- Auth/account design: `docs/superpowers/specs/2026-09-19-auth-account-completion-design.md`
- Master implementation plan: `docs/superpowers/plans/2026-09-19-leihnest-product-completion-master.md`
- Progress ledger: `docs/superpowers/LEIHNEST-COMPLETION-LEDGER.md`
- Detailed plans: `docs/superpowers/plans/2026-09-19-01-*.md` through `2026-09-19-10-*.md`
- Total roadmap size: **75 reviewable implementation tasks**

### Required execution order

```text
01 Auth & Account
02 Multi-Group & Members
03 Inventory & Maintenance
04 Reservations & Calendar
05 Notifications & Reminders
06 QR Labels & Scan
07 Audit & Activity
08 Privacy & Export & Deletion
09 PWA & Calendar Integration
10 Security & Operations & Release
```

Each plan is written for TDD and small reviewable commits. For agentic execution, use `superpowers:subagent-driven-development` where the runtime supports real subagent dispatch; otherwise use `superpowers:executing-plans`.

## Stack

Next.js 16, React 19, TypeScript, Better Auth, Prisma 7, PostgreSQL 17, Tailwind CSS, Docker and Portainer.

## Production deployment

The existing production Portainer stack uses this GitHub repository on branch **`portainer-preview`**.

**Do not change the Portainer Git reference to `main`.** `main` is the integrated source branch. `portainer-preview` is the deployment branch consumed by the existing stack.

The existing Portainer interface is preserved:

- Git branch: `portainer-preview`
- Compose path: `compose.portainer.yaml`
- web container: `leihnest-web`
- container port: `8000`
- host compatibility binding: `127.0.0.1:8086`
- frontend network: `kamilunavo-infrastructure_frontend`

The repository-built `migrate` and `web` services use `pull_policy: build`. When Portainer detects a new Git commit and runs the Compose update, Docker Compose rebuilds both repository-built images even when an older local image already exists. This keeps GitOps releases tied to the checked-out source instead of silently reusing the previous application image.

The stack reuses the existing `SECRET_KEY` and `PUBLIC_URL` variables as Better Auth fallbacks. `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` remain supported as explicit overrides. If `POSTGRES_PASSWORD` is absent, the existing URL-safe `SECRET_KEY` is reused for the private PostgreSQL container.

PostgreSQL uses a `leihnest-db` volume. The legacy `leihnest-data` SQLite volume is not removed by this deployment, so previous pilot data remains available for rollback/migration.

## Local development

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL and set `DATABASE_URL`.
3. Run `npm ci`.
4. Run `npx prisma migrate dev`.
5. Run `npm run dev`.

## Release gates

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
cmp compose.portainer.yaml docker-compose.portainer.yml
docker compose -f compose.portainer.yaml config
docker build -t leihnest:release .
```

## Live rollout

1. The verified release is integrated on `main`.
2. The previous `portainer-preview` head is retained on a dedicated legacy branch before updating the deployment ref.
3. `portainer-preview` is moved to the verified release commit.
4. Portainer detects the Git change and Compose rebuilds the local `migrate` and `web` images because of `pull_policy: build`.
5. `https://leihnest.de/api/health` must return HTTP 200 after rollout.
6. Registration, login, group creation, inventory, invitation acceptance and reservation → approval → handover → return are smoke-tested over HTTPS.

No analytics, advertising, public marketplace or member-to-member payment processing is included in this MVP.
