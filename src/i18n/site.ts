// Shared company facts (legal, contact, analytics, social). Single source of truth
// for the Imprint/Impressum, footer, structured data, and the GA4 loader.
export const company = {
  legalName: 'TYPE10 Media GmbH',
  founder: 'Christian Neuhäuser',
  email: 'info@type10.com',
  phone: '+49 (89) 4161 4848-0',
  phoneE164: '+4989416148480',
  fax: '+49 (89) 4161 4848-9',
  address: {
    street: 'Einseleweg 1',
    postalCode: '81377',
    city: 'München',
    country: 'DE',
  },
  registration: {
    court: 'Amtsgericht München',
    hrb: 'HRB 205083',
    vatId: 'DE289079639',
  },
  social: {
    twitter: '@type10media',
  },
  analytics: {
    gtmId: { en: 'GTM-WKZXF2', de: 'GTM-KM5RLZ' } as Record<'en' | 'de', string>,
  },
} as const;
