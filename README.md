# LeihNest

**Gemeinsam nutzen. Einfach organisiert.**

LeihNest is a German/English self-hosted web application for closed groups to manage shared equipment, reservations, handovers, returns and member invitations. Product domain: `leihnest.de`.

## Stack

Next.js 16, React 19, TypeScript, Better Auth, Prisma 7, PostgreSQL 17, Tailwind CSS and Docker.

## Local development

1. Copy `.env.example` to `.env` and replace all placeholder secrets.
2. Start PostgreSQL and set `DATABASE_URL`.
3. Run `npm ci`.
4. Run `npx prisma migrate dev`.
5. Run `npm run dev`.

## Production deployment

Set `POSTGRES_PASSWORD`, a cryptographically random `BETTER_AUTH_SECRET` of at least 32 characters and `BETTER_AUTH_URL=https://leihnest.de`.

Then run:

```sh
docker compose build
docker compose up -d
```

The Compose stack starts PostgreSQL, runs `prisma migrate deploy` in the one-shot `migrate` service, and only starts the web service after a successful migration. The web container exposes `/api/health` for health checks.

Terminate TLS at the existing reverse proxy and forward HTTPS traffic for `leihnest.de` to port 3000. Do not expose PostgreSQL publicly.

## Release gates

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
docker build -t leihnest:release .
```

## Public launch checklist

- Configure production secrets.
- Configure database backups and retention.
- Point `leihnest.de` at the production reverse proxy and enable HTTPS.
- Run `docker compose up -d` and verify the migration service completes successfully.
- Verify `https://leihnest.de/api/health`.
- Smoke-test registration, login, group creation, item creation/edit/archive, member invitation acceptance and the complete reservation → approval → handover → return workflow.
- Verify Impressum, Datenschutz and Kontakt pages are publicly reachable.

The production runtime image is a minimal Next.js standalone image. Prisma CLI, Vitest and other build/test tooling are not copied into the runtime container.

No analytics, advertising, public marketplace or member-to-member payment processing is included in this MVP.
