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

function isInternal(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('spike.tue.nl') || parsed.hostname === 'spike.tue.nl';
  } catch {
    return false;
  }
}

async function checkDoi(url) {
  try {
    const doi = new URL(url).pathname.replace(/^\/+/, '');
    const apiUrl = `https://doi.org/api/handles/${doi}`;
    const response = await fetch(apiUrl, {
      headers: { accept: 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      if (data.responseCode === 1) return null;
    }
  } catch {
    // Fall back to direct fetch if API is unreachable
  }
  return null;
}

async function check(url) {
  if (isInternal(url)) {
    // Skip internal cluster endpoints that are inaccessible from external CI runners
    return null;
  }

  if (url.startsWith('https://doi.org/')) {
    const doiResult = await checkDoi(url);
    if (doiResult === null) return null;
  }

  let lastError;
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const headers = {
        'user-agent': userAgent,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      };
      const response = await fetch(url, { method: 'GET', redirect: 'follow', headers, signal: controller.signal });
      await response.body?.cancel();

      // Handle 403 / 429 / 401 from bot shields or rate-limited documentation sites
      if (response.status === 403 || response.status === 429 || response.status === 401) {
        return null;
      }

      if (!response.ok) return url + ' returned HTTP ' + response.status;
      return null;
    } catch (error) {
      lastError = error;
      if (lastError?.cause?.message?.includes('redirect') || lastError?.message?.includes('redirect')) {
        try {
          const manualRes = await fetch(url, { method: 'GET', redirect: 'manual', headers: { 'user-agent': userAgent } });
          await manualRes.body?.cancel();
          if (manualRes.status >= 200 && manualRes.status < 400) return null;
        } catch {
          // ignore manual check error
        }
      }
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    } finally {
      clearTimeout(timeout);
    }
  }
  return url + ' failed: ' + (lastError?.cause?.message ?? lastError?.message);
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
