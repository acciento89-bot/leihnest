# LeihNest Security, Operations, Backup, and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden LeihNest for long-term production operation with security headers, centralized endpoint protections, dependency-aware health, structured logging, tested database/media restore, complete browser regression gates, and a reproducible Portainer release process.

**Architecture:** Keep the existing single-web-container production model plus the notification worker. Security headers are defined centrally. Application logs use structured JSON with request IDs and redaction. Backups cover PostgreSQL and the upload volume together and are validated by restoring into an isolated scratch environment. Release verification is one scripted gate plus a production smoke checklist.

**Tech Stack:** Next.js 16, PostgreSQL 17, Docker Compose, Portainer, Vitest, Playwright, POSIX shell, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-19-leihnest-product-completion-design.md`

## Global Constraints

- Do not delete/recreate production PostgreSQL or upload volumes during deploy.
- Do not change production Portainer Git contract from `portainer-preview` without a separate explicit decision.
- Existing `compose.portainer.yaml` and `docker-compose.portainer.yml` remain byte-identical.
- No secrets in repository, logs, smoke output, or backup manifest.
- Backups are not “verified” until an isolated restore passes integrity checks.
- Security headers must not break Stripe redirect, Google/Apple OAuth, Passkeys, media, or QR camera use.
- CI must fail on critical production dependency vulnerabilities.

## Review Focus

1. CSP/header tightening must not break auth callback/passkey/QR flows.
2. Backup must restore DB rows and matching media bytes from the same backup set.
3. Request logging must redact credentials/tokens/cookies/authorization headers.
4. Worker outage must be visible operationally without causing false web readiness failure while database is healthy.
5. Release script must never run destructive volume deletion commands.

---

### Task 1: Add central security headers

**Files:**
- Modify: `next.config.ts`
- Create: `src/features/security/headers.ts`
- Create: `src/features/security/headers.test.ts`

**Interfaces:**
- Produces `securityHeaders(): { key: string; value: string }[]`.

- [ ] **Step 1: Write failing required-header tests**

```ts
it("sets anti-clickjacking and content-type protections", () => {
  const headers = Object.fromEntries(securityHeaders().map(h => [h.key, h.value]));
  expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  expect(headers["Referrer-Policy"]).toBeDefined();
  expect(headers["Content-Security-Policy"]).toMatch(/frame-ancestors 'none'/);
  expect(headers["Permissions-Policy"]).toMatch(/camera=\(self\)/);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/security/headers.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement production-safe policy**

At minimum:
- CSP default-src self;
- script/style directives compatible with the built Next app;
- img-src self data: blob:;
- connect-src self plus only required provider endpoints if browser actually calls them;
- frame-ancestors none;
- base-uri self;
- form-action self plus documented auth requirements;
- object-src none;
- X-Content-Type-Options nosniff;
- Referrer-Policy strict-origin-when-cross-origin;
- Permissions-Policy camera=(self), microphone=(), geolocation=().

- [ ] **Step 4: Apply through Next headers config**

Apply globally, but do not add HSTS in local development. Production reverse proxy may already set it; document single source to avoid contradictory values.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/security/headers.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add next.config.ts src/features/security
git commit -m "security: add application security headers"
```

---

### Task 2: Consolidate rate limiting and origin checks

**Files:**
- Create: `src/features/security/rate-limit-service.ts`
- Create: `src/features/security/rate-limit-service.test.ts`
- Create: `src/features/security/request-origin.ts`
- Create: `src/features/security/request-origin.test.ts`
- Modify: `src/features/media/rate-limit.ts`
- Modify: `src/app/api/billing/checkout/route.ts`
- Modify: `src/app/api/billing/portal/route.ts`
- Modify: mutating custom API routes added by prior plans

**Interfaces:**
- Produces `rateLimit(key, policy): RateLimitDecision`.
- Produces `assertTrustedMutationOrigin(request, publicUrl)`.

- [ ] **Step 1: Write failing spoofed-origin test**

```ts
it("rejects a cross-origin mutation request", () => {
  const request = new Request("https://leihnest.de/api/billing/portal", {
    method: "POST",
    headers: { origin: "https://evil.example" },
  });
  expect(() => assertTrustedMutationOrigin(request, "https://leihnest.de"))
    .toThrow("INVALID_ORIGIN");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/security/rate-limit-service.test.ts src/features/security/request-origin.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement shared fixed-window limiter**

Single web-container production allows in-memory limiter. Policies:
- upload: 10/user/minute;
- billing session: 5/owner/minute;
- invitation create/resend: 10/actor/10 minutes;
- privacy export: 3/user/hour;
- QR-sensitive manager mutation: 30/user/minute.

Better Auth keeps its own built-in rate limiting for auth endpoints.

- [ ] **Step 4: Implement origin validation**

For custom cookie-authenticated mutation routes, require Origin matching trusted production/local base URL. Webhooks remain signature-authenticated exceptions.

- [ ] **Step 5: Run GREEN/regression**

Run: `npm test -- src/features/security src/features/media src/features/billing`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/security src/features/media/rate-limit.ts src/app/api
git commit -m "security: centralize mutation protections"
```

---

### Task 3: Add request IDs and structured redacted logging

**Files:**
- Create: `src/lib/request-id.ts`
- Create: `src/lib/request-id.test.ts`
- Create: `src/lib/logger.ts`
- Create: `src/lib/logger.test.ts`
- Create: `src/lib/api-context.ts`
- Modify: critical API routes and worker entrypoint

**Interfaces:**
- Produces `getRequestId(headers): string`.
- Produces `logger.info/error(event, fields)`.
- Produces `redactLogFields(fields)`.

- [ ] **Step 1: Write failing redaction test**

```ts
it("redacts auth and secret-shaped fields recursively", () => {
  expect(redactLogFields({
    authorization: "Bearer abc",
    cookie: "session=x",
    nested: { password: "secret", token: "opaque", safe: "ok" },
  })).toEqual({
    authorization: "[REDACTED]",
    cookie: "[REDACTED]",
    nested: { password: "[REDACTED]", token: "[REDACTED]", safe: "ok" },
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/lib/request-id.test.ts src/lib/logger.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement request ID**

Accept incoming `x-request-id` only when matching:

```
^[A-Za-z0-9._-]{1,128}$
```

otherwise generate `crypto.randomUUID()`.

- [ ] **Step 4: Implement JSON logger**

Each entry contains timestamp, level, event, requestId/jobId where available, and redacted fields.

- [ ] **Step 5: Integrate critical paths**

Billing webhook/session creation, mail failure, worker jobs, media upload, auth-adjacent custom handlers, backup/smoke diagnostics.

- [ ] **Step 6: Run GREEN**

Run: `npm test -- src/lib/logger.test.ts src/lib/request-id.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit**

```sh
git add src/lib src/app/api src/worker
git commit -m "ops: add structured redacted logging"
```

---

### Task 4: Add dependency-aware web health and worker heartbeat

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_worker_heartbeat/migration.sql`
- Create: `src/features/health/health-service.ts`
- Create: `src/features/health/health-service.test.ts`
- Modify: `src/app/api/health/route.ts`
- Modify: `src/worker/main.ts`

**Interfaces:**
- Produces `checkHealth(now): HealthSnapshot`.
- Produces worker heartbeat update.

- [ ] **Step 1: Write failing database-down test**

```ts
it("marks readiness unhealthy when PostgreSQL cannot answer SELECT 1", async () => {
  const snapshot = await checkHealth(failingDb, now);
  expect(snapshot.ready).toBe(false);
  expect(snapshot.database).toBe("down");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/health/health-service.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add heartbeat model**

Single row/key for notification worker with `lastSeenAt`, `version`.

Worker updates every 30 seconds.

- [ ] **Step 4: Implement health semantics**

DB down → HTTP 503.  
DB up + worker fresh → 200 healthy.  
DB up + worker stale → 200 degraded with `worker: "stale"` so reverse proxy keeps web online but operations can alert.

- [ ] **Step 5: Migrate/run GREEN**

Run:

```sh
npx prisma migrate dev --name worker_heartbeat
npm test -- src/features/health
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add prisma src/features/health src/app/api/health/route.ts src/worker/main.ts
git commit -m "ops: expose dependency-aware health"
```

---

### Task 5: Add database and upload backup scripts

**Files:**
- Create: `scripts/backup.sh`
- Create: `scripts/backup-verify.sh`
- Create: `docs/operations/backup-restore.md`

**Interfaces:**
- Produces one backup directory containing DB dump, uploads archive, SHA-256 manifest, metadata file.

- [ ] **Step 1: Define backup artifact contract in verification script**

`backup-verify.sh <backup-dir>` fails unless these exist and hashes match:

```text
database.dump
uploads.tar
manifest.sha256
backup-meta.txt
```

Run before backup script exists.  
Expected: FAIL.

- [ ] **Step 2: Implement backup script**

Use:

```sh
docker compose -f compose.portainer.yaml exec -T db   pg_dump -U leihnest -d leihnest --format=custom > "$OUT/database.dump"
```

Archive the named upload volume through a temporary Alpine container or mounted path without modifying source files. Record UTC timestamp and application Git SHA; no secrets.

- [ ] **Step 3: Generate SHA-256 manifest**

```sh
sha256sum database.dump uploads.tar > manifest.sha256
```

- [ ] **Step 4: Verify local test backup**

Run:

```sh
bash scripts/backup.sh ./tmp/leihnest-backup
bash scripts/backup-verify.sh ./tmp/leihnest-backup
```

Expected: PASS against a local test stack.

- [ ] **Step 5: Commit**

```sh
git add scripts/backup.sh scripts/backup-verify.sh docs/operations/backup-restore.md
git commit -m "ops: add coordinated database and media backups"
```

---

### Task 6: Add isolated restore drill and media integrity check

**Files:**
- Create: `docker-compose.restore-test.yml`
- Create: `scripts/restore-test.sh`
- Create: `scripts/verify-restored-media.mjs`
- Modify: `docs/operations/backup-restore.md`

**Interfaces:**
- Restores to scratch DB/volume only.
- Verifies every `MediaAsset.storageKey` expected to exist has bytes.

- [ ] **Step 1: Write restore verification failure case**

Seed a backup copy missing one referenced media file. Run verifier.  
Expected: non-zero with missing storage key count.

- [ ] **Step 2: Implement scratch restore compose**

Use distinct container/volume names:
- `leihnest-restore-db`;
- `leihnest-restore-uploads`.

Never attach production volumes.

- [ ] **Step 3: Implement restore**

Restore `database.dump` with `pg_restore`; untar uploads into scratch volume.

- [ ] **Step 4: Verify integrity**

Query restored DB for all MediaAsset storage keys and verify matching file exists. Also run key table counts and DB health query.

- [ ] **Step 5: Run real restore drill**

Run:

```sh
bash scripts/restore-test.sh ./tmp/leihnest-backup
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add docker-compose.restore-test.yml scripts/restore-test.sh scripts/verify-restored-media.mjs docs/operations/backup-restore.md
git commit -m "ops: prove LeihNest backup restore"
```

---

### Task 7: Consolidate full Playwright critical-path suite

**Files:**
- Create: `e2e/v1-critical-paths.spec.ts`
- Create: `e2e/helpers/session.ts`
- Create: `e2e/helpers/fixtures.ts`
- Modify: `playwright.config.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Aggregates the complete product browser gate.

- [ ] **Step 1: Add DE and EN parameterized core flow**

For both locales:
registration/verified fixture → login → create group → item → reservation → approval → handover → return.

- [ ] **Step 2: Add advanced flows**

Also cover:
- second group + switch;
- invitation;
- category/tag;
- maintenance/damage;
- notification;
- QR target;
- calendar;
- privacy export;
- billing state fixture;
- security settings.

- [ ] **Step 3: Add mobile viewport project**

At least 390x844 and desktop 1440x900. Assert no horizontal page overflow on critical pages.

- [ ] **Step 4: Run**

Run: `npx playwright test e2e/v1-critical-paths.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add e2e playwright.config.ts .github/workflows/ci.yml
git commit -m "test: add complete LeihNest browser gate"
```

---

### Task 8: Add one-command release gate

**Files:**
- Create: `scripts/release-gate.sh`
- Create: `docs/operations/release-checklist.md`
- Modify: `package.json`

**Interfaces:**
- Produces `npm run release:verify`.

- [ ] **Step 1: Implement strict script**

```sh
#!/usr/bin/env sh
set -eu

npm ci
npm test
npm run lint
npm run typecheck
npm run build
npx playwright test
cmp compose.portainer.yaml docker-compose.portainer.yml
docker compose -f compose.portainer.yaml config
docker build -t leihnest:release .
docker build --target worker -t leihnest-worker:release .
bash scripts/backup-verify.sh "$LEIHNEST_TEST_BACKUP_DIR"
```

The CI variant creates the test backup before calling verification.

- [ ] **Step 2: Add package script**

```json
"release:verify": "sh scripts/release-gate.sh"
```

- [ ] **Step 3: Document manual live-only checks**

Google, Apple, real email delivery, Passkey on HTTPS, Stripe live Checkout/Portal, camera scan, Portainer volume persistence.

- [ ] **Step 4: Run locally/CI**

Expected: PASS with no skipped critical tests.

- [ ] **Step 5: Commit**

```sh
git add scripts/release-gate.sh docs/operations/release-checklist.md package.json package-lock.json
git commit -m "test: add complete LeihNest release gate"
```

---

### Task 9: Add production smoke script and Portainer release runbook

**Files:**
- Create: `scripts/smoke-production.sh`
- Create: `docs/operations/portainer-release.md`
- Create: `.github/workflows/production-smoke.yml`

**Interfaces:**
- Produces read-only external smoke checks.
- Documents exact `main` → `portainer-preview` release procedure.

- [ ] **Step 1: Implement read-only smoke**

Check:

```text
GET https://leihnest.de/api/health -> 200
GET / -> 200
GET /en -> 200
GET /login -> 200
GET /register -> 200
GET /preise -> 200
GET /en/pricing -> 200
random /api/media UUID -> 404
random /calendar/feed token -> 404
unsigned Stripe webhook -> rejected
```

- [ ] **Step 2: Document branch handoff**

Runbook:
1. merge verified feature branch to `main`;
2. record release SHA;
3. retain previous `portainer-preview` head on a legacy/rollback ref;
4. fast-forward/update `portainer-preview` to release SHA;
5. Portainer pull/redeploy;
6. migrations run through existing migrate service;
7. verify health;
8. run smoke;
9. perform live authenticated checklist;
10. mark release complete only after evidence.

- [ ] **Step 3: Explicit destructive-command guard**

Runbook and scripts must contain no `docker compose down -v`, `docker volume rm`, `prisma migrate reset`, or production DB reset.

Add a CI grep that fails if these commands appear in release scripts.

- [ ] **Step 4: Run smoke after deployment**

Run:

```sh
BASE_URL=https://leihnest.de sh scripts/smoke-production.sh
```

Expected: PASS only after actual deployment.

- [ ] **Step 5: Commit**

```sh
git add scripts/smoke-production.sh docs/operations/portainer-release.md .github/workflows/production-smoke.yml .github/workflows/ci.yml
git commit -m "ops: add safe production release verification"
```
