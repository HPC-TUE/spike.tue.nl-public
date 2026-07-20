import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2] ?? '.';
const tokens = fs.readFileSync(path.join(site, 'src', 'styles', 'tokens.css'), 'utf8');
const custom = fs.readFileSync(path.join(site, 'src', 'styles', 'custom.css'), 'utf8');
const failures = [];
for (const rule of [':focus-visible', 'outline: 3px solid var(--spike-blue)', '--spike-red:', '--spike-blue:', '--spike-ink:']) {
  if (!tokens.includes(rule)) failures.push(`missing token rule: ${rule}`);
}
for (const [label, source, rule] of [
  ['dark theme', tokens, /:root\[data-theme=['"]dark['"]\]/],
  ['mobile breakpoint', custom, /@media\s*\(max-width:\s*42rem\)/],
  ['prose width', custom, /\.sl-markdown-content\s*\{[^}]*max-width:\s*78ch/s],
  ['screenshot figure', custom, /\.screenshot-figure\s+img/],
]) if (!rule.test(source)) failures.push(`missing ${label} rule`);
function luminance(hex) {
  const values = hex.match(/[a-f\d]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const linear = values.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
for (const [label, foreground, background] of [
  ['light body', '#1d252c', '#ffffff'], ['light red', '#c8192e', '#ffffff'], ['light blue', '#0069b4', '#ffffff'], ['light amber', '#a45d00', '#ffffff'],
  ['dark body', '#e8edf2', '#172027'], ['dark red', '#ff7889', '#172027'], ['dark blue', '#6cbcff', '#172027'], ['dark amber', '#ffbf69', '#172027'],
]) if (contrast(foreground, background) < 4.5) failures.push(`${label} contrast is below 4.5:1`);
if (failures.length) {
  console.error('Local design checks failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Local design and responsive checks passed.');
