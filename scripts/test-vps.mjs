import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, truncate } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';

const root = path.resolve('.local', `vps-test-${randomUUID()}`);
await mkdir(root, { recursive: true });
const env = { ...process.env, NODE_ENV: 'production', STORAGE_DRIVER: 'local', DATA_DIR: root,
  DATABASE_URL: pathToFileURL(path.join(root, 'db/vamz.sqlite')).href,
  JWT_SECRET: randomBytes(48).toString('hex'), ADMIN_EMAILS: 'admin@example.test',
  RESOURCE_STORAGE_LIMIT_MB: '512', MAX_UPLOAD_MB: '256', MIN_FREE_SPACE_MB: '0', NEXT_TELEMETRY_DISABLED: '1' };
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
  ...options, headers: { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
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
  const otherAccount = await post('/api/auth/register', null, { email: 'other@example.test', username: 'Other Test', password }, 201);
  const other = otherAccount.cookie;
  const file = randomBytes(256 * 1024);
  const cover = await readFile('public/vamz-skin.png');
  const prepare = async (publish, cookie = admin) => (await post('/api/resources/upload/prepare', cookie, {
    file: { name: 'sample.mcpack', size: file.length, type: 'application/zip' },
    cover: { name: 'cover.png', size: cover.length, type: 'image/png' }, title: 'Prueba VPS', publish,
  })).result;
  await post('/api/resources/upload/prepare', admin, { file: { name: 'large.zip', size: 257 * 1024 * 1024 } }, 413);
  await post('/api/resources/upload/prepare', other, { file: { name: 'large.zip', size: 181 * 1024 * 1024 } }, 507);
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
  await post('/api/resources/upload/complete', other, metadata, 400);
  const resource = (await post('/api/resources/upload/complete', admin, metadata, 201)).result.resource;
  await post('/api/resources/upload/complete', other, { ...metadata, minecraft }, 400);
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
  const privatePrepared = await prepare(false);
  assert.equal((await request(privatePrepared.file.uploadUrl, { method: 'PUT', cookie: admin, body: file })).status, 201);
  const privateResource = (await post('/api/resources/upload/complete', admin, { fileName: 'private.mcpack', fileKey: privatePrepared.file.key }, 201)).result.resource;
  assert.equal((await request(`/api/resources/${privateResource.id}`)).status, 404);
  assert.equal((await request(`/api/resources/${privateResource.id}`, { cookie: other })).status, 404);
  const own = await request(`/api/resources/${privateResource.id}`, { cookie: admin });
  assert.equal(own.status, 200);
  await own.arrayBuffer();
  const community = (await post('/api/resources/upload/prepare', other, { file: { name: 'community.mcpack', size: file.length }, publish: true })).result;
  assert.equal((await request(community.file.uploadUrl, { method: 'PUT', cookie: other, body: file })).status, 201);
  await post('/api/resources/upload/complete', other, { fileName: 'community.mcpack', fileKey: community.file.key, publish: true, minecraft }, 403);
  const communityResource = (await post('/api/resources/upload/complete', other, { fileName: 'community.mcpack', fileKey: community.file.key, publish: true }, 201)).result.resource;
  const communityDownload = await request(`/api/resources/${communityResource.id}`);
  assert.equal(communityDownload.status, 200); await communityDownload.arrayBuffer();
  assert.equal((await request(`/api/resources/${resource.id}`, { method: 'DELETE', cookie: other })).status, 404);
  assert.equal((await request('/api/social-links', { method: 'POST', cookie: other, json: { platform: 'Test', url: 'https://example.com' } })).status, 403);
  const userPanel = await (await request('/dashboard', { cookie: other })).text();
  assert.ok(userPanel.includes('180 MB'));
  assert.ok(!userPanel.includes('Subir versión de Minecraft'));
  const versionPrepared = (await post('/api/resources/upload/prepare', admin, { file: { name: 'minecraft.apk', size: file.length }, publish: true, minecraft })).result;
  assert.equal((await request(versionPrepared.file.uploadUrl, { method: 'PUT', cookie: admin, body: file })).status, 201);
  const versionResource = (await post('/api/resources/upload/complete', admin, { fileName: 'minecraft.apk', fileKey: versionPrepared.file.key, publish: true, minecraft }, 201)).result.resource;
  const catalog = await (await request('/minecraft')).text();
  assert.ok(catalog.includes('1.21.100') && catalog.includes(versionResource.id));
  const resourcesPage = await (await request('/recursos')).text();
  assert.ok(!resourcesPage.includes(versionResource.id));
  const quotaFile = path.join(root, 'storage/uploads', otherAccount.result.user.id, 'quota-fixture.bin');
  await writeFile(quotaFile, ''); await truncate(quotaFile, 180 * 1024 * 1024);
  await post('/api/resources/upload/prepare', other, { file: { name: 'one-byte.zip', size: 1 } }, 507);
  assert.equal((await request(`/api/resources/${communityResource.id}`, { method: 'DELETE', cookie: other })).status, 200);
  await stop();
  await start();
  const login = await post('/api/auth/login', null, { email: 'admin@example.test', password });
  assert.ok(login.cookie);
  assert.deepEqual(Buffer.from(await (await request(url)).arrayBuffer()), file);
  assert.equal((await request(`/api/resources/${resource.id}`, { method: 'DELETE', cookie: login.cookie })).status, 200);
  assert.equal((await request(url)).status, 404);
  assert.ok((await (await request('/minecraft')).text()).includes(versionResource.id));
  assert.equal((await request(`/api/resources/${versionResource.id}`, { method: 'DELETE', cookie: login.cookie })).status, 200);
  assert.ok(!(await (await request('/minecraft')).text()).includes(versionResource.id));
  console.log('VPS: registro, permisos por rol, cuota de 180 MB, versiones de Minecraft, subidas, rangos y persistencia verificados.');
  if (process.env.VAMZ_TEST_UI === '1') {
    await writeFile('.local/vps-ui.json', JSON.stringify({ env, password, root, base }), { mode: 0o600 });
    console.log('Servidor de pruebas disponible para revisar la interfaz.');
    await new Promise(resolve => process.once('SIGINT', resolve));
  }
} finally { await stop(); }
