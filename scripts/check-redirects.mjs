import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!site) {
  console.error('Usage: node check-redirects.mjs SITE_DIRECTORY');
  process.exit(64);
}

const config = fs.readFileSync(path.join(site, 'astro.config.mjs'), 'utf8');
const docsRoot = path.join(site, 'src', 'content', 'docs');
const outputRoot = fs.existsSync(path.join(site, 'dist'))
  ? path.join(site, 'dist')
  : fs.existsSync(path.join(site, 'public')) && fs.existsSync(path.join(site, 'public', '404.html'))
    ? path.join(site, 'public')
    : null;
const redirects = [...config.matchAll(/['"](\/[^'"]+)['"]\s*:\s*['"](\/[^'"]+)['"]/g)];
const missing = [];
for (const [, from, to] of redirects) {
  if (from === to) missing.push(from + ' redirects to itself');
  const slug = to.replace(/^\/+|\/+$/g, '');
  const candidates = slug
    ? [path.join(docsRoot, slug + '.mdx'), path.join(docsRoot, slug, 'index.mdx')]
    : [path.join(docsRoot, 'index.mdx')];
  if (!candidates.some(fs.existsSync)) missing.push(from + ' -> ' + to + ' (destination missing)');
  if (outputRoot) {
    const fromSlug = from.replace(/^\/+|\/+$/g, '');
    const builtRedirect = fromSlug
      ? path.join(outputRoot, fromSlug, 'index.html')
      : path.join(outputRoot, 'index.html');
    if (!fs.existsSync(builtRedirect)) {
      missing.push(from + ' -> ' + to + ' (built redirect page missing)');
    } else {
      const html = fs.readFileSync(builtRedirect, 'utf8');
      if (!html.includes(to)) missing.push(from + ' -> ' + to + ' (built redirect target missing)');
    }
  }
}

if (missing.length) {
  console.error('Redirect validation failures:\n' + missing.join('\n'));
  process.exit(1);
}

console.log('Redirect check passed (' + redirects.length + ' redirects).');
