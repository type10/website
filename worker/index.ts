/// <reference types="@cloudflare/workers-types" />

// Cloudflare Worker (Static Assets) entry — runs on EVERY request because
// wrangler.jsonc sets assets.run_worker_first = true. It does the host-based
// routing, legacy redirects, and per-host robots.txt / sitemap.xml, then hands
// off to the static asset server via env.ASSETS.fetch().
//
// One build serves both domains:
//   - www.*       -> 301 to the bare apex (canonical host)
//   - type10.com  -> English at the apex; any /de/* is 301'd to type10.de
//   - type10.de   -> German tree (built under /de/) served at the apex via rewrite
//   - previews (*.workers.dev / localhost) -> opt into German with ?__lang=de (cookie-persisted)
//
// Keep this in sync with src/i18n/routes.ts (the DE_PREFIX and domain mapping).
// NOTE: this replaces the old Pages Function (functions/_middleware.ts) — Pages
// Functions are ignored by a Workers-with-static-assets deployment.

interface Env {
  ASSETS: Fetcher;
}

const DE_PREFIX = '/de';

// Static assets are shared at the root for both languages and must never be rewritten.
const isAssetPath = (path: string): boolean =>
  path.startsWith('/_astro/') ||
  path.startsWith('/assets/') ||
  path.startsWith('/fonts/') ||
  /\.[a-z0-9]+$/i.test(path); // anything with a file extension (.css/.js/.png/.xml/.txt/...)

const addDePrefix = (url: URL): URL => {
  const target = new URL(url);
  target.pathname = url.pathname === '/' ? DE_PREFIX : DE_PREFIX + url.pathname;
  return target;
};

// 301 map from the old Eleventy (.com) / Jekyll (.de) URLs to the new structure.
// Returns the new apex path on the SAME host, or null if no redirect applies.
function legacyTarget(host: string, path: string): string | null {
  if (host.endsWith('type10.com')) {
    const work: Record<string, string> = {
      'maxdome-streaming-platform': 'maxdome',
      'check24-pkv': 'check24-pkv',
      autoscout24: 'autoscout24',
      'rtl-tvnow': 'rtl-tvnow',
      'tvnow-streaming-platform': 'rtl-tvnow',
      'organizeme-platform': 'organizeme',
      'songpier-studio': 'songpier',
      'type10-doodlestory': 'doodlestory',
      'lusini-marketplace': 'lusini',
    };
    const services: Record<string, string> = {
      automation: 'cloud-devops',
      operations: 'cloud-devops',
      distributed: 'backend-microservices',
      databases: 'backend-microservices',
      frontends: 'frontend-web',
      blockchain: 'blockchain-web3',
    };
    const portfolio = path.match(/^\/portfolio\/([^/]+)\/?$/);
    if (portfolio) return work[portfolio[1]] ? `/work/${work[portfolio[1]]}` : '/work';
    if (path === '/portfolio' || path === '/portfolio/') return '/work';
    const svc = path.match(/^\/services\/([^/]+)\/?$/);
    if (svc && services[svc[1]]) return `/services/${services[svc[1]]}`;
    return null;
  }
  if (host.endsWith('type10.de')) {
    const work: Record<string, string> = {
      'maxdome-steaming-platform': 'maxdome',
      'check24-pkv-vergleich': 'check24-pkv',
      'lusini-marketplace': 'lusini',
      organizeme: 'organizeme',
      'songpier-studio': 'songpier',
      'type10-doodlestory': 'doodlestory',
    };
    const portfolio = path.match(/^\/portfolio\/([^/]+)\/?$/);
    if (portfolio) return work[portfolio[1]] ? `/referenzen/${work[portfolio[1]]}` : '/referenzen';
    if (path === '/portfolio' || path === '/portfolio/') return '/referenzen';
    if (path === '/blog' || path.startsWith('/blog/')) return '/insights';
    return null;
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = (request.headers.get('host') ?? url.hostname).toLowerCase();
    const path = url.pathname;

    // ---- www -> apex (canonical host), preserving path + query ----
    // Runs first so every later host check sees the bare apex.
    if (host.startsWith('www.')) {
      const target = new URL(url);
      target.hostname = host.slice('www.'.length);
      return Response.redirect(target.toString(), 301);
    }

    // ---- legacy 301 redirects from the old sites (run before locale routing) ----
    const legacy = legacyTarget(host, path);
    if (legacy && legacy !== path) {
      const target = new URL(url);
      target.pathname = legacy;
      target.search = '';
      return Response.redirect(target.toString(), 301);
    }

    if (path !== '/' && path.endsWith('/') && !isAssetPath(path)) {
      const target = new URL(url);
      target.pathname = path.replace(/\/+$/, '');
      return Response.redirect(target.toString(), 301);
    }

    // ---- type10.de : German served at the apex ----
    if (host.endsWith('type10.de')) {
      // Root files that exist per-locale: serve the German variant on type10.de.
      if (path === '/robots.txt' || path === '/sitemap.xml') {
        return env.ASSETS.fetch(new URL('/de' + path, url));
      }
      // Collapse any exposed /de/* to the clean apex URL.
      if (path === DE_PREFIX || path.startsWith(`${DE_PREFIX}/`)) {
        const target = new URL(url);
        target.pathname = path.slice(DE_PREFIX.length) || '/';
        return Response.redirect(target.toString(), 301);
      }
      if (!isAssetPath(path)) {
        const res = await env.ASSETS.fetch(new Request(addDePrefix(url), request));
        if (res.status === 404) {
          const de404 = await env.ASSETS.fetch(new URL('/de/404.html', url));
          return new Response(de404.body, { status: 404, headers: de404.headers });
        }
        return res;
      }
      return env.ASSETS.fetch(request);
    }

    // ---- type10.com : English at the apex, no duplicate German ----
    if (host.endsWith('type10.com')) {
      if (path === DE_PREFIX || path.startsWith(`${DE_PREFIX}/`)) {
        const target = new URL(url);
        target.hostname = 'type10.de';
        target.pathname = path.slice(DE_PREFIX.length) || '/';
        return Response.redirect(target.toString(), 301);
      }
      return env.ASSETS.fetch(request);
    }

    // ---- previews (*.workers.dev / localhost) : ?__lang=de to inspect the German tree ----
    const cookie = request.headers.get('cookie') ?? '';
    const wantsDe =
      url.searchParams.get('__lang') === 'de' || /(?:^|;\s*)__lang=de\b/.test(cookie);
    if (wantsDe && !isAssetPath(path) && !path.startsWith(DE_PREFIX)) {
      const res = await env.ASSETS.fetch(new Request(addDePrefix(url), request));
      if (url.searchParams.get('__lang') === 'de') {
        const out = new Response(res.body, res);
        out.headers.append('set-cookie', '__lang=de; Path=/; SameSite=Lax');
        return out;
      }
      return res;
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
