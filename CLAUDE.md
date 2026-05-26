# TYPE10 Media — website

Bilingual corporate site for TYPE10 Media GmbH (Munich software/cloud consultancy).
**One Astro codebase serves both domains:** `type10.com` (English) and `type10.de` (German).
Replaces two legacy sites (an Eleventy `.com` and a Jekyll `.de`, kept as read-only
migration sources at `../current_en` and `../current_de`).

## Commands

```bash
npm run dev        # English dev server (localhost:4321); fast iteration
npm run preview:cf # astro build + wrangler dev — BOTH domains via the real routing Worker
npm run build      # static build to dist/
npm run check      # astro check (.astro + TS) AND tsc on worker/ (the routing Worker)
npm run check:seo  # post-build guard: canonical host + hreflang on every page (run after build)
```

The routing Worker (`worker/`) uses Workers types, not Astro/DOM types, so it has its own
`worker/tsconfig.json` (excluded from the root config) and is type-checked by `npm run check`.
After any change, run `npm run build` and `npm run check`; for SEO-affecting changes also
`npm run check:seo`. To preview German: `npm run preview:cf` then visit `?__lang=de` or
`curl -H "Host: type10.de" localhost:8788/...`.

> **Deployment is a Cloudflare *Worker* with static assets, not Pages.** `wrangler.jsonc`
> sets `assets.run_worker_first: true` so `worker/index.ts` runs on every request and can do
> host-based routing. Pages Functions (`functions/`) do **not** run in this model — that's why
> the routing lives in `worker/`. Deployed via GitHub auto-build (Workers Builds).

## Architecture

- **Astro 6, `output: 'static'`, `trailingSlash: 'never'`, `build.format: 'file'`** (flat
  `<route>.html`, no trailing slash). No Tailwind — design tokens in
  `src/styles/tokens.css` + `global.css`, plus Astro scoped `<style>` per component.
  Self-hosted fonts: `@fontsource/sansation` (display, 400/700) + `@fontsource-variable/inter`
  (body). React is available for islands but
  currently unused; the only JS is small inline scripts (consent banner, mobile-menu close).
- **i18n:** `defaultLocale: 'en'`, `locales: ['en','de']`, `prefixDefaultLocale: false`.
  English builds at the apex (`/services/`); German builds under `/de/` (`/de/leistungen/`).
- **Two-domain routing lives in `worker/index.ts`** (the Worker entry; runs on every request
  via `run_worker_first`, then delegates to `env.ASSETS.fetch()`):
  - `www.*` → 301 to the bare apex (canonical host).
  - `type10.com` → English at apex; `/de/*` is 301'd to `type10.de`.
  - `type10.de` → the `/de/` tree is **rewritten** to the apex so URLs stay clean
    (`type10.de/leistungen`). `/robots.txt` and `/sitemap.xml` resolve to their `/de/` variants;
    German 404 falls back to `/de/404.html`.
  - Legacy 301s (old Eleventy/Jekyll URLs → new) run first.
  - Previews (`*.workers.dev`/localhost) have no real host → `?__lang=de` opts into German.
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
- `Base.astro` wraps `Gtm` (analytics, first in `<head>`) + `Seo` + `Header` + `Footer` +
  `ConsentBanner`. Pass it `locale`, `routeKey`,
  and `sub` (= the item slug, for detail pages) so SEO/hreflang resolve correctly.
- UI strings + nav list: `src/i18n/ui.ts`. Company facts (address, GTM container IDs, etc.): `src/i18n/site.ts`.
- Drafting both EN + DE is expected; client facts/metrics are supplied by the user.

## SEO

- Per-locale sitemaps are hand-rolled (`src/pages/sitemap.xml.ts`, `src/pages/de/sitemap.xml.ts`) —
  `@astrojs/sitemap` can't express the two-domain + localized-slug setup. Per-host `robots.txt`
  lives at `public/robots.txt` and `public/de/robots.txt`.
- JSON-LD: `Organization` (home), `BreadcrumbList` (Breadcrumbs), `Article` (insights).
- **Vitao (vitao.io) links are `dofollow` and contextual only** — product page, Vitao case study,
  `career-hr-tech` industry, `product-engineering` service, the career-tech blog posts, and the
  homepage band. Don't add `nofollow`; don't stuff links sitewide.
- **Analytics — one GTM container per domain, each feeding its own GA4 property:**
  `type10.de` → `GTM-KM5RLZ` → `G-VGW1F01QDH`; `type10.com` → `GTM-WKZXF2` → `G-X9N0VWSKPR`.
  Container IDs are in `src/i18n/site.ts` (`analytics.gtmId`); the GA4 Measurement IDs are configured
  *inside* each container (Google Tag, fired on the GTM "Initialization" trigger), **not** in the repo —
  keep the two containers configured identically. Google **Consent Mode v2 (advanced)** is declared in
  `Gtm.astro` *before* the container loads: EEA+UK+CH (`i18n/consent.ts`) default to denied and wait for
  the banner (`ConsentBanner.astro`); rest-of-world gets `analytics_storage` granted. We only ever grant
  `analytics_storage` (ad signals stay denied), so GA4/GTM warnings about *ad* consent ("Consent missing
  for EEA users", "0% consent rate") are expected, not bugs — and they're **per-property**, so check both
  consoles. The tag loads on every page (cookieless modeled pings while denied); it does **not** wait for
  consent. Confirm a live `collect` hit carries `gcs`/`gcd` params to verify consent mode is firing.

## Gotchas (these bit us)

- An external linter/formatter reformats files between edits — **re-Read a file right before
  editing** if an Edit fails with "not read"/"modified since read".
- `trailingSlash: 'never'` + `build.format: 'file'` builds flat `<route>.html` (the German 404
  is `/de/404.html`). The Worker also 301-strips any trailing slash, and `wrangler.jsonc` sets
  `html_handling: 'drop-trailing-slash'` so the asset layer agrees.
- CSS that sets `display:` on an element also toggled via the `[hidden]` attribute must add an
  explicit `…[hidden]{display:none}` rule (class+attr beats bare `[hidden]`). This is why the
  consent banner has one.
- Customer logos were 250×250 squares with transparent padding; trimmed via
  `scripts/trim-logos.mjs` (reads originals in `../current_en`, writes `public/assets/customers/`).

## Open items before launch

See `DEPLOYMENT.md` for the full checklist + Cloudflare Workers/DNS setup. Headlines:
- Privacy/Datenschutz + Imprint are a template — **needs legal review** (currently `noindex`).
- AutoScout24 (and RTL+/TVNow) case studies need real scope/metrics, or drop AutoScout24 to logo-only.
- Replace the Vitao placeholder images (`public/assets/work/2024-vitao-*.svg`) with real screenshots; register two Search Console properties. (GA4 + Consent Mode v2 are wired and verified live on both domains — see SEO section.)
