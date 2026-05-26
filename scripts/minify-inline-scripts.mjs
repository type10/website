import { transform } from 'esbuild';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Astro integration — minify the bodies of inline (`is:inline`) <script> tags in the
// built HTML and strip their comments. Astro/Vite already minify bundled scripts, but
// inline ones (the GTM + consent snippets) otherwise ship verbatim. External (`src`)
// scripts and JSON-LD / importmap blocks are left untouched.
const SCRIPT_RE = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
const SKIP_ATTRS = /\bsrc=|type\s*=\s*["']?(?:application\/(?:ld\+json|json)|importmap)/i;

async function replaceAsync(input, regex, fn) {
  const jobs = [];
  input.replace(regex, (match, ...args) => {
    jobs.push(fn(match, ...args));
    return match;
  });
  const results = await Promise.all(jobs);
  return input.replace(regex, () => results.shift());
}

async function collectHtml(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await collectHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** @returns {import('astro').AstroIntegration} */
export default function minifyInlineScripts() {
  return {
    name: 'minify-inline-scripts',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const files = await collectHtml(fileURLToPath(dir));
        let total = 0;
        for (const file of files) {
          const html = await readFile(file, 'utf8');
          let touched = false;
          const next = await replaceAsync(html, SCRIPT_RE, async (full, attrs, body) => {
            if (SKIP_ATTRS.test(attrs) || !body.trim()) return full;
            try {
              const { code } = await transform(body, { minify: true, loader: 'js' });
              touched = true;
              total++;
              return `<script${attrs}>${code.trim()}</script>`;
            } catch (err) {
              logger.warn(`left an inline script un-minified in ${file}: ${err.message}`);
              return full;
            }
          });
          if (touched) await writeFile(file, next);
        }
        logger.info(`minified ${total} inline script(s) across ${files.length} page(s)`);
      },
    },
  };
}
