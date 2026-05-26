// Regions where prior opt-in consent is required before non-essential storage
// (analytics) — used both for Google Consent Mode region-scoped defaults (Gtm.astro)
// and to decide whether the consent banner is shown (ConsentBanner.astro).
//
// EEA (EU-27 + Iceland, Liechtenstein, Norway) + United Kingdom (UK GDPR) +
// Switzerland (FADP). ISO 3166-1 alpha-2, matching Cloudflare's CF-IPCountry / trace.
// Everywhere else, analytics is granted by default and no banner appears.
//
// NOTE: this is a compliance decision — confirm the region set with counsel before
// launch (see DEPLOYMENT.md). Some jurisdictions (e.g. certain US states) have their
// own rules that may warrant adding later.
export const CONSENT_REQUIRED_REGIONS = [
  // EU-27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA (non-EU)
  'IS', 'LI', 'NO',
  // UK + Switzerland
  'GB', 'CH',
] as const;
