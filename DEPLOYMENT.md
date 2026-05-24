# Deployment — TYPE10 Media website

One Astro project serves **both** type10.com (English) and type10.de (German) from a
single Cloudflare Pages deployment. A Pages Function (`functions/_middleware.ts`) does the
host-based routing, legacy redirects, and per-host `robots.txt` / `sitemap.xml`.

## Cloudflare Pages project settings

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `site` (if the repo root is the monorepo) |
| Node version | `20` (or `22`) — set `NODE_VERSION` env var |

`functions/`, `public/_headers`, `public/_redirects`-style rules are picked up automatically.
There are no secrets/env vars required for the build.

## Custom domains

Attach all four to the **same** Pages project (Pages → Custom domains):

- `type10.com` and `www.type10.com`
- `type10.de` and `www.type10.de`

Add redirect rules `www.type10.com → type10.com` and `www.type10.de → type10.de` (apex).

### DNS / cutover from GitHub Pages

1. Both zones must be on **Cloudflare nameservers** (prerequisite for Pages custom domains + Functions).
2. Remove the old GitHub Pages records (the `A`/`AAAA`/`CNAME` to `*.github.io`) and the `CNAME` files in the old repos.
3. Let Cloudflare Pages create the records when you attach each custom domain.
4. After propagation, retire the old repos (`type10/type10.github.io`, `type10/type10de.github.io`).

## How routing works (functions/_middleware.ts)

- `type10.com/*` → English at the apex. `/de/*` is **301**'d to `type10.de`.
- `type10.de/*` → the German tree (built under `/de/`) is **rewritten** to the apex, so URLs stay clean (`type10.de/leistungen/`). `/robots.txt` and `/sitemap.xml` resolve to their `/de/` variants.
- **Legacy 301s** (old Eleventy/Jekyll URLs) run first: `/portfolio/<old>/ → /work|/referenzen/<new>/`, old service slugs → new, `/blog/* → /insights/`.
- Previews on `*.pages.dev` have no real host: append `?__lang=de` to view the German tree (cookie-persisted).

## SEO files

- `public/robots.txt` (type10.com) → `Sitemap: https://type10.com/sitemap.xml`
- `public/de/robots.txt` (type10.de) → `Sitemap: https://type10.de/sitemap.xml`
- `src/pages/sitemap.xml.ts` / `src/pages/de/sitemap.xml.ts` — per-locale sitemaps with reciprocal `hreflang`, each listing its own domain's URLs.

## Local preview

- Fast EN iteration: `npm run dev` → http://localhost:4321/
- Full bilingual + middleware: `npm run preview:cf` (= `astro build && wrangler pages dev dist`)
  - `curl -H "Host: type10.de" http://localhost:8788/leistungen/` (German at apex)
  - `http://localhost:8788/?__lang=de` (German tree in a browser)

## Post-deploy: Search Console

Register **two** properties — `https://type10.com` and `https://type10.de` — and submit
`https://type10.com/sitemap.xml` and `https://type10.de/sitemap.xml` respectively.

## Pre-launch checklist

- [ ] **Legal review** of the Privacy/Datenschutz template (`src/components/views/PrivacyPage.astro`) and Imprint by counsel. They are `noindex` until signed off.
- [ ] **AutoScout24 + RTL/TVNow** case studies — confirm real scope/metrics, or drop AutoScout24 to a logo-only mention (`src/content/caseStudies/{en,de}/autoscout24.md`).
- [ ] Confirm the **GA4 property** `G-VGW1F01QDH` is the right stream (or add a per-domain data stream); analytics only fires after consent.
- [ ] Verify legacy **301s** resolve (see middleware map) and run **Lighthouse** on home + a service + a case study + an article, both locales.
