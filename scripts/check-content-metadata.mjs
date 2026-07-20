import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!site) {
  console.error('Usage: node check-content-metadata.mjs SITE_DIRECTORY');
  process.exit(64);
}

const docsRoot = path.join(site, 'src', 'content', 'docs');
const required = ['audience', 'maturity', 'lastVerified', 'sourceRefs', 'sensitivity'];
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) files.push(full);
  }
}

walk(docsRoot);
const failures = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    failures.push(path.relative(site, file) + ': missing frontmatter');
    continue;
  }
  for (const field of required) {
    if (!new RegExp(`^${field}:\\s*\\S`, 'm').test(frontmatter[1])) {
      failures.push(path.relative(site, file) + ': missing ' + field);
    }
  }
}

if (failures.length) {
  console.error('Content metadata failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log('Content metadata check passed (' + files.length + ' documents).');
