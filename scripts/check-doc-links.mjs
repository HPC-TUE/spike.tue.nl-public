import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!site) {
  console.error('Usage: node check-doc-links.mjs SITE_DIRECTORY');
  process.exit(64);
}

const docsRoot = path.join(site, 'src/content/docs');
const publicRoot = path.join(site, 'public');
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) files.push(full);
  }
}

function routeExists(href) {
  const pathname = href.split(/[?#]/, 1)[0];
  if (pathname.startsWith('/downloads/')) return fs.existsSync(path.join(publicRoot, pathname));
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  const candidates = slug
    ? [path.join(docsRoot, slug + '.mdx'), path.join(docsRoot, slug, 'index.mdx')]
    : [path.join(docsRoot, 'index.mdx')];
  return candidates.some(fs.existsSync);
}

walk(docsRoot);
const missing = [];
const linkPattern = /\]\((\/[^)\s]+)\)/g;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(linkPattern)) {
    if (!routeExists(match[1])) missing.push(path.relative(site, file) + ' -> ' + match[1]);
  }
}

if (missing.length) {
  console.error('Broken internal documentation links:\n' + missing.join('\n'));
  process.exit(1);
}

console.log('Internal documentation links passed (' + files.length + ' files).');
