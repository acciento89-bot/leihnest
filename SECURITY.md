# Security

LeihNest treats Critical npm advisories as release blockers. The CI workflow also prints the full production audit report on every run.

## Current upstream Prisma CLI advisories

As of 18 September 2026, Prisma ORM 7.10.0 transitively pins packages currently reported by npm audit:

- `deepmerge-ts` below 8.0.0 through `@prisma/config`.
- `mysql2` through Prisma CLI tooling.

LeihNest uses PostgreSQL through `@prisma/adapter-pg`; it does not connect to MySQL. The `mysql2` code path is therefore not used by the application. The `deepmerge-ts` finding concerns Prisma configuration loading from repository-controlled configuration during build/migration operations, not untrusted application input.

These findings are retained visibly in CI rather than hidden. We do not force incompatible transitive major-version overrides. They should be removed by upgrading Prisma once a stable upstream release resolves the pinned dependencies.

Critical production dependency advisories remain a hard CI failure.
