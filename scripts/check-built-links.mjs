import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!site) {
  console.error('Usage: node check-built-links.mjs SITE_DIRECTORY');
  process.exit(64);
}

const outputRoot = fs.existsSync(path.join(site, 'dist'))
  ? path.join(site, 'dist')
  : path.join(site, 'public');
const references = [];
const failures = [];

function walk(directory, callback) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, callback);
    else callback(full, entry.name);
  }
}

function targetFor(url) {
  const pathname = url.split(/[?#]/, 1)[0];
  if (!pathname.startsWith('/')) return null;
  const decoded = decodeURIComponent(pathname);
  if (decoded.endsWith('/')) return path.join(outputRoot, decoded, 'index.html');
  if (path.extname(decoded)) return path.join(outputRoot, decoded);
  return path.join(outputRoot, decoded, 'index.html');
}

if (!fs.existsSync(outputRoot)) {
  console.error(`Built output directory is missing: ${outputRoot}`);
  process.exit(1);
}

walk(outputRoot, (file, name) => {
  if (!name.endsWith('.html')) return;
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const url = match[1];
    if (url.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url)) continue;
    const target = targetFor(url);
    if (!target) continue;
    references.push({ file, url, target });
  }
});

for (const { file, url, target } of references) {
  if (!fs.existsSync(target)) {
    failures.push(`${path.relative(site, file)} -> ${url}`);
  }
}

if (failures.length) {
  console.error('Broken built-site references:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`Built-site reference check passed (${references.length} local references).`);
