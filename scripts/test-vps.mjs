import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';

const root = path.resolve('.local', `vps-test-${randomUUID()}`);
await mkdir(root, { recursive: true });
const env = { ...process.env, VAMZ_DOMAIN: "", NODE_ENV: 'production', STORAGE_DRIVER: 'local', DATA_DIR: root,
  DATABASE_URL: pathToFileURL(path.join(root, 'db/vamz.sqlite')).href,
  JWT_SECRET: randomBytes(48).toString('hex'), ADMIN_EMAILS: 'admin@example.test',
  RESOURCE_STORAGE_LIMIT_MB: '3072', MAX_UPLOAD_MB: process.env.VAMZ_TEST_MAX_UPLOAD_MB || '256', MIN_FREE_SPACE_MB: '0', NEXT_TELEMETRY_DISABLED: '1' };
const port = Number(process.env.VAMZ_TEST_PORT || 3015);
env.PORT = String(port);
env.HOSTNAME = '127.0.0.1';
const base = `http://127.0.0.1:${port}`;
let server;
let logs = '';
const launch = args => {
  const child = spawn(process.execPath, args, { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { logs = (logs + data).slice(-6000); });
  return child;
};
const stop = async () => {
  if (!server || server.exitCode !== null) return;
  const done = once(server, 'exit');
  server.kill();
  await done;
};
const start = async () => {
  server = launch(process.env.VAMZ_TEST_STANDALONE === '1' ? [process.env.VAMZ_SERVER_ENTRY || '.next/standalone/server.js'] : ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)]);
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null) throw new Error(`El servidor terminó antes de arrancar: ${logs}`);
    if (await fetch(`${base}/api/health`).then(r => r.ok).catch(() => false)) return;
    await delay(500);
  }
  throw new Error(`El servidor no responde: ${logs}`);
};
const request = async (url, { cookie, json, ...options } = {}) => fetch(new URL(url, base), {
  redirect: 'manual', ...options, headers: { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
  ...(json ? { body: JSON.stringify(json) } : {}), signal: AbortSignal.timeout(30000),
});
const post = async (url, cookie, json, expected = 200) => {
  const response = await request(url, { method: 'POST', cookie, json });
  const result = await response.json();
  assert.equal(response.status, expected, `${url}: ${JSON.stringify(result)}`);
  return { result, cookie: response.headers.get('set-cookie')?.split(';')[0] };
};
const password = randomBytes(16).toString('hex');
try {
  const init = launch(['scripts/init-db.mjs']);
  assert.equal((await once(init, 'exit'))[0], 0, logs);
  const seed = createClient({ url: env.DATABASE_URL });
  try { await seed.execute({ sql: 'INSERT INTO users (id,email,username,password_hash) VALUES (?,?,?,?)', args: [randomUUID(), 'admin@example.test', 'Vamz Test', await bcrypt.hash(password, 12)] }); }
  finally { seed.close(); }
  await start();
  await post('/api/resources/upload/prepare', null, {}, 401);
  await post('/api/auth/register', null, { email: 'admin@example.test', username: 'Vamz Test', password }, 409);
  const admin = (await post('/api/auth/login', null, { email: 'admin@example.test', password })).cookie;
  assert.equal((await request('/api/auth/login', { method: 'POST', json: { email: 'admin@example.test', password }, headers: { Origin: base } })).status, 200);
  const otherAccount = await post('/api/auth/register', null, { email: 'other@example.test', username: 'Other Test', password }, 201);
  const other = otherAccount.cookie;
  assert.equal(otherAccount.result.redirectTo, '/recursos');
  const normalLogin = await post('/api/auth/login', null, { email: 'other@example.test', password });
  assert.equal(normalLogin.result.redirectTo, '/recursos');
  const file = randomBytes(256 * 1024);
  const cover = await readFile('public/vamz-skin.png');
  const prepare = async (publish, cookie = admin) => (await post('/api/resources/upload/prepare', cookie, {
    file: { name: 'sample.mcpack', size: file.length, type: 'application/zip' },
    cover: { name: 'cover.png', size: cover.length, type: 'image/png' }, title: 'Prueba VPS', publish,
  })).result;
  await post('/api/resources/upload/prepare', admin, { file: { name: 'large.zip', size: Number(env.MAX_UPLOAD_MB) * 1024 * 1024 + 1 } }, 413);
  await post('/api/resources/upload/prepare', other, { file: { name: 'large.zip', size: 181 * 1024 * 1024 } }, 403);
  const minecraft = { version: '1.21.100', edition: 'Bedrock', platform: 'Android' };
  await post('/api/resources/upload/prepare', other, { file: { name: 'sample.apk', size: 10 }, publish: true, minecraft }, 403);
  const prepared = await prepare(true);
  assert.equal((await request(prepared.file.uploadUrl, { method: 'PUT', body: file })).status, 401);
  assert.equal((await request(prepared.file.uploadUrl, { method: 'PUT', cookie: other, body: file })).status, 403);
  for (const [item, bytes] of [[prepared.file, file], [prepared.cover, cover]]) {
    assert.equal((await request(item.uploadUrl, { method: 'PUT', cookie: admin, body: bytes })).status, 201);
  }
  assert.equal((await request(prepared.file.uploadUrl, { method: 'PUT', cookie: admin, body: file })).status, 409);
  const metadata = { fileName: 'sample.mcpack', fileKey: prepared.file.key, coverKey: prepared.cover.key, publish: true, title: 'Prueba VPS' };
  await post('/api/resources/upload/complete', other, metadata, 403);
  const resource = (await post('/api/resources/upload/complete', admin, metadata, 201)).result.resource;
  await post('/api/resources/upload/complete', other, { ...metadata, minecraft }, 403);
  assert.equal((await post('/api/resources/upload/complete', admin, metadata, 201)).result.resource.id, resource.id);
  const url = `/api/resources/${resource.id}?download=1`;
  const download = await request(url);
  assert.equal(download.status, 200);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), file);
  const partial = await request(url, { headers: { Range: 'bytes=10-29' } });
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get('content-range'), `bytes 10-29/${file.length}`);
  assert.deepEqual(Buffer.from(await partial.arrayBuffer()), file.subarray(10, 30));
  assert.equal((await request(url, { headers: { Range: 'bytes=9999999-' } })).status, 416);
  assert.deepEqual(Buffer.from(await (await request(`/api/resources/${resource.id}/cover`)).arrayBuffer()), cover);
  const optimizedCover = await request(`/_next/image?url=${encodeURIComponent('/api/resources/'+resource.id+'/cover')}&w=640&q=75`);
  assert.equal(optimizedCover.status, 200);
  assert.ok(optimizedCover.headers.get('content-type').startsWith('image/'));
  const privatePrepared = await prepare(false);
  assert.equal((await request(privatePrepared.file.uploadUrl, { method: 'PUT', cookie: admin, body: file })).status, 201);
  const privateResource = (await post('/api/resources/upload/complete', admin, { fileName: 'private.mcpack', fileKey: privatePrepared.file.key }, 201)).result.resource;
  assert.equal((await request(`/api/resources/${privateResource.id}`)).status, 404);
  assert.equal((await request(`/api/resources/${privateResource.id}`, { cookie: other })).status, 404);
  assert.equal((await request(`/_next/image?url=${encodeURIComponent('/api/resources/'+privateResource.id)}&w=640&q=75`)).status, 404);
  const own = await request(`/api/resources/${privateResource.id}`, { cookie: admin });
  assert.equal(own.status, 200);
  await own.arrayBuffer();
  const largeSize = Number(process.env.VAMZ_TEST_LARGE_UPLOAD_MB || 12) * 1024 * 1024;
  let remaining = largeSize;
  const largeFile = new ReadableStream({ pull(controller) { if (!remaining) { controller.close(); return; } const size = Math.min(64 * 1024, remaining); controller.enqueue(new Uint8Array(size).fill(17)); remaining -= size; } });
  const largeUpload = (await post('/api/resources/upload/prepare', admin, { file: { name: 'large.mcpack', size: largeSize } })).result;
  assert.equal((await request(largeUpload.file.uploadUrl, { method: 'PUT', cookie: admin, body: largeFile, duplex: 'half' })).status, 201);
  const largeResource = (await post('/api/resources/upload/complete', admin, { fileName: 'large.mcpack', fileKey: largeUpload.file.key }, 201)).result.resource;
  assert.equal(largeResource.fileSize, largeSize);
  const lastBytes = await request('/api/resources/'+largeResource.id, { cookie: admin, headers: { Range: 'bytes=-64' } });
  assert.equal(lastBytes.status, 206);
  assert.deepEqual(Buffer.from(await lastBytes.arrayBuffer()), Buffer.alloc(64,17));
  assert.equal((await request('/api/resources/'+largeResource.id, { method: 'DELETE', cookie: admin })).status, 200);
  for (const [url, method] of [
    ['/api/resources/upload', 'POST'], ['/api/resources/upload/complete', 'POST'],
    ['/api/resources/list', 'GET'], ['/api/profile/update', 'POST'],
    ['/api/resources/'+resource.id, 'PATCH'], ['/api/resources/'+resource.id, 'DELETE'],
    ['/api/resources/'+resource.id+'/details', 'POST'], ['/api/social-links', 'POST'],
    ['/api/social-links/1', 'PATCH'], ['/api/social-links/1', 'DELETE'],
  ]) assert.equal((await request(url, { method, cookie: other })).status, 403, url);
  const deniedPanel = await request('/dashboard?view=minecraft', { cookie: other });
  assert.equal(deniedPanel.status, 307);
  assert.equal(new URL(deniedPanel.headers.get('location'), base).pathname, '/recursos');
  const normalPage = await (await request('/recursos', { cookie: other })).text();
  assert.ok(!normalPage.includes('Administrar') && !normalPage.includes('180 MB') && !normalPage.includes('Subir un recurso'));
  for (const [url, method, headers] of [
    ['/api/auth/login', 'POST', { Origin: 'https://attacker.test' }],
    ['/api/auth/logout', 'POST', { 'Sec-Fetch-Site': 'cross-site' }],
    ['/api/resources/'+resource.id, 'DELETE', { Origin: 'null' }],
  ]) assert.equal((await request(url, { method, headers, cookie: admin })).status, 403, url);
  await post('/api/social-links', admin, { platform: 'Test', url: 'javascript:alert(1)' }, 400);
  await post('/api/social-links', admin, { platform: 'Test', url: 'https://user:password@example.com' }, 400);
  await post('/api/social-links', admin, { platform: 'Test', url: 'http://example.com' }, 400);
  const social = (await post('/api/social-links', admin, { platform: 'YouTube', url: 'https://youtube.com/@vamz-test' }, 201)).result.link;
  assert.equal((await request('/api/social-links/'+social.id, { method: 'DELETE', cookie: admin })).status, 200);
  const home = await request('/');
  const csp = home.headers.get('content-security-policy');
  assert.ok(csp.includes("'strict-dynamic'") && csp.includes("frame-ancestors 'none'"));
  const nonce = csp.match(/'nonce-([^']+)'/)[1];
  const html = await home.text();
  assert.ok(!html.includes('data-dgst='), 'La portada debe renderizarse sin errores en el servidor.');
  assert.ok(html.includes('nonce="'+nonce+'"'));
  assert.notEqual((await request('/')).headers.get('content-security-policy'), csp);
  assert.equal(home.headers.get('x-frame-options'), 'DENY');
  assert.equal(home.headers.get('x-powered-by'), null);
  assert.equal(download.headers.get('content-security-policy'), 'sandbox');
  await post('/api/auth/login', null, { email: 'no@example.test', password: 'x'.repeat(17000) }, 400);
  const versionPrepared = (await post('/api/resources/upload/prepare', admin, { file: { name: 'minecraft.apk', size: file.length }, publish: true, minecraft })).result;
  assert.equal((await request(versionPrepared.file.uploadUrl, { method: 'PUT', cookie: admin, body: file })).status, 201);
  const versionResource = (await post('/api/resources/upload/complete', admin, { fileName: 'minecraft.apk', fileKey: versionPrepared.file.key, publish: true, minecraft }, 201)).result.resource;
  const catalog = await (await request('/minecraft')).text();
  assert.ok(catalog.includes('1.21.100') && catalog.includes(versionResource.id));
  const resourcesPage = await (await request('/recursos')).text();
  assert.ok(!resourcesPage.includes(versionResource.id));
  await stop();
  await start();
  const login = await post('/api/auth/login', null, { email: 'admin@example.test', password });
  assert.ok(login.cookie);
  const adminPanel = await (await request('/dashboard?view=minecraft', { cookie: login.cookie })).text();
  assert.ok(adminPanel.includes('por archivo'));
  assert.equal(login.result.redirectTo, '/dashboard');
  assert.deepEqual(Buffer.from(await (await request(url)).arrayBuffer()), file);
  assert.equal((await request(`/api/resources/${resource.id}`, { method: 'DELETE', cookie: login.cookie })).status, 200);
  assert.equal((await request(url)).status, 404);
  assert.ok((await (await request('/minecraft')).text()).includes(versionResource.id));
  assert.equal((await request(`/api/resources/${versionResource.id}`, { method: 'DELETE', cookie: login.cookie })).status, 200);
  assert.ok(!(await (await request('/minecraft')).text()).includes(versionResource.id));
  for (let attempt=0; attempt<12; attempt++) await post('/api/auth/login', null, { email: 'missing@example.test', password }, 401);
  await post('/api/auth/login', null, { email: 'missing@example.test', password }, 429);
  await stop(); await start();
  const blocked = await request('/api/auth/login', { method: 'POST', json: { email: 'missing@example.test', password } });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  const revoke = createClient({ url: env.DATABASE_URL });
  try { await revoke.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [otherAccount.result.user.id] }); }
  finally { revoke.close(); }
  assert.equal((await request('/api/profile/update', { method: 'POST', cookie: other })).status, 401);
  console.log('VPS: usuarios de solo lectura, administración, CSRF, CSP, enlaces HTTPS, límites de acceso persistentes, subidas, rangos y persistencia verificados.');
  if (process.env.VAMZ_TEST_UI === '1') {
    await writeFile('.local/vps-ui.json', JSON.stringify({ env, password, root, base }), { mode: 0o600 });
    console.log('Servidor de pruebas disponible para revisar la interfaz.');
    await new Promise(resolve => process.once('SIGINT', resolve));
  }
} finally { await stop(); }
