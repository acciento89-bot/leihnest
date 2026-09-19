# LeihNest: approved concept-fidelity design

Base source: `main` at `65462ab5a98c3d3e0702bdeff0eb67e0dddb43fe`.
Approved direction: the three reference images supplied on 19 September 2026.
Portainer deploys `main`; no deployment through `portainer-preview` is required.

## Implemented

- Photo-led DE/EN landing page: headline, garden composition, nest mark, real interactive inventory preview, example calendar, audience strip, three feature cards, and three-step introduction.
- Split DE/EN login and registration pages with the existing authentication flow; labeled inputs and an accessible password visibility control.
- Authenticated dashboard: scoped real group metrics, first items, upcoming loans, six calendar months of actual handovers, latest reservation-state changes, member initials, and a day-selectable loan calendar.
- The existing inventory uses the same item photography, explicitly labeled as illustrative photos.
- Local image assets with complete attribution on `/bildnachweise` and in `public/images/leihnest/LICENSES.md`.

## Deliberate differences from the concept

- Actual licensed product photographs replace the AI-rendered product examples; photographed models and backgrounds therefore differ.
- No fabricated 2,800 communities, 120,000 items, recommendation percentage, CO2 estimate, fake avatars, or unsupported Google/Apple sign-in is shown.
- No non-functional messaging, notification or password-reset buttons are added. Existing actions remain functional.
- The calendar displays group loans and requests, not a misleading guarantee of availability of an unspecified item.
- Dates, names and counts in the dashboard come from the current group. Example data exists only in the public labeled demonstration and isolated QA fixtures.

## Preserved

No changes to legal pages, Prisma schema, migrations, authentication configuration, server-action implementations, secrets, volumes, Compose files, or the deployment target. Existing authorization checks remain server-side. No production data was accessed or modified during verification.

## Verification

91 tests passed in 28 files, including five persisted workflow integration tests on an isolated PGlite PostgreSQL-compatible test database. ESLint and TypeScript passed. A normal Next.js production build completed successfully.

Isolated browser interaction tests exercised the real preview and calendar components plus password visibility and failed sign-in UI. Only transport/router wrappers were mocked; this is not a successful authentication test against production.

Reference comparisons use actual rendered components and local assets. Dashboard screenshots contain fictional QA fixtures, not production data. Desktop and mobile views were inspected; the report lists viewport checks. Chromium local HTTP navigation was unavailable in the verification environment, so these are offline rendering checks, not a deployed end-to-end test. The production-generated public HTML was checked separately.

Code review was a self-review; there was no independent second reviewer. Deployment and an authenticated live acceptance test remain required after integration.

## Integration

Upload the `src`, `public` and `docs` directories from the changes-only ZIP into `design/concept-fidelity-20260919` at repository root. Never upload the enclosing ZIP folder. No deletions of existing source files are required. Run the normal CI, review the diff, and merge into `main` only when it passes. Preserve all existing Portainer variables and volumes. Confirm the newly deployed site after the merge.
