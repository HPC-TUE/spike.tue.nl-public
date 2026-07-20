import fs from 'node:fs';

const failures = [];
if (fs.readFileSync('public/CNAME', 'utf8').trim() !== 'spike.tue.nl') failures.push('public CNAME must be spike.tue.nl');
const config = fs.readFileSync('astro.config.mjs', 'utf8');
if (!/site:\s*['"]https:\/\/spike\.tue\.nl['"]/.test(config)) failures.push('Astro site must be spike.tue.nl');
if (fs.existsSync('dist/index.html') && /<meta\s+name=["']robots["']\s+content=["']noindex/i.test(fs.readFileSync('dist/index.html', 'utf8'))) failures.push('public homepage must remain indexable');
if (failures.length) {
  console.error('Local deployment-boundary checks failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Local public deployment-boundary checks passed.');
