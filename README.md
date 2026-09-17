# LeihNest

**Gemeinsam nutzen. Einfach organisiert.**

LeihNest is a German/English self-hosted web application for closed groups to manage shared equipment, reservations, handovers and returns. Product domain: `leihnest.de`.

## Stack

Next.js 16, React 19, TypeScript, Better Auth, Prisma 7, PostgreSQL 17, Tailwind CSS and Docker.

## Local development

1. Copy `.env.example` to `.env` and replace all placeholder secrets.
2. Start PostgreSQL and set `DATABASE_URL`.
3. Run `npm ci`.
4. Run `npx prisma migrate dev --name init` for a development database.
5. Run `npm run dev`.

## Production deployment

Set `POSTGRES_PASSWORD`, a cryptographically random `BETTER_AUTH_SECRET` of at least 32 characters and `BETTER_AUTH_URL=https://leihnest.de` in the deployment environment. Then run:

```sh
docker compose build
docker compose run --rm web npx prisma migrate deploy
docker compose up -d
```

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

## Before public launch

- Replace the explicit placeholders in `/impressum` and `/datenschutz` with the operator's legally required name/address and verify the final legal wording.
- Configure production secrets and database backups.
- Run the initial Prisma migration against production.
- Smoke-test registration, login, group creation, item creation and the complete reservation → approval → handover → return workflow over HTTPS.

No analytics, advertising, public marketplace or member-to-member payment processing is included in this MVP.
