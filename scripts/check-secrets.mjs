import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2] ?? '.';
const targetDirs = ['src', 'public', 'scripts', '.github'];
const failures = [];

const secretPatterns = [
  { name: 'Private Key block', regex: /-----BEGIN (?:[A-Z0-9_-]+\s+)?PRIVATE KEY-----/ },
  { name: 'GitHub Personal Access Token', regex: /\b(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})\b/ },
  { name: 'Unredacted AWS/S3 access key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Unredacted S3 secret assignment', regex: /^\s*(?:secret_key|access_key)\s*=\s*(?!(?:XXXX|<[A-Z_]+>|your-[a-z-]+))\S{16,}/m },
  { name: 'RFC1918 / Private IP address', regex: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/ },
  { name: 'Internal TU/e IP address', regex: /\b131\.155\.\d{1,3}\.\d{1,3}\b/ },
  { name: 'Internal cluster routing hostname', regex: /\b[a-zA-Z0-9.-]+\.inference\.spike\.tue\.nl\b/ },
  { name: 'Internal cluster.local hostname', regex: /\b[a-zA-Z0-9.-]+\.cluster\.local\b/ },
  { name: 'Personal staff email address', regex: /\b[a-z]{1,3}\.[a-z]+[0-9]?@tue\.nl\b/i },
];

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      walk(full);
    } else if (entry.isFile()) {
      if (/\.(png|webp|ico|jpg|jpeg|pdf|woff2?|ttf|eot)$/i.test(entry.name)) continue;
      const content = fs.readFileSync(full, 'utf8');
      for (const { name, regex } of secretPatterns) {
        if (regex.test(content)) {
          failures.push(`${path.relative(site, full)}: detected potential ${name}`);
        }
      }
    }
  }
}

for (const dir of targetDirs) {
  walk(path.join(site, dir));
}

if (failures.length) {
  console.error('Security & Secret screening failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log('Security & secret screening passed (no credentials, private IPs, or internal endpoints found).');
