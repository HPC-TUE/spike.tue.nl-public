import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!site) {
  console.error('Usage: node check-static-a11y.mjs SITE_DIRECTORY');
  process.exit(64);
}

const outputRoot = fs.existsSync(path.join(site, 'dist'))
  ? path.join(site, 'dist')
  : path.join(site, 'public');
const pages = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) pages.push(full);
  }
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
      .slice(1)
      .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '']),
  );
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

walk(outputRoot);
const failures = [];

for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const label = path.relative(site, page);

  if (/<meta\b[^>]*http-equiv=(?:"refresh"|'refresh'|refresh)/i.test(html)) continue;

  if (!/<html\b[^>]*\blang=(?:"[^"]+"|'[^']+'|[^\s>]+)/i.test(html)) {
    failures.push(label + ': missing document language');
  }

  if ((html.match(/<main\b/gi) ?? []).length !== 1) {
    failures.push(label + ': expected exactly one main landmark');
  }

  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((match) => Number(match[1]));
  if (!headings.includes(1)) failures.push(label + ': missing h1');
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index] > headings[index - 1] + 1) {
      failures.push(label + ': heading level skips from h' + headings[index - 1] + ' to h' + headings[index]);
      break;
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (!Object.hasOwn(attrs, 'alt')) failures.push(label + ': image without alt attribute');
  }

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = attributes(match[1]);
    if (!visibleText(match[2]) && !attrs['aria-label'] && !attrs.title) {
      failures.push(label + ': link without an accessible name');
    }
  }
}

if (failures.length) {
  console.error('Static accessibility failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log('Static accessibility check passed (' + pages.length + ' HTML pages).');
