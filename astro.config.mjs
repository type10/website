// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// EN is served at the apex of type10.com; DE is built under /de/ and served at the
// apex of type10.de via a Cloudflare Pages Function (see functions/_middleware.ts).
// `site` is the English canonical base; DE canonicals/hreflang are computed per-page
// from src/i18n/routes.ts (publicUrl/alternatesFor) against https://type10.de.
export default defineConfig({
  site: 'https://type10.com',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [react(), mdx(), sitemap()],
});
