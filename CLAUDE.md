# TYPE10 Media — website

Bilingual corporate site for TYPE10 Media GmbH (Munich software/cloud consultancy).
**One Astro codebase serves both domains:** `type10.com` (English) and `type10.de` (German).
Replaces two legacy sites (an Eleventy `.com` and a Jekyll `.de`, kept as read-only
migration sources at `../current_en` and `../current_de`).

## Commands

```bash
npm run dev        # English dev server (localhost:4321); fast iteration
npm run preview:cf # astro build + wrangler pages dev — BOTH domains via the real middleware
npm run build      # static build to dist/
npm run check      # astro check (type-check .astro + TS)
npm run check:seo  # post-build guard: canonical host + hreflang on every page (run after build)
```

`functions/` is type-checked separately: `npx tsc -p functions/tsconfig.json`.
After any change, run `npm run build` and `npm run check`; for SEO-affecting changes also
`npm run check:seo`. To preview German: `npm run preview:cf` then visit `?__lang=de` or
`curl -H "Host: type10.de" localhost:8788/...`.

## Architecture

- **Astro 6, `output: 'static'`, `trailingSlash: 'always'`.** No Tailwind — design tokens in
  `src/styles/tokens.css` + `global.css`, plus Astro scoped `<style>` per component.
  Self-hosted fonts (`@fontsource-variable/{sora,inter}`). React is available for islands but
  currently unused; the only JS is small inline scripts (consent banner, mobile-menu close).
- **i18n:** `defaultLocale: 'en'`, `locales: ['en','de']`, `prefixDefaultLocale: false`.
  English builds at the apex (`/services/`); German builds under `/de/` (`/de/leistungen/`).
- **Two-domain routing lives in `functions/_middleware.ts`** (Cloudflare Pages Function, runs
  before assets):
  - `type10.com` → English at apex; `/de/*` is 301'd to `type10.de`.
  - `type10.de` → the `/de/` tree is **rewritten** to the apex so URLs stay clean
    (`type10.de/leistungen/`). `/robots.txt` and `/sitemap.xml` resolve to their `/de/` variants;
    German 404 falls back to `/de/404/index.html`.
  - Legacy 301s (old Eleventy/Jekyll URLs → new) run first.
  - Previews (`*.pages.dev`/localhost) have no real host → `?__lang=de` opts into German.
- **`src/i18n/routes.ts` is the single source of truth** for the URL structure. Item slugs are
  **identical across locales**; only the section segment is localized (`services`↔`leistungen`,
  `work`↔`referenzen`, …). Helpers: `localizedPath` (in-site href), `buildPath` (physical `/de/…`),
  `publicUrl` / `alternatesFor` (absolute canonical + hreflang on the correct domain).
  **Never hardcode canonical/hreflang URLs** — derive them from here.

## Content

- Collections in `src/content.config.ts`: `services`, `caseStudies`, `industries`,
  `team`, `insights`. Files live at `src/content/<coll>/{en,de}/<slug>.md`.
- Every entry has `locale`, `slug` (the cross-locale join key, same in both languages), and an
  optional `seo` object. The glob loader uses a custom `generateId` that keeps the locale folder —
  **don't remove it**, or `en/<slug>` and `de/<slug>` collide and one locale silently disappears.
- **Pages are thin wrappers.** EN under `src/pages/...`; DE under `src/pages/de/...` with localized
  folder names (`leistungen`, `referenzen`, `branchen`, `produkte`, `ueber-uns`,
  `kontakt`, `impressum`, `datenschutz`, `karriere`). Both import the same view component from
  `src/components/views/` and pass `locale`. `[slug].astro` filters the collection by locale.
- `Base.astro` wraps `Seo` + `Header` + `Footer` + `ConsentBanner`. Pass it `locale`, `routeKey`,
  and `sub` (= the item slug, for detail pages) so SEO/hreflang resolve correctly.
- UI strings + nav list: `src/i18n/ui.ts`. Company facts (address, GA id, etc.): `src/i18n/site.ts`.
- Drafting both EN + DE is expected; client facts/metrics are supplied by the user.

## SEO

- Per-locale sitemaps are hand-rolled (`src/pages/sitemap.xml.ts`, `src/pages/de/sitemap.xml.ts`) —
  `@astrojs/sitemap` can't express the two-domain + localized-slug setup. Per-host `robots.txt`
  lives at `public/robots.txt` and `public/de/robots.txt`.
- JSON-LD: `Organization` (home), `BreadcrumbList` (Breadcrumbs), `Article` (insights).
- **Vitao (vitao.io) links are `dofollow` and contextual only** — product page, Vitao case study,
  `career-hr-tech` industry, `product-engineering` service, the career-tech blog posts, and the
  homepage band. Don't add `nofollow`; don't stuff links sitewide.
- GA4 (`G-VGW1F01QDH`) loads **only after consent** (`ConsentBanner.astro`).

## Gotchas (these bit us)

- An external linter/formatter reformats files between edits — **re-Read a file right before
  editing** if an Edit fails with "not read"/"modified since read".
- `trailingSlash: 'always'` builds nested pages to `<route>/index.html` (e.g. the German 404 is
  `/de/404/index.html`, not `/de/404.html`) — the middleware accounts for this.
- CSS that sets `display:` on an element also toggled via the `[hidden]` attribute must add an
  explicit `…[hidden]{display:none}` rule (class+attr beats bare `[hidden]`). This is why the
  consent banner has one.
- Customer logos were 250×250 squares with transparent padding; trimmed via
  `scripts/trim-logos.mjs` (reads originals in `../current_en`, writes `public/assets/customers/`).

## Open items before launch

See `DEPLOYMENT.md` for the full checklist + Cloudflare Pages/DNS setup. Headlines:
- Privacy/Datenschutz + Imprint are a template — **needs legal review** (currently `noindex`).
- AutoScout24 (and RTL+/TVNow) case studies need real scope/metrics, or drop AutoScout24 to logo-only.
- Confirm the GA4 stream; replace the Vitao placeholder images (`public/assets/work/2024-vitao-*.svg`) with real screenshots; register two Search Console properties.
