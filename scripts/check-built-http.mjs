import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const site = process.argv[2];
if (!site) {
  console.error('Usage: node check-built-http.mjs SITE_DIRECTORY');
  process.exit(64);
}

const outputRoot = fs.existsSync(path.join(site, 'dist'))
  ? path.join(site, 'dist')
  : path.join(site, 'public');
if (!fs.existsSync(outputRoot)) {
  console.error(`Built output directory is missing: ${outputRoot}`);
  process.exit(1);
}

const isAdmin = fs.existsSync(path.join(site, 'src', 'content', 'docs', 'admin-operations', 'index.mdx'));
const routes = isAdmin
  ? ['/', '/admin-operations/', '/runbooks/workload-cleanup/', '/404.html']
  : ['/', '/start-here/', '/images/podman-harbor/', '/404.html'];

function resolveFile(requestPath) {
  const pathname = decodeURIComponent(requestPath.split(/[?#]/, 1)[0]);
  const relative = pathname.replace(/^\/+/, '');
  const candidates = pathname.endsWith('/')
    ? [path.join(outputRoot, relative, 'index.html')]
    : [path.join(outputRoot, relative), path.join(outputRoot, relative, 'index.html')];
  return candidates.find((candidate) => {
    const resolved = path.resolve(candidate);
    return resolved.startsWith(path.resolve(outputRoot) + path.sep) || resolved === path.resolve(outputRoot);
  });
}

const server = http.createServer((request, response) => {
  const file = resolveFile(request.url ?? '/');
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
  if (request.method === 'HEAD') response.end();
  else fs.createReadStream(file).pipe(response);
});

try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
} catch (error) {
  if (error.code !== 'EPERM') throw error;
  const missing = routes.filter((route) => {
    const file = resolveFile(route);
    return !file || !fs.existsSync(file);
  });
  if (missing.length) {
    console.error('Built HTTP smoke-test fallback failed:\n' + missing.join('\n'));
    process.exit(1);
  }
  console.log(`Built HTTP smoke test passed via static fallback (${routes.length} routes; local socket binding unavailable).`);
  process.exit(0);
}

const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const failures = [];
for (const route of routes) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    if (response.status !== 200) failures.push(`${route} returned HTTP ${response.status}`);
    const body = await response.text();
    if (!body.includes('<html')) failures.push(`${route} did not return HTML`);
  } catch (error) {
    failures.push(`${route} failed: ${error.message}`);
  }
}

await new Promise((resolve) => server.close(resolve));

if (failures.length) {
  console.error('Built HTTP smoke-test failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`Built HTTP smoke test passed (${routes.length} routes).`);
