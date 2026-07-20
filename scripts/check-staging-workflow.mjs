import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!site) {
  console.error('Usage: node check-staging-workflow.mjs SITE_DIRECTORY');
  process.exit(64);
}

const workflowPath = path.join(site, '.github', 'workflows', 'staging-image.yml');
if (!fs.existsSync(workflowPath)) {
  console.error(`Missing staging workflow: ${path.relative(site, workflowPath)}`);
  process.exit(1);
}

const workflow = fs.readFileSync(workflowPath, 'utf8');
const requirements = [
  ['manual workflow dispatch', /workflow_dispatch:/],
  ['protected staging environment', /environment:\s*harbor-staging/],
  ['Harbor username secret', /secrets\.HARBOR_USERNAME/],
  ['Harbor password secret', /secrets\.HARBOR_PASSWORD/],
  ['interactive Podman login', /podman login harbor\.spike\.tue\.nl/],
  ['canonical push script', /public\/downloads\/push-to-harbor\.sh/],
  ['container name input', /container_name:/],
  ['Harbor project input', /harbor_project:/],
  ['immutable version input', /version:/],
  ['Containerfile input', /containerfile:/],
];
const failures = requirements.filter(([, pattern]) => !pattern.test(workflow)).map(([label]) => label);

if (failures.length) {
  console.error('Staging workflow preflight failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log('Staging workflow preflight passed (protected Harbor workflow wiring is complete).');
