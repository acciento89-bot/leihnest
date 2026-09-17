# LeihNest core implementation plan

> For agentic workers: use superpowers:executing-plans; execute and verify in this session.

**Goal:** Deliver a tested, usable closed-group lending pilot in the supplied repository.
**Architecture:** FastAPI/Jinja, SQLite WAL with serialized inventory transactions, private file storage, DB-backed opaque sessions and mail outbox. One application/container, no required cloud backend.
**Tech Stack:** Python 3.13; dependency versions pinned in requirements.txt.
**Spec:** docs/superpowers/specs/2026-09-17-leihnest-core.md

## Global constraints
German/English UI; light green design; no public marketplace, goods checkout, live billing or unapproved deployments. All mutations CSRF protected. No network filesystem for SQLite. Tests use temporary directories, never production data.

## Task 1: domain and security
Files: app/db.py, app/domain.py, app/security.py, tests/test_domain.py.
- [x] Define tests against Store(path).create_user/create_group/add_item/reserve/transition/invite/accept_invite.
- [x] Run `pytest tests/test_domain.py -q` and retain failure evidence.
- [x] Implement schema, atomic stock sweep, membership enforcement, transitions and secure tokens.
- [x] Run `pytest tests/test_domain.py -q`, including two-thread booking contention.

## Task 2: web application and design
Files: app/main.py, app/i18n.py, app/templates/*.html, app/static/style.css, app/static/app.js, tests/test_web.py.
- [x] Write HTTP tests: signup/login require CSRF, sessions rotate, tenant isolation, full booking lifecycle, DE/EN route rendering, upload validation.
- [x] Run `pytest tests/test_web.py -q` and retain failure evidence.
- [x] Implement responsive views around the tested domain interfaces; use real data for signed-in users.
- [x] Run all tests and render actual pages using Playwright at 1440px and 390px widths. Local offline render check passed; full network browser check is a CI gate (see docs/verification.md).

## Task 3: operations and review
Files: app/cli.py, Dockerfile, compose.yaml, .env.example, README.md, .github/workflows/ci.yml, tests/test_operations.py.
- [x] Test reminder deduplication and backup integrity before implementing these commands.
- [x] Implement SMTP outbox sending, explicit reminder run and SQLite online backup; no background promises.
- [x] Run `pytest -q`, `python -m compileall -q app` and browser checks; review authorization, state invariants, language coverage and deployment defaults.
- [ ] Upload verified source to a feature branch and open a PR. Confirm remote head/file contents before reporting.
