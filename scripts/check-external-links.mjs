import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!site) {
  console.error('Usage: node check-external-links.mjs SITE_DIRECTORY');
  process.exit(64);
}

const docsRoot = path.join(site, 'src', 'content', 'docs');
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) files.push(full);
  }
}
walk(docsRoot);

const links = new Set();
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/]\((https?:\/\/[^)\s]+)\)/g)) links.add(match[1]);
  for (const match of content.matchAll(/href=["'](https?:\/\/[^"']+)["']/g)) links.add(match[1]);
}

const failures = [];
async function check(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const headers = { 'user-agent': 'spike-docs-link-check/1.0', accept: 'text/html,*/*' };
      let response = await fetch(url, { method: 'HEAD', redirect: 'follow', headers, signal: controller.signal });
      if (response.status === 405 || response.status === 501) {
        response = await fetch(url, { method: 'GET', redirect: 'follow', headers, signal: controller.signal });
      }
      if (!response.ok) return url + ' returned HTTP ' + response.status;
      return null;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    } finally {
      clearTimeout(timeout);
    }
  }
  return url + ' failed: ' + lastError.message;
}

for (const url of links) {
  const failure = await check(url);
  if (failure) failures.push(failure);
}

if (failures.length) {
  console.error('External link failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log('External link check passed (' + links.size + ' unique links).');
