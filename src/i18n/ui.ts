import type { Locale, RouteKey } from './routes';

// UI string dictionary. Keep keys stable; add entries as components need them.
export const ui = {
  en: {
    'site.name': 'TYPE10 Media',
    'site.tagline': 'Powering a digitalized world',
    'nav.services': 'Services',
    'nav.industries': 'Industries',
    'nav.work': 'Work',
    'nav.technologies': 'Technologies',
    'nav.insights': 'Insights',
    'nav.about': 'About',
    'nav.team': 'Team',
    'nav.careers': 'Careers',
    'nav.contact': 'Contact',
    'nav.imprint': 'Imprint',
    'nav.privacy': 'Privacy',
    'lang.switch': 'Deutsch',
    'cta.contact': 'Get in touch',
    'breadcrumb.home': 'Home',
    'cs.client': 'Client',
    'cs.year': 'Year',
    'cs.industry': 'Industry',
    'cs.stack': 'Tech stack',
    'cs.visit': 'Visit website',
    'cs.related': 'Related work',
    'svc.related': 'Selected work',
    'svc.allWork': 'See all work',
    'svc.cta': 'Discuss your project',
    'cta.heading': "Let's talk about your project",
    'cta.text': "Tell us what you're building. We'll reply within a working day.",
  },
  de: {
    'site.name': 'TYPE10 Media',
    'site.tagline': 'Wir treiben eine digitalisierte Welt voran',
    'nav.services': 'Leistungen',
    'nav.industries': 'Branchen',
    'nav.work': 'Referenzen',
    'nav.technologies': 'Technologien',
    'nav.insights': 'Insights',
    'nav.about': 'Über uns',
    'nav.team': 'Team',
    'nav.careers': 'Karriere',
    'nav.contact': 'Kontakt',
    'nav.imprint': 'Impressum',
    'nav.privacy': 'Datenschutz',
    'lang.switch': 'English',
    'cta.contact': 'Kontakt aufnehmen',
    'breadcrumb.home': 'Start',
    'cs.client': 'Kunde',
    'cs.year': 'Jahr',
    'cs.industry': 'Branche',
    'cs.stack': 'Tech-Stack',
    'cs.visit': 'Website besuchen',
    'cs.related': 'Ähnliche Projekte',
    'svc.related': 'Ausgewählte Projekte',
    'svc.allWork': 'Alle Referenzen',
    'svc.cta': 'Projekt besprechen',
    'cta.heading': 'Sprechen wir über Ihr Projekt',
    'cta.text': 'Erzählen Sie uns, was Sie bauen. Wir antworten innerhalb eines Werktags.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['en'];

/** Returns a translator bound to a locale. Falls back to the key if missing. */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return ui[locale][key] ?? ui.en[key] ?? key;
  };
}

// Maps a nav label key to its route key, so the header can iterate one list.
export const navItems: { route: RouteKey; key: UIKey }[] = [
  { route: 'services', key: 'nav.services' },
  { route: 'industries', key: 'nav.industries' },
  { route: 'work', key: 'nav.work' },
  { route: 'technologies', key: 'nav.technologies' },
  { route: 'insights', key: 'nav.insights' },
  { route: 'about', key: 'nav.about' },
  { route: 'contact', key: 'nav.contact' },
];
