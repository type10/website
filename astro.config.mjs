// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import minifyInlineScripts from './scripts/minify-inline-scripts.mjs';

// EN is served at the apex of type10.com; DE is built under /de/ and served at the
// apex of type10.de via a Cloudflare Pages Function (see functions/_middleware.ts).
// `site` is the English canonical base; DE canonicals/hreflang are computed per-page
// from src/i18n/routes.ts (publicUrl/alternatesFor) against https://type10.de.
export default defineConfig({
  site: 'https://type10.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  // Sitemaps are hand-rolled per locale/domain in src/pages/sitemap.xml.ts and
  // src/pages/de/sitemap.xml.ts — @astrojs/sitemap can't express the two-domain
  // + localized-slug structure (it would emit type10.com/de/... URLs).
  integrations: [react(), mdx(), minifyInlineScripts()],
});
