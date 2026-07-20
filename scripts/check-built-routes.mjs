import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!site) {
  console.error('Usage: node check-built-routes.mjs SITE_DIRECTORY');
  process.exit(64);
}

const outputRoot = fs.existsSync(path.join(site, 'dist'))
  ? path.join(site, 'dist')
  : path.join(site, 'public');
const docsRoot = path.join(site, 'src', 'content', 'docs');
const failures = [];
let documents = 0;

function walk(directory, callback) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, callback);
    else callback(full, entry.name);
  }
}

function expectedOutput(document) {
  const relative = path.relative(docsRoot, document).replaceAll(path.sep, '/');
  if (relative === '404.md' || relative === '404.mdx') return null;
  if (relative === 'index.mdx') return path.join(outputRoot, 'index.html');
  const route = relative
    .replace(/\/index\.mdx$/, '')
    .replace(/\.mdx$/, '');
  return path.join(outputRoot, route, 'index.html');
}

if (!fs.existsSync(outputRoot)) {
  console.error(`Built output directory is missing: ${outputRoot}`);
  process.exit(1);
}

walk(docsRoot, (document, name) => {
  if (!name.endsWith('.mdx')) return;
  documents += 1;
  const output = expectedOutput(document);
  if (!output) return;
  if (!fs.existsSync(output)) {
    failures.push(`${path.relative(site, document)} -> missing ${path.relative(site, output)}`);
  }
});

if (!fs.existsSync(path.join(outputRoot, '404.html'))) {
  failures.push('built output is missing 404.html');
}

if (failures.length) {
  console.error('Built route smoke-test failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`Built route smoke test passed (${documents} documentation routes plus 404).`);
