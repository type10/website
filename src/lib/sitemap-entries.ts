import { getCollection } from 'astro:content';
import type { RouteKey } from '../i18n/routes';

export interface SitemapEntry {
  key: RouteKey;
  sub?: string;
}

// The set of indexable logical pages, identical across locales (slugs match).
// Excludes imprint/privacy (noindex). Used by both per-locale sitemaps.
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const staticKeys: RouteKey[] = [
    'home',
    'services',
    'industries',
    'work',
    'insights',
    'vitao',
    'about',
    'team',
    'careers',
    'contact',
  ];
  const entries: SitemapEntry[] = staticKeys.map((key) => ({ key }));

  const collections: { coll: 'services' | 'caseStudies' | 'industries' | 'insights'; key: RouteKey }[] =
    [
      { coll: 'services', key: 'services' },
      { coll: 'caseStudies', key: 'work' },
      { coll: 'industries', key: 'industries' },
      { coll: 'insights', key: 'insights' },
    ];

  for (const { coll, key } of collections) {
    const items = await getCollection(
      coll,
      (e: { data: { locale: string; slug: string; draft?: boolean; seo?: { noindex?: boolean } } }) =>
        e.data.locale === 'en' && !e.data.draft && !e.data.seo?.noindex
    );
    for (const it of items) entries.push({ key, sub: it.data.slug });
  }

  return entries;
}
