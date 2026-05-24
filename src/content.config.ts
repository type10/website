import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// glob() defaults to a basename-only id, which collides between en/<slug> and
// de/<slug> (one locale silently overwrites the other). Keep the locale folder
// in the id so both locales load as distinct entries.
const i18nGlob = (folder: string) =>
  glob({
    base: `./src/content/${folder}`,
    pattern: '{en,de}/**/*.{md,mdx}',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  });

// Bilingual content. Each entry declares its `locale` and a `slug` that is IDENTICAL
// across locales (the cross-language join key). Only the section segment is localized
// (services↔leistungen, work↔referenzen, …), so hreflang/canonical can be derived from
// routeKey + slug via src/i18n/routes.ts. Files live under <collection>/{en,de}/<slug>.md.

const locale = z.enum(['en', 'de']);

const seo = z
  .object({
    title: z.string().optional(),
    description: z.string(),
    ogImage: z.string().optional(),
    noindex: z.boolean().default(false),
  })
  .optional();

const services = defineCollection({
  loader: i18nGlob('services'),
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    icon: z.string().optional(),
    order: z.number().default(0),
    featured: z.boolean().default(true),
    relatedCaseStudies: z.array(z.string()).default([]),
    seo,
  }),
});

const caseStudies = defineCollection({
  loader: i18nGlob('caseStudies'),
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    client: z.string(),
    clientUrl: z.string().url().optional(),
    industry: z.string().optional(), // industry slug
    years: z.string().optional(),
    heroImage: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    summary: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    seo,
  }),
});

const industries = defineCollection({
  loader: i18nGlob('industries'),
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    heroImage: z.string().optional(),
    caseStudies: z.array(z.string()).default([]), // case-study slugs
    services: z.array(z.string()).default([]), // service slugs
    order: z.number().default(0),
    seo,
  }),
});

const team = defineCollection({
  loader: i18nGlob('team'),
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(), // = name (kept for the shared base shape)
    name: z.string(),
    jobtitle: z.string(),
    image: z.string().optional(),
    order: z.number().default(0),
    links: z
      .object({
        github: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        xing: z.string().url().optional(),
        twitter: z.string().url().optional(),
      })
      .default({}),
    skillProfile: z.string().optional(),
    seo,
  }),
});

const insights = defineCollection({
  loader: i18nGlob('insights'),
  schema: z.object({
    locale,
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(), // team slug
    cluster: z.enum(['career-tech', 'cloud-microservices', 'streaming-ott', 'company']),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    relatedProduct: z.string().optional(), // e.g. "vitao" → renders a Vitao callout
    draft: z.boolean().default(false),
    seo,
  }),
});

export const collections = { services, caseStudies, industries, team, insights };
