// Single source of truth for the bilingual URL structure.
//
// English lives at the apex of type10.com (no locale prefix).
// German is BUILT under /de/ (to avoid slug collisions) but is SERVED at the apex
// of type10.de — a Cloudflare Pages Function rewrites `type10.de/leistungen/` to the
// `/de/leistungen/` build artifact (see functions/_middleware.ts). Therefore:
//   - in-site DE links use the apex form (`/leistungen/`)   -> localizedPath()
//   - DE page files are authored under src/pages/de/...      -> buildPath()
//   - canonical / hreflang / language switch use absolute, cross-domain URLs -> publicUrl()

export const locales = ['en', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const domains: Record<Locale, string> = {
  en: 'https://type10.com',
  de: 'https://type10.de',
};

export const ogLocale: Record<Locale, string> = {
  en: 'en_US',
  de: 'de_DE',
};

// Logical page key -> localized path segment per locale.
export const routes = {
  home: { en: '', de: '' },
  services: { en: 'services', de: 'leistungen' },
  industries: { en: 'industries', de: 'branchen' },
  work: { en: 'work', de: 'referenzen' },
  technologies: { en: 'technologies', de: 'technologien' },
  insights: { en: 'insights', de: 'insights' },
  vitao: { en: 'products/vitao', de: 'produkte/vitao' },
  about: { en: 'about', de: 'ueber-uns' },
  team: { en: 'team', de: 'team' },
  careers: { en: 'careers', de: 'karriere' },
  contact: { en: 'contact', de: 'kontakt' },
  imprint: { en: 'imprint', de: 'impressum' },
  privacy: { en: 'privacy', de: 'datenschutz' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;

const wrap = (seg: string) => (seg === '' ? '/' : `/${seg}/`);

const segment = (key: RouteKey, locale: Locale, sub?: string) => {
  const base = routes[key][locale];
  if (!sub) return base;
  return base ? `${base}/${sub}` : sub;
};

/** In-site (same-locale) href. DE returns the apex form; the edge maps it to /de. */
export function localizedPath(key: RouteKey, locale: Locale, sub?: string): string {
  return wrap(segment(key, locale, sub));
}

/** Physical build path (DE prefixed with /de). Use when an href must hit the real file. */
export function buildPath(key: RouteKey, locale: Locale, sub?: string): string {
  const p = wrap(segment(key, locale, sub));
  return locale === 'de' ? `/de${p}` : p;
}

/** Absolute public URL on the correct domain — for canonical, hreflang, og:url, switcher. */
export function publicUrl(key: RouteKey, locale: Locale, sub?: string): string {
  return domains[locale] + localizedPath(key, locale, sub);
}

/** hreflang alternates map for a given logical page. */
export function alternatesFor(key: RouteKey, sub?: string) {
  return {
    en: publicUrl(key, 'en', sub),
    de: publicUrl(key, 'de', sub),
    'x-default': publicUrl(key, 'en', sub),
  } as const;
}

export const otherLocale = (locale: Locale): Locale => (locale === 'en' ? 'de' : 'en');
