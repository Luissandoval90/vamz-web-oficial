import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = path.resolve('.local', `vps-test-${randomUUID()}`);
await mkdir(root, { recursive: true });
const env = { ...process.env, NODE_ENV: 'production', STORAGE_DRIVER: 'local', DATA_DIR: root,
  DATABASE_URL: pathToFileURL(path.join(root, 'db/vamz.sqlite')).href,
  JWT_SECRET: randomBytes(48).toString('hex'), ADMIN_EMAILS: 'admin@example.test',
  RESOURCE_STORAGE_LIMIT_MB: '16', MAX_UPLOAD_MB: '8', MIN_FREE_SPACE_MB: '0', NEXT_TELEMETRY_DISABLED: '1' };
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
  server = launch(process.env.VAMZ_TEST_STANDALONE === '1' ? ['.next/standalone/server.js'] : ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)]);
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
  await start();
  await post('/api/resources/upload/prepare', null, {}, 401);
  const admin = (await post('/api/auth/register', null, { email: 'admin@example.test', username: 'Vamz Test', password }, 201)).cookie;
  const other = (await post('/api/auth/register', null, { email: 'other@example.test', username: 'Other Test', password }, 201)).cookie;
  const file = randomBytes(256 * 1024);
  const cover = await readFile('public/vamz-skin.png');
  const prepare = async (publish, cookie = admin) => (await post('/api/resources/upload/prepare', cookie, {
    file: { name: 'sample.mcpack', size: file.length, type: 'application/zip' },
    cover: { name: 'cover.png', size: cover.length, type: 'image/png' }, title: 'Prueba VPS', publish,
  })).result;
  await post('/api/resources/upload/prepare', admin, { file: { name: 'large.zip', size: 9 * 1024 * 1024 } }, 413);
  await post('/api/resources/upload/prepare', other, { file: { name: 'sample.zip', size: 10 }, publish: true }, 403);
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
  await stop();
  await start();
  const login = await post('/api/auth/login', null, { email: 'admin@example.test', password });
  assert.ok(login.cookie);
  assert.deepEqual(Buffer.from(await (await request(url)).arrayBuffer()), file);
  assert.equal((await request(`/api/resources/${resource.id}`, { method: 'DELETE', cookie: login.cookie })).status, 200);
  assert.equal((await request(url)).status, 404);
  console.log('VPS: registro, acceso, permisos, subidas, portadas, rangos, borrado y persistencia verificados.');
} finally { await stop(); }
