import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, symlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { writeLocalUpload, openLocalStream, validateObjectKey, parseByteRange, getLocalStorageUsage } from '../lib/local-storage.ts';

const base = path.resolve('.local/storage-tests');
await mkdir(base, { recursive: true });
const root = await mkdtemp(path.join(base, 'run-'));
const bytes = Buffer.from('contenido de prueba para descargas parciales');
const body = value => Readable.toWeb(Readable.from([value]));
const write = (key, value = bytes, options = {}) => writeLocalUpload({ root, key, body: body(value), expectedSize: value.length, quotaBytes: 1024 * 1024, ...options });

test('guarda sin alterar los bytes y sirve rangos', async () => {
  await write('uploads/user/sample.mcpack');
  const file = await openLocalStream(root, 'uploads/user/sample.mcpack', 'bytes=2-7');
  assert.equal(file.contentRange, `bytes 2-7/${bytes.length}`);
  assert.equal(file.size, 6);
  assert.deepEqual(Buffer.from(await new Response(file.stream).arrayBuffer()), bytes.subarray(2, 8));
  assert.equal(await getLocalStorageUsage(root), bytes.length);
});

test('no sobrescribe archivos existentes', async () => {
  await assert.rejects(write('uploads/user/sample.mcpack'), { status: 409 });
  assert.deepEqual(await readFile(path.join(root, 'uploads/user/sample.mcpack')), bytes);
});

test('rechaza subidas truncadas, demasiado grandes y sin espacio; limpia temporales', async () => {
  await assert.rejects(write('uploads/user/truncated.mcpack', bytes, { expectedSize: bytes.length + 1 }), { status: 400 });
  await assert.rejects(write('uploads/user/oversized.mcpack', bytes, { expectedSize: 1 }), { status: 413 });
  await assert.rejects(write('uploads/user/quota.mcpack', bytes, { quotaBytes: 1 }), { status: 507 });
  assert.deepEqual((await readdir(path.join(root, 'uploads/user'))).sort(), ['sample.mcpack']);
});

test('bloquea rutas fuera del almacén y rangos inválidos', () => {
  for (const key of ['../secret', 'uploads/../secret', 'uploads//file', 'uploads/C:/file', '/uploads/file', 'uploads/./file', 'uploads/a\\file']) {
    assert.throws(() => validateObjectKey(key), { status: 400 });
  }
  for (const value of ['bytes=999-', 'bytes=2-1', 'bytes=-0', 'bytes=0-1,3-4', 'wrong']) {
    assert.throws(() => parseByteRange(value, bytes.length), { status: 416 });
  }
  assert.deepEqual(parseByteRange('bytes=-3', bytes.length), { start: bytes.length - 3, end: bytes.length - 1 });
});

test('impide superar la cuota personal con dos subidas concurrentes y separa las cuentas', async () => {
  const value = Buffer.alloc(120);
  const results = await Promise.allSettled([
    write('uploads/quota-user/first.zip', value, { ownerQuotaBytes: 200 }),
    write('uploads/quota-user/second.zip', value, { ownerQuotaBytes: 200 }),
  ]);
  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(results.find(item => item.status === 'rejected').reason.status, 507);
  assert.equal(await getLocalStorageUsage(path.join(root, 'uploads/quota-user')), 120);
  await write('uploads/another-user/separate.zip', value, { ownerQuotaBytes: 200 });
  await assert.rejects(write('uploads/quota-user/third.zip', value, { ownerQuotaBytes: 200 }), { status: 507 });
});

test('bloquea directorios enlazados fuera del almacén', async t => {
  const outside = await mkdtemp(path.join(base, 'outside-'));
  try { await symlink(outside, path.join(root, 'uploads/linked'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (error.code === 'EPERM') return t.skip('El sistema no permite crear enlaces.'); throw error; }
  await assert.rejects(write('uploads/linked/file'), { status: 400 });
  assert.deepEqual(await readdir(outside), []);
});
