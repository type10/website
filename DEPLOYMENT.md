# Deployment — TYPE10 Media website

One Astro project serves **both** type10.com (English) and type10.de (German) from a
single Cloudflare **Worker with static assets** (not Pages). The Worker entry
(`worker/index.ts`) does the host-based routing, legacy redirects, www→apex, and per-host
`robots.txt` / `sitemap.xml`; the built `dist/` is uploaded as the Worker's static assets.

> **Why a Worker and not Pages?** The production URL is `*.workers.dev` and config lives in
> `wrangler.jsonc`. Pages Functions (`functions/`) are **ignored** in this model — that's why
> the routing logic is a Worker `fetch` handler, gated by `assets.run_worker_first: true` so it
> runs on every request *before* static assets resolve. (If you ever see English on type10.de
> again, `run_worker_first` is the first thing to check.)

## Cloudflare project settings (Workers Builds / GitHub auto-build)

The Worker `type10-website` is built & deployed automatically on push to `TYPE10/website`.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` (reads `wrangler.jsonc`) |
| Root directory | `site` |
| Node version | `22` — set `NODE_VERSION` if the default is older |

`wrangler.jsonc` declares `main: worker/index.ts`, `assets.directory: ./dist`, the `ASSETS`
binding, and `run_worker_first: true`. `public/_headers` is carried into `dist/` and honored by
the asset server. No secrets/env vars are required.

Local equivalent: `npm run cloudflare:deploy` (= `astro build && wrangler deploy`).

## Custom domains

All four are attached to the Worker under **Worker → Settings → Domains & Routes → Custom Domains**:

- `type10.com` and `www.type10.com`
- `type10.de` and `www.type10.de`

`www → apex` is handled **in the Worker** (`worker/index.ts`, first thing it does), so no separate
Cloudflare Redirect Rule is needed. (Keep the `www` custom domains attached so TLS is issued for
them and the Worker can receive + redirect the request.)

### DNS / cutover

1. Both zones must be on **Cloudflare nameservers**.
2. When attaching each Custom Domain to the Worker, Cloudflare needs to *manage* the record — if
   the apex/`www` already has an imported `A`/`AAAA`/`CNAME`, delete that record first (leave
   `MX` / SPF·DKIM·DMARC `TXT` / verification records untouched), then add the Custom Domain.
3. After propagation, retire the old repos (`type10/type10.github.io`, `type10/type10de.github.io`).

## How routing works (worker/index.ts)

- `www.*` → **301** to the bare apex, preserving path + query.
- `type10.com/*` → English at the apex. `/de/*` is **301**'d to `type10.de`.
- `type10.de/*` → the German tree (built under `/de/`) is **rewritten** to the apex, so URLs stay clean (`type10.de/leistungen`). `/robots.txt` and `/sitemap.xml` resolve to their `/de/` variants; a German miss falls back to `/de/404.html`.
- **Legacy 301s** (old Eleventy/Jekyll URLs) run first: `/portfolio/<old>/ → /work|/referenzen/<new>`, old service slugs → new, `/blog/* → /insights`.
- Previews on `*.workers.dev` / localhost have no real host: append `?__lang=de` to view the German tree (cookie-persisted).

## SEO files

- `public/robots.txt` (type10.com) → `Sitemap: https://type10.com/sitemap.xml`
- `public/de/robots.txt` (type10.de) → `Sitemap: https://type10.de/sitemap.xml`
- `src/pages/sitemap.xml.ts` / `src/pages/de/sitemap.xml.ts` — per-locale sitemaps with reciprocal `hreflang`, each listing its own domain's URLs.

## Local preview

- Fast EN iteration: `npm run dev` → http://localhost:4321/
- Full bilingual + routing Worker: `npm run preview:cf` (= `astro build && wrangler dev --port 8788`)
  - `curl -H "Host: type10.de" http://localhost:8788/leistungen` (German at apex)
  - `curl -H "Host: www.type10.com" -I http://localhost:8788/services` (expect 301 → apex)
  - `http://localhost:8788/?__lang=de` (German tree in a browser)

## Post-deploy: Search Console

Register **two** properties — `https://type10.com` and `https://type10.de` — and submit
`https://type10.com/sitemap.xml` and `https://type10.de/sitemap.xml` respectively.

## Analytics & consent (Google Tag Manager)

Each domain has its **own GTM container feeding its own GA4 property** — this is intentional
(analytics kept separate per market), not a duplicate:

| Domain | GTM container | GA4 property |
|---|---|---|
| `type10.de` | `GTM-KM5RLZ` | `G-VGW1F01QDH` |
| `type10.com` | `GTM-WKZXF2` | `G-X9N0VWSKPR` |

- Container IDs live in `src/i18n/site.ts` (`analytics.gtmId`). The **GA4 Measurement IDs are
  configured inside each container** (a Google Tag on the GTM "Initialization – All Pages" trigger),
  **not** in the repo — keep both containers configured identically.
- Google **Consent Mode v2 (advanced)** is declared in `src/components/Gtm.astro` *before* the
  container loads: EEA+UK+CH (`src/i18n/consent.ts`) default to denied and wait for the banner
  (`src/components/ConsentBanner.astro`); rest-of-world gets `analytics_storage` granted.
- We **only ever grant `analytics_storage`** (ad signals stay denied by design). So GA4/GTM warnings
  about *ad* consent — "Consent missing for EEA users", container-quality "0% consent rate" — are
  expected, not bugs. They're **per-property**, so check both consoles.
- **To verify consent mode is live:** on each domain, DevTools → Network → the GA4 `collect` request
  should carry `gcs=` (e.g. `G101` = ad denied / analytics granted) and `gcd=`. If present, consent
  mode is firing; a lingering "consent missing" card is just trailing data and clears within ~a week.
