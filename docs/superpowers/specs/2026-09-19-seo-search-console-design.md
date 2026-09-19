# LeihNest SEO and Search Console Design

**Status:** completion roadmap extension  
**Datum:** 19.09.2026  
**Repository:** `acciento89-bot/leihnest`  
**Production:** `https://leihnest.de`

---

## 1. Scope

This design completes LeihNest's public discoverability and search-engine integration.

It is separate from authentication:

- **SSO** = sign-in through Google/Apple and linked identity providers.
- **SEO** = search-engine optimization for the public LeihNest website.
- **Google Search Console** = ownership/indexing/performance monitoring for Google Search.

SSO is already covered by the Auth & Account plan. This document covers SEO and Search Console.

---

## 2. Existing SEO foundation

Already present in the current repository:

- `src/app/robots.ts`;
- `src/app/sitemap.ts`;
- global title and description metadata;
- canonical URL for the homepage;
- DE/EN alternate links on the homepage;
- page-specific metadata for public Features/Pricing pages;
- DE/EN public marketing URLs;
- Open Graph basics.

This is a useful baseline, but not the finished SEO/Search Console setup.

---

## 3. Public index policy

Only public marketing/legal pages may be indexed.

Indexable routes include:

- `/`;
- `/en`;
- `/funktionen`;
- `/en/features`;
- `/preise`;
- `/en/pricing`;
- `/kontakt`;
- `/impressum`;
- `/datenschutz`.

Non-indexable routes include at minimum:

- `/app/**`;
- `/api/**`;
- `/login`;
- `/register`;
- `/verify-email`;
- `/forgot-password`;
- `/reset-password`;
- `/invite/**`;
- `/i/**`;
- `/calendar/feed/**`;
- internal billing/auth callback paths.

Authentication and token-bearing routes must not appear in the sitemap.

Public legal pages may remain indexable but do not receive artificial SEO priority.

---

## 4. Sitemap

The sitemap is generated from one central public-page registry.

Do not set `lastModified: new Date()` on every request because that incorrectly claims every page changed every time the sitemap is fetched.

Each sitemap entry contains:

- canonical absolute URL;
- language alternates where a real translated counterpart exists;
- optional stable last-modified date only when the application actually knows it.

The sitemap URL is:

`https://leihnest.de/sitemap.xml`

---

## 5. Canonical URLs and hreflang

Every public marketing page has exactly one canonical URL.

Translated pairs:

```
/                  <-> /en
/funktionen        <-> /en/features
/preise            <-> /en/pricing
```

For translated pairs, metadata contains reciprocal language alternatives:

- `de-DE`;
- `en`;
- `x-default` pointing to the German default page where appropriate.

Pages with no real translated counterpart must not invent an alternate URL.

---

## 6. Metadata

Every indexable public page has deliberate:

- title;
- meta description;
- canonical;
- Open Graph title;
- Open Graph description;
- Open Graph URL;
- locale;
- social image;
- Twitter card metadata.

Titles/descriptions must match visible page content and not use keyword stuffing.

Authenticated/non-public pages use:

```ts
robots: {
  index: false,
  follow: false,
}
```

where page metadata applies.

---

## 7. Structured data

The public homepage includes JSON-LD that truthfully represents the service.

At minimum:

### Organization

- `@type: Organization`;
- name: LeihNest / Kamilunavo relationship represented accurately;
- `url: https://leihnest.de`;
- logo URL when available.

### WebSite

- `@type: WebSite`;
- name: LeihNest;
- URL.

### SoftwareApplication / WebApplication

Only factual properties:

- name;
- application category;
- operating system = Web;
- URL;
- offers that correspond to actual Free/Plus pricing.

Do not include fabricated ratings, review counts, awards, install counts, or unsupported claims.

Structured data is validated in tests and with Google's Rich Results / Schema validation tooling during release QA.

---

## 8. Social preview assets

LeihNest gets deterministic social preview images for:

- default DE;
- default EN;
- optionally pricing/features when distinct previews improve sharing.

Use Next.js Open Graph image generation or committed app assets.

Images use the existing LeihNest brand and do not alter the site's approved visual design.

---

## 9. Search Console

Production setup uses a **Google Search Console Domain Property** for:

`leihnest.de`

Domain ownership is verified through the DNS record provided by Google Search Console.

The DNS token is not committed to the repository.

After verification:

1. submit `https://leihnest.de/sitemap.xml`;
2. verify sitemap success;
3. inspect the canonical homepage;
4. inspect the English homepage;
5. confirm Google-selected canonical matches intended canonical;
6. review Page Indexing;
7. review Core Web Vitals;
8. review HTTPS status;
9. review manual actions/security issues;
10. monitor search queries, impressions, clicks and indexing after releases.

Search Console does not replace SEO implementation; it verifies and monitors Google's view of the site.

---

## 10. Performance and Core Web Vitals

Public marketing pages must remain lightweight.

Release checks cover:

- no layout shift caused by unsized images;
- no unnecessary client JavaScript on static marketing sections;
- no blocking third-party analytics scripts;
- optimized image delivery;
- mobile responsiveness;
- accessible headings/landmarks;
- stable CTA links;
- Lighthouse checks for representative public pages.

No SEO work may introduce Google Analytics, advertising tracking, or unrelated third-party trackers.

---

## 11. Search engine access and private content

`robots.txt` is only a crawler instruction, not an access-control mechanism.

Private LeihNest content remains protected by authentication and server-side membership checks independently of robots rules.

Token routes such as invitations, QR targets and calendar feeds must never be exposed through sitemap or public internal links intended for indexing.

---

## 12. Search Console release checklist

After production deployment:

1. `robots.txt` is reachable and contains the expected exclusions;
2. `sitemap.xml` contains only public canonical URLs;
3. public pages return HTTP 200;
4. canonical and hreflang values are correct;
5. auth/workspace pages are `noindex`;
6. JSON-LD validates;
7. social preview image endpoints return usable images;
8. Search Console Domain Property is verified;
9. sitemap is submitted;
10. representative DE/EN URLs are inspected;
11. no accidental private/token URL is reported as indexable;
12. Lighthouse/public performance gate passes.

---

## 13. Definition of done

SEO/Search Console is complete when:

- the public-page index policy is implemented and tested;
- sitemap/canonicals/hreflang are internally consistent;
- public metadata is complete in DE/EN;
- private/auth/token routes are excluded/noindex;
- structured data contains only factual information;
- social previews work;
- public pages pass the chosen Lighthouse gate;
- the `leihnest.de` Domain Property is verified in Search Console;
- `https://leihnest.de/sitemap.xml` is submitted successfully;
- representative DE/EN URLs have been inspected in Search Console.
