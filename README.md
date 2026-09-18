# LeihNest

**Gemeinsam nutzen. Einfach organisiert.**

LeihNest is a German/English self-hosted web application for closed groups to manage shared equipment, reservations, handovers, returns and member invitations. Product domain: `leihnest.de`.

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
