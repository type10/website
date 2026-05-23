/// <reference types="@cloudflare/workers-types" />

// Cloudflare Pages Function — runs on every request before static assets resolve.
// One build serves both domains:
//   - type10.com  -> English at the apex; any /de/* is 301'd to type10.de
//   - type10.de   -> German tree (built under /de/) served at the apex via rewrite
//   - *.pages.dev / localhost previews -> opt into German with ?__lang=de (cookie-persisted)
//
// Keep this in sync with src/i18n/routes.ts (the DE_PREFIX and domain mapping).

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
  target.pathname = DE_PREFIX + (url.pathname === '/' ? '/' : url.pathname);
  return target;
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const host = (request.headers.get('host') ?? '').toLowerCase();
  const path = url.pathname;

  // ---- type10.de : German served at the apex ----
  if (host.endsWith('type10.de')) {
    if (path === '/robots.txt') {
      return env.ASSETS.fetch(new URL('/de/robots.txt', url));
    }
    // Collapse any exposed /de/* to the clean apex URL.
    if (path === DE_PREFIX || path.startsWith(`${DE_PREFIX}/`)) {
      const target = new URL(url);
      target.pathname = path.slice(DE_PREFIX.length) || '/';
      return Response.redirect(target.toString(), 301);
    }
    if (!isAssetPath(path)) {
      return env.ASSETS.fetch(new Request(addDePrefix(url), request));
    }
    return next();
  }

  // ---- type10.com : English at the apex, no duplicate German ----
  if (host.endsWith('type10.com')) {
    if (path === DE_PREFIX || path.startsWith(`${DE_PREFIX}/`)) {
      const target = new URL(url);
      target.hostname = 'type10.de';
      target.pathname = path.slice(DE_PREFIX.length) || '/';
      return Response.redirect(target.toString(), 301);
    }
    return next();
  }

  // ---- previews (*.pages.dev / localhost) : ?__lang=de to inspect the German tree ----
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

  return next();
};
