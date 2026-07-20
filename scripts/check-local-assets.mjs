import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2] ?? '.';
const assetRoot = path.join(site, 'src', 'assets');
const failures = [];
const files = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
}

walk(assetRoot);
const pngs = files.filter((file) => file.endsWith('.png'));
for (const png of pngs) {
  const webp = png.replace(/\.png$/i, '.webp');
  if (!fs.existsSync(webp)) failures.push(`missing WebP derivative for ${path.relative(site, png)}`);
}

function docs(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return docs(full);
    return entry.name.endsWith('.md') || entry.name.endsWith('.mdx') ? [full] : [];
  });
}

for (const file of docs(path.join(site, 'src', 'content', 'docs'))) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('screenshots/organized/')) {
    failures.push(`published docs reference source screenshots: ${path.relative(site, file)}`);
  }
}

const deploymentImages = [path.join(site, 'public', 'images'), path.join(site, 'static', 'images')];
for (const directory of deploymentImages) {
  if (fs.existsSync(directory) && fs.readdirSync(directory).length) {
    failures.push(`deployment image directory must remain empty: ${path.relative(site, directory)}`);
  }
}

if (failures.length) {
  console.error('Local asset checks failed:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`Local asset checks passed (${pngs.length} PNG derivatives with matching WebP files).`);
