import fs from 'node:fs';

const failures = [];
const cname = fs.readFileSync('public/CNAME', 'utf8').trim();
if (cname !== 'docs.spike.tue.nl' && cname !== 'spike.tue.nl') failures.push('public CNAME must be docs.spike.tue.nl or spike.tue.nl');
const config = fs.readFileSync('astro.config.mjs', 'utf8');
if (!/site:\s*['"]https:\/\/(?:docs\.)?spike\.tue\.nl['"]/.test(config)) failures.push('Astro site must be docs.spike.tue.nl or spike.tue.nl');
if (fs.existsSync('dist/index.html') && /<meta\s+name=["']robots["']\s+content=["']noindex/i.test(fs.readFileSync('dist/index.html', 'utf8'))) failures.push('public homepage must remain indexable');
if (failures.length) {
  console.error('Local deployment-boundary checks failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Local public deployment-boundary checks passed.');
