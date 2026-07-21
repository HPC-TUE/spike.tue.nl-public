import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
const staging = fs.readFileSync('.github/workflows/staging-image.yml', 'utf8');
const failures = [];
if (!/workflow_dispatch:/m.test(workflow)) failures.push('manual deployment dispatch');
if (/^\s+push:\s*$/m.test(workflow)) failures.push('automatic push deployment must remain disabled');
for (const [label, pattern] of [
  ['npm install', /npm ci/], ['release verification', /npm run verify:release/],
  ['Astro Pages build', /withastro\/action@/], ['Pages deploy', /actions\/deploy-pages@/], ['Pages write permission', /pages:\s*write/],
]) if (!pattern.test(workflow)) failures.push(`missing ${label} in deploy workflow`);
for (const [label, pattern] of [
  ['manual dispatch', /workflow_dispatch:/], ['staging environment', /environment:\s*harbor-staging/],
  ['Harbor username secret', /secrets\.HARBOR_USERNAME/], ['Harbor password secret', /secrets\.HARBOR_PASSWORD/],
  ['Podman login', /podman login harbor\.spike\.tue\.nl/], ['canonical push script', /public\/downloads\/push-to-harbor\.sh/],
]) if (!pattern.test(staging)) failures.push(`missing ${label} in staging workflow`);
if (failures.length) {
  console.error('Local CI checks failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Local GitHub Actions workflow checks passed.');
