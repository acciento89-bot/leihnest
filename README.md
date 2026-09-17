# LeihNest

**Gemeinsam nutzen. Einfach organisiert.** A Kamilunavo product for `leihnest.de`.

A real, bilingual lending workspace for closed groups, not a static dashboard.
German and English are built in. Data is persisted, inventory photos are private,
and every inventory-changing operation runs inside a serialized transaction.

## Independent LeihNest identity

Version 0.2 replaces the generic sidebar layout with a horizontal workspace,
warm paper surfaces, forest-green ink, editorial serif headings and an original
nest mark. Local vector still-life artwork and an open shared shelf give the
product its own visual language. No downloaded fonts or third-party app assets.
Missing photographs are labelled rather than disguised as real inventory images.
See `docs/redesign.md` and `docs/verification.md` for scope and test evidence.

## Implemented pilot

- Public product website, registration gate, login, password reset and group onboarding.
- Owners, administrators and members, email-bound invitations and revocable access.
- Inventory with photos, quantities, category, location, accessories and condition.
- Availability-aware reservations, optional approval, handovers and partial/full returns.
- Overdue stock protection, calendar, activity, search and inventory CSV export.
- Optional SMTP outbox, idempotent reminder creation and consistent private backups.
- Responsive interface, keyboard focus indicators, mobile navigation and DE/EN switch.

No subscriptions, payment collection, public marketplace or external analytics are enabled.
The pilot does not charge users. Operator legal text and mail configuration are required
before enabling open production registration. DNS, TLS and hosting are not changed by this repository.

## Local development

Python 3.13 and a local filesystem are required. Run from the repository root:

```sh
python -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements-dev.txt
ALLOW_SIGNUP=1 python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open `http://localhost:8000`. Registration is enabled only by that command.
Create your own account and group; application workspaces contain no fake seeded data.
Only the public landing-page illustration contains explicitly labelled examples.
On Windows PowerShell use `.venv\Scripts\Activate.ps1` and set `$env:ALLOW_SIGNUP="1"`
before the uvicorn command. The maintenance CLI below targets the Linux/Docker host.

```sh
python -m pytest -q
python -m compileall -q app tests
python -m playwright install chromium
python tests/browser_check.py
```

The browser test creates its own temporary database and server, checks desktop/mobile
pages and drives signup through a partial and complete return. Screenshots and the
report go to `artifacts/`; no deployment credentials are used.

## Docker: closed production pilot

A single Linux server with Docker Compose and an existing HTTPS reverse proxy is the
intended deployment. No paid cloud database is required. Copy `.env.example` and
generate a secret rather than reusing example credentials:

```sh
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Put the generated value in `SECRET_KEY` in `.env`, keep `ALLOW_SIGNUP=0`, and keep
`PUBLIC_URL=https://leihnest.de`. Do not commit `.env`. The blank example secret
intentionally fails the production startup gate rather than silently using a weak key.

```sh
docker compose up -d --build
docker compose exec web python -m app.cli user --email owner@leihnest.de --name Inhaber
```

The CLI prompts for the password without printing it. Use your actual operator email
instead of `owner@leihnest.de`; that address is illustrative, not provisioned by the app.
The web port binds only to `127.0.0.1:8086`. Route the existing HTTPS reverse proxy to
that address, forward the original Host and X-Forwarded-Proto, and set
`FORWARDED_ALLOW_IPS` to the proxy's actual address/subnet as observed by the container.
Do not trust arbitrary clients: this setting also affects login rate limiting.
A reverse proxy in a separate container needs an explicitly configured private Docker
network instead of its own `127.0.0.1`. Do not publish port 8000 directly to the internet.

Log in through the HTTPS hostname, create a group, then invite its members. Invitations
can be copied manually for a closed pilot and are valid only for the specified email.
Keep existing server services intact; this repository does not install a proxy or certificates.

## Email and reminders

Fill the SMTP and MAIL_FROM values in `.env`, then recreate the service. STARTTLS on
port 587 is the default; for implicit TLS use `SMTP_SSL=1` with port 465. Never disable
TLS when transmitting credentials to a remote mail server.

```sh
docker compose exec -T web python -m app.cli reminders
docker compose exec -T web python -m app.cli mail-status
docker compose exec -T web python -m app.cli mail
```

Only `mail` transmits messages. Invitations/password resets are queued; due-return
reminders are queued once per booking/due date. The dispatcher attempts up to 100
pending messages per run, records failures and stops retrying after five attempts.
Run it from the server's scheduler once SMTP delivery has been verified. A crash after
SMTP acceptance can cause a duplicate on retry; delivery is not claimed exactly-once.
Treat database/backups as confidential: queued invitation/reset links are bearer tokens.

## Backup and restore

Use a unique name; existing files are never overwritten:

```sh
docker compose exec -T web python -m app.cli backup /data/backups/leihnest-$(date +%Y%m%d-%H%M%S).tar.gz
```

Copy backups to encrypted off-server storage. A backup contains a consistent SQLite
snapshot, referenced photos and operator legal text. It does not contain deployment
secrets; keep those separately in a secure password manager. Writes pause while the
backup is assembled, so use a quiet maintenance window for large inventories.

For restore, stop the web service, unpack your own trusted archive into an empty local
directory, inspect `leihnest.sqlite3` with `PRAGMA integrity_check`, and replace the
persistent volume's database/photos/legal directory while the service is stopped.
Remove obsolete `leihnest.sqlite3-wal` and `leihnest.sqlite3-shm` files from the previous
instance before starting. Restore file ownership to UID/GID 10001. Keep the old volume
until login, inventory photos and a reservation have been checked. Never extract an
untrusted archive or replace database files in a running instance.

## Public launch gates

Provide `/data/legal/imprint.txt` and `/data/legal/privacy.txt` as reviewed UTF-8 plain
text with the actual operator and actual processing details. The pages escape HTML.
Public registration additionally checks that SMTP_HOST is configured; operators must
also verify successful delivery, MAIL_FROM, domain authentication and reset links.
Pilot notices shown when those texts are absent are not legal documents.

Before opening to the public, complete a deployment/security review, data-retention
and account-deletion process, monitoring, off-server backup/restore drill and support
contact. Billing needs a separate agreed price/product setup and payment integration.
These are launch gates, not simulated features.

## Architecture and limits

FastAPI, Starlette sessions, Jinja, Argon2 and SQLite WAL; plain CSS and progressive JS.
Private photos are decoded and re-encoded to WebP. Upload bodies and image dimensions
are bounded. Sessions/reset tokens are hashed server-side; mutations require CSRF.

`BEGIN IMMEDIATE` serializes availability checks and writes across processes on the
same local SQLite database. Intervals are half-open and quantity occupancy is calculated
at peak overlap, including overdue unreturned quantities. Multiple replicas, network
filesystems and horizontal scaling are unsupported; migrate persistence first.
Times are stored as UTC seconds and displayed/entered in Europe/Berlin. Ambiguous or
nonexistent daylight-saving local times are rejected rather than guessed.

`app/` contains the domain, HTTP routes and UI; `tests/` contains domain, HTTP, operations
and browser checks. `docs/verification.md` records what was actually verified. The
GitHub workflow runs tests, browser lifecycle and a non-root Docker health check.
No automatic deployment or production secrets are used by CI.
