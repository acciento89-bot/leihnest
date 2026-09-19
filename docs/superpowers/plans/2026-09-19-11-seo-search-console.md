# LeihNest SEO and Search Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete LeihNest technical SEO, public-page metadata, structured data, social previews, Search Console onboarding, and measurable public performance without exposing private product routes.

**Architecture:** Centralize indexable public pages in one SEO registry used by sitemap/metadata tests. Authenticated and token-bearing routes receive explicit non-indexability. Structured data is generated from typed builders. Search Console setup remains an operational DNS/manual verification step documented in the repo.

**Tech Stack:** Next.js 16 metadata APIs, JSON-LD, Vitest, Playwright, Lighthouse CI, Google Search Console operational runbook.

**Spec:** `docs/superpowers/specs/2026-09-19-seo-search-console-design.md`

## Global Constraints

- No private/auth/token route appears in the sitemap.
- `robots.txt` is never treated as authorization.
- Canonicals and hreflang alternates must agree.
- Metadata must reflect visible page content.
- No fabricated reviews/ratings/schema claims.
- No Google Analytics or ad tracking is introduced.
- Search Console verification secrets/tokens are not committed.
- Public DE/EN pages remain fast and accessible.

## Review Focus

1. Sitemap does not claim every page changed on every request.
2. Login/register/invite/QR/calendar-feed pages are not indexable.
3. DE/EN canonical and reciprocal hreflang values never point to mismatched pages.
4. Structured data cannot include empty/fabricated pricing/review fields.
5. Search Console setup remains reproducible without storing the DNS verification token in Git.

---

### Task 1: Centralize public SEO routes and fix sitemap/robots

**Files:**
- Create: `src/features/seo/public-pages.ts`
- Create: `src/features/seo/public-pages.test.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`

**Interfaces:**
- Produces `PUBLIC_INDEXABLE_PAGES`.
- Produces `buildSitemap(baseUrl): MetadataRoute.Sitemap`.
- Produces `buildRobots(baseUrl): MetadataRoute.Robots`.

- [ ] **Step 1: Write failing sitemap privacy test**

```ts
it("contains only explicitly public canonical pages", () => {
  const urls = buildSitemap("https://leihnest.de").map(entry => entry.url);

  expect(urls).toContain("https://leihnest.de/");
  expect(urls).toContain("https://leihnest.de/en");
  expect(urls).not.toEqual(expect.arrayContaining([
    expect.stringContaining("/app"),
    expect.stringContaining("/login"),
    expect.stringContaining("/register"),
    expect.stringContaining("/invite"),
    expect.stringContaining("/i/"),
    expect.stringContaining("/calendar/feed"),
  ]));
});

it("does not stamp every page with the current request time", () => {
  const entries = buildSitemap("https://leihnest.de");
  expect(entries.every(entry => entry.lastModified instanceof Date)).toBe(false);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/seo/public-pages.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement the public-page registry**

Use one explicit registry:

```ts
export const PUBLIC_INDEXABLE_PAGES = [
  { path: "/", locale: "de", alternate: "/en" },
  { path: "/en", locale: "en", alternate: "/" },
  { path: "/funktionen", locale: "de", alternate: "/en/features" },
  { path: "/en/features", locale: "en", alternate: "/funktionen" },
  { path: "/preise", locale: "de", alternate: "/en/pricing" },
  { path: "/en/pricing", locale: "en", alternate: "/preise" },
  { path: "/kontakt", locale: "de" },
  { path: "/impressum", locale: "de" },
  { path: "/datenschutz", locale: "de" },
] as const;
```

Do not add a `lastModified` value unless a stable content timestamp is known.

- [ ] **Step 4: Harden robots**

Disallow crawler paths:

```text
/app/
/api/
/login
/register
/verify-email
/forgot-password
/reset-password
/invite/
/i/
/calendar/feed/
```

Keep sitemap URL `https://leihnest.de/sitemap.xml`.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/seo/public-pages.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/seo src/app/sitemap.ts src/app/robots.ts
git commit -m "seo: centralize public index routes"
```

---

### Task 2: Add explicit noindex metadata to private/auth/token pages

**Files:**
- Create: `src/features/seo/noindex.ts`
- Create: `src/features/seo/noindex.test.ts`
- Modify: `src/app/(app)/app/layout.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`
- Modify: `src/app/verify-email/page.tsx`
- Modify: `src/app/forgot-password/page.tsx`
- Modify: `src/app/reset-password/page.tsx`
- Modify: `src/app/invite/[token]/page.tsx`
- Modify: `src/app/i/[token]/page.tsx`

**Interfaces:**
- Produces `NOINDEX_METADATA: Metadata`.

- [ ] **Step 1: Write failing metadata contract test**

```ts
it("marks private application surfaces noindex nofollow", () => {
  expect(NOINDEX_METADATA.robots).toEqual({
    index: false,
    follow: false,
    nocache: true,
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/seo/noindex.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement shared noindex metadata**

```ts
export const NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};
```

- [ ] **Step 4: Apply to private pages**

The authenticated app layout exports `NOINDEX_METADATA`, which cascades to workspace pages. Auth/token pages export or generate equivalent metadata.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/seo/noindex.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/seo/noindex* src/app/\(app\)/app/layout.tsx src/app/login src/app/register src/app/verify-email src/app/forgot-password src/app/reset-password src/app/invite src/app/i
git commit -m "seo: mark private routes noindex"
```

---

### Task 3: Complete canonical, hreflang, Open Graph, and Twitter metadata

**Files:**
- Create: `src/features/seo/page-metadata.ts`
- Create: `src/features/seo/page-metadata.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/en/page.tsx`
- Modify: `src/app/funktionen/page.tsx`
- Modify: `src/app/en/features/page.tsx`
- Modify: `src/app/preise/page.tsx`
- Modify: `src/app/en/pricing/page.tsx`
- Modify: `src/app/kontakt/page.tsx`
- Modify: `src/app/impressum/page.tsx`
- Modify: `src/app/datenschutz/page.tsx`

**Interfaces:**
- Produces `marketingMetadata(pageKey): Metadata`.

- [ ] **Step 1: Write failing reciprocal-alternate test**

```ts
it("builds reciprocal DE/EN alternates for pricing", () => {
  const de = marketingMetadata("pricing-de");
  const en = marketingMetadata("pricing-en");

  expect(de.alternates).toMatchObject({
    canonical: "/preise",
    languages: {
      "de-DE": "/preise",
      en: "/en/pricing",
      "x-default": "/preise",
    },
  });

  expect(en.alternates).toMatchObject({
    canonical: "/en/pricing",
    languages: {
      "de-DE": "/preise",
      en: "/en/pricing",
      "x-default": "/preise",
    },
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/seo/page-metadata.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement typed metadata registry**

For each public page define exact:
- title;
- description;
- canonical;
- locale;
- translated counterpart where real.

No invented English alternate for German-only legal/contact pages.

- [ ] **Step 4: Add Open Graph/Twitter**

Each marketing metadata result includes:
- `openGraph.title`;
- `openGraph.description`;
- `openGraph.url`;
- `openGraph.locale`;
- `openGraph.images`;
- `twitter.card = "summary_large_image"`;
- `twitter.title`;
- `twitter.description`;
- `twitter.images`.

- [ ] **Step 5: Run GREEN/build**

Run:

```sh
npm test -- src/features/seo/page-metadata.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add src/features/seo/page-metadata* src/app
git commit -m "seo: complete public metadata and hreflang"
```

---

### Task 4: Add factual structured data and social preview images

**Files:**
- Create: `src/features/seo/structured-data.ts`
- Create: `src/features/seo/structured-data.test.ts`
- Create: `src/components/site/structured-data.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/en/page.tsx`
- Create: `src/app/opengraph-image.tsx`
- Create: `src/app/en/opengraph-image.tsx`

**Interfaces:**
- Produces:
  - `organizationJsonLd()`;
  - `websiteJsonLd(locale)`;
  - `softwareApplicationJsonLd(locale)`.

- [ ] **Step 1: Write failing truthfulness test**

```ts
it("never emits fabricated ratings or reviews", () => {
  const json = JSON.stringify(softwareApplicationJsonLd("de"));
  expect(json).not.toMatch(/aggregateRating|reviewCount|ratingValue/);
});

it("publishes the actual Free and Plus offers", () => {
  const data = softwareApplicationJsonLd("de");
  expect(JSON.stringify(data)).toContain("4.99");
  expect(JSON.stringify(data)).toContain("39.99");
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/seo/structured-data.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement JSON-LD builders**

Use only factual fields:
- Organization name/URL/logo;
- WebSite name/URL;
- SoftwareApplication name/URL/applicationCategory/operatingSystem;
- offers matching current Free, monthly Plus and yearly Plus pricing.

- [ ] **Step 4: Render JSON-LD on public homepages**

Use a server component that serializes the trusted builder result and escapes `<` as `\u003c`.

- [ ] **Step 5: Add deterministic social preview images**

Use Next `ImageResponse` with the existing brand identity. No dynamic user content.

- [ ] **Step 6: Run GREEN/build**

Run:

```sh
npm test -- src/features/seo/structured-data.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```sh
git add src/features/seo/structured-data* src/components/site/structured-data.tsx src/app/page.tsx src/app/en/page.tsx src/app/opengraph-image.tsx src/app/en/opengraph-image.tsx
git commit -m "seo: add structured data and social previews"
```

---

### Task 5: Add Lighthouse public-page gate

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lighthouserc.cjs`
- Create: `docs/operations/seo-performance.md`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces `npm run lighthouse:ci`.

- [ ] **Step 1: Install Lighthouse CI**

Run:

```sh
npm install -D @lhci/cli
```

- [ ] **Step 2: Add public-page Lighthouse config**

Test:
- `/`;
- `/en`;
- `/funktionen`;
- `/preise`.

Use local production build/server.

Assertions:
- SEO >= 0.95;
- accessibility >= 0.95;
- best-practices >= 0.95;
- performance >= 0.85.

- [ ] **Step 3: Add script**

```json
"lighthouse:ci": "lhci autorun"
```

- [ ] **Step 4: Document performance remediation rules**

Fix actual regressions such as unsized images, unnecessary client bundles, broken headings, missing labels, or blocking scripts rather than lowering thresholds without review.

- [ ] **Step 5: Run**

```sh
npm run build
npm run lighthouse:ci
```

Expected: PASS on representative public pages.

- [ ] **Step 6: Commit**

```sh
git add package.json package-lock.json lighthouserc.cjs docs/operations/seo-performance.md .github/workflows/ci.yml
git commit -m "test: add public SEO performance gate"
```

---

### Task 6: Add Google Search Console setup and release verification

**Files:**
- Create: `docs/operations/google-search-console.md`
- Create: `scripts/verify-seo-production.sh`
- Modify: `docs/operations/release-checklist.md`
- Modify: `.github/workflows/production-smoke.yml`

**Interfaces:**
- Produces a reproducible manual Search Console onboarding/runbook plus automated public SEO smoke checks.

- [ ] **Step 1: Document Domain Property setup**

Runbook uses a Search Console **Domain Property** for:

```
leihnest.de
```

Verification procedure:
1. create/select Domain Property in Search Console;
2. copy Google's DNS TXT verification value;
3. add it at the DNS provider for the root domain;
4. verify in Search Console;
5. leave the verification record in DNS;
6. do not commit the TXT token to Git.

Reference official Google procedure in the document.

- [ ] **Step 2: Document sitemap submission**

Submit:

```
https://leihnest.de/sitemap.xml
```

Then inspect:
- `https://leihnest.de/`;
- `https://leihnest.de/en`;
- `https://leihnest.de/funktionen`;
- `https://leihnest.de/en/features`.

Record whether Google-selected canonical matches the declared canonical.

- [ ] **Step 3: Implement SEO production verifier**

`scripts/verify-seo-production.sh` checks:
- `/robots.txt` returns 200 and references the production sitemap;
- `/sitemap.xml` returns 200;
- sitemap contains public URLs;
- sitemap does not contain `/app`, `/login`, `/register`, `/invite`, `/i/`, or `/calendar/feed`;
- public pages return canonical metadata;
- login/register contain noindex;
- Open Graph image endpoint returns an image response.

- [ ] **Step 4: Add production smoke integration**

Production smoke runs the SEO verifier read-only after deploy.

- [ ] **Step 5: Run after production deploy**

Run:

```sh
BASE_URL=https://leihnest.de sh scripts/verify-seo-production.sh
```

Expected: PASS.

The Search Console DNS verification and sitemap submission remain manual account-owner steps and are checked off in the release checklist.

- [ ] **Step 6: Commit**

```sh
git add docs/operations/google-search-console.md scripts/verify-seo-production.sh docs/operations/release-checklist.md .github/workflows/production-smoke.yml
git commit -m "ops: add Search Console and SEO verification"
```
