// Post-build SEO guard: asserts every page's canonical points at the correct
// domain for its locale (the top risk of the two-domain setup). Run after build.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'dist';

function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    out = statSync(p).isDirectory() ? out.concat(walk(p)) : p.endsWith('.html') ? [...out, p] : out;
  }
  return out;
}

const files = walk(ROOT);
let errors = 0;

for (const f of files) {
  const rel = relative(ROOT, f);
  const html = readFileSync(f, 'utf8');
  const isDe = rel === 'de.html' || rel === 'de/index.html' || rel.startsWith('de/');
  const expected = isDe ? 'type10.de' : 'type10.com';

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonical) {
    console.error(`✗ ${rel}: no canonical`);
    errors++;
    continue;
  }
  const host = new URL(canonical[1]).host;
  if (host !== expected) {
    console.error(`✗ ${rel}: canonical host ${host}, expected ${expected} (${canonical[1]})`);
    errors++;
  }
  // hreflang must reference both domains exactly once each
  if (!html.includes('hreflang="en"') || !html.includes('hreflang="de"')) {
    console.error(`✗ ${rel}: missing hreflang alternates`);
    errors++;
  }
}

console.log(`Checked ${files.length} HTML pages — ${errors} issue(s).`);
process.exit(errors ? 1 : 0);
