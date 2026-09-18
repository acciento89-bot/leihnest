# LeihNest

**Gemeinsam nutzen. Einfach organisiert.**

LeihNest is a German/English self-hosted web application for closed groups to manage shared equipment, reservations, handovers, returns and member invitations. Product domain: `leihnest.de`.

## Stack

Next.js 16, React 19, TypeScript, Better Auth, Prisma 7, PostgreSQL 17, Tailwind CSS, Docker and Portainer.

## Local development

1. Copy `.env.example` to `.env` and replace all placeholder secrets.
2. Start PostgreSQL and set `DATABASE_URL`.
3. Run `npm ci`.
4. Run `npx prisma migrate dev`.
5. Run `npm run dev`.

## Production deployment with Portainer

LeihNest production is managed by the **existing Portainer stack/reference** on `panel.kamilunavo.com`.

**Do not repoint Portainer to GitHub `main`.** The repository/ref already configured in Portainer is the authoritative production source. `main` in this GitHub repository is the integrated source branch, not the Portainer deployment reference.

The production source must contain:

- `docker-compose.portainer.yml`
- `Dockerfile`
- `prisma/`
- the complete application source at release `v1.0.0` / commit `7ec73a716a102a6adfbf45ce4b925845cfbd5c4c`

Required stack variables:

```text
POSTGRES_PASSWORD=<long-random-password>
BETTER_AUTH_SECRET=<at-least-32-random-characters>
BETTER_AUTH_URL=https://leihnest.de
PROXY_NETWORK=kamilunavo-infrastructure_frontend
```

The stack creates PostgreSQL with a persistent volume, runs `prisma migrate deploy` once, then starts the web container only after migration succeeds. The web service joins the existing Kamilunavo frontend network as container `leihnest`.

The central Caddy route must proxy `leihnest.de` and `www.leihnest.de` to `leihnest:3000`. The prepared route is in `Caddyfile.example`.

## Direct Docker Compose deployment

For a standalone host without the shared Kamilunavo proxy network:

```sh
docker compose build
docker compose up -d
```

## Release gates

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
docker compose -f docker-compose.portainer.yml config
docker build -t leihnest:release .
```

## Public launch checklist

- Keep the existing Portainer repository/reference; do not switch it to GitHub `main`.
- Sync release `v1.0.0` / commit `7ec73a716a102a6adfbf45ce4b925845cfbd5c4c` into the configured production source.
- Configure the Portainer stack variables above.
- Configure PostgreSQL backups and retention.
- Pull/redeploy the existing LeihNest stack and verify the migration service completes successfully.
- Validate/reload the central Caddy route.
- Verify `https://leihnest.de/api/health` returns HTTP 200.
- Verify `https://www.leihnest.de` redirects/serves correctly over HTTPS.
- Smoke-test registration, login, group creation, item creation/edit/archive, member invitation acceptance and the complete reservation → approval → handover → return workflow.
- Verify Impressum, Datenschutz and Kontakt pages are publicly reachable.

The production runtime image is a minimal Next.js standalone image. Prisma CLI, Vitest and other build/test tooling are not copied into the runtime container.

No analytics, advertising, public marketplace or member-to-member payment processing is included in this MVP.
