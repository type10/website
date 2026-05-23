import type { APIRoute } from 'astro';
import { getSitemapEntries } from '../../lib/sitemap-entries';
import { publicUrl, alternatesFor } from '../../i18n/routes';

// German sitemap — built at /de/sitemap.xml, served at https://type10.de/sitemap.xml
// (the Cloudflare middleware maps type10.de/sitemap.xml -> /de/sitemap.xml).
// Lists type10.de URLs with reciprocal hreflang alternates to type10.com.
export const GET: APIRoute = async () => {
  const entries = await getSitemapEntries();
  const body = entries
    .map(({ key, sub }) => {
      const loc = publicUrl(key, 'de', sub);
      const alt = alternatesFor(key, sub);
      return (
        `<url><loc>${loc}</loc>` +
        `<xhtml:link rel="alternate" hreflang="en" href="${alt.en}"/>` +
        `<xhtml:link rel="alternate" hreflang="de" href="${alt.de}"/>` +
        `<xhtml:link rel="alternate" hreflang="x-default" href="${alt['x-default']}"/>` +
        `</url>`
      );
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
