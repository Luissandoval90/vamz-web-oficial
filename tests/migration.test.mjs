import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { mkdtemp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

test('migra usuarios, enlaces y archivos; no altera el origen ni un destino existente', async () => {
  const base = path.resolve('.local/migration-tests');
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(path.join(base, 'run-'));
  const sourceUrl = pathToFileURL(path.join(root, 'source.sqlite')).href;
  const source = createClient({ url: sourceUrl });
  const hash = 'bcrypt-hash-preservado';
  const published = '2026-01-01T10:00:00.000Z';
  const file = Buffer.from('archivo que debe conservarse exactamente');
  const storage = path.join(root, 'source-storage');
  const target = path.join(root, 'data');
  await mkdir(path.join(storage, 'uploads'), { recursive: true });
  await writeFile(path.join(storage, 'uploads/original.mcpack'), file);
  try {
    await source.executeMultiple(await readFile('scripts/schema.sql', 'utf8'));
    await source.execute({ sql: 'INSERT INTO users (id,email,username,password_hash) VALUES (?,?,?,?)', args: ['user', 'test@example.test', 'Test', hash] });
    await source.execute({ sql: 'INSERT INTO resources (id,user_id,filename,path,is_published,published_at) VALUES (?,?,?,?,?,?)', args: ['resource', 'user', 'original.mcpack', 'uploads/original.mcpack', 1, published] });
    await source.execute("INSERT INTO social_links (platform,url) VALUES ('YouTube','https://example.com')");
    const run = () => spawnSync(process.execPath, ['scripts/migrate-vps.mjs', '--target', target, '--source-storage', storage], { env: { ...process.env, SOURCE_TURSO_DATABASE_URL: sourceUrl }, encoding: 'utf8', windowsHide: true, timeout: 60000 });
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const copied = createClient({ url: pathToFileURL(path.join(target, 'db/vamz.sqlite')).href });
    try {
      assert.equal((await copied.execute('SELECT password_hash FROM users')).rows[0].password_hash, hash);
      const resource = (await copied.execute('SELECT * FROM resources')).rows[0];
      assert.equal(resource.published_at, published);
      assert.equal(resource.file_size, file.length);
      assert.equal((await copied.execute('SELECT COUNT(*) AS n FROM social_links')).rows[0].n, 1);
    } finally { copied.close(); }
    assert.deepEqual(await readFile(path.join(target, 'storage/uploads/original.mcpack')), file);
    const manifest = JSON.parse(await readFile(path.join(target, 'migration-manifest.json'), 'utf8'));
    assert.equal(manifest.files[0].sha256, createHash('sha256').update(file).digest('hex'));
    assert.equal((await source.execute('SELECT file_size FROM resources')).rows[0].file_size, 0);
    assert.equal(run().status, 1);
    await access(path.join(target, 'db/vamz.sqlite'));
  } finally { source.close(); }
});
