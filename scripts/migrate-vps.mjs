import { createClient } from '@libsql/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, readFile, rename, stat, statfs, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const option = name => {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1];
};
const required = name => { if (!process.env[name]) throw new Error(`Falta ${name}.`); return process.env[name]; };
const exists = filename => access(filename).then(() => true, error => { if (error.code === 'ENOENT') return false; throw error; });
const safeKey = stored => {
  const key = stored.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!key.startsWith('uploads/') || !/^[a-zA-Z0-9/_.-]+$/.test(key) || key.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Hay una ruta de archivo no válida en el origen.');
  return key;
};
const columns = {
  users: ['id', 'email', 'username', 'password_hash', 'created_at'],
  resources: ['id', 'user_id', 'filename', 'path', 'title', 'description', 'cover_path', 'file_size', 'cover_size', 'is_published', 'published_at', 'created_at'],
  social_links: ['id', 'platform', 'url', 'icon', 'created_at', 'updated_at'],
  minecraft_versions: ['resource_id', 'version', 'edition', 'platform'],
};

async function migrate() {
  const targetArgument = option('--target');
  if (!targetArgument || targetArgument.startsWith('--')) throw new Error('Uso: node --env-file=.env.migration scripts/migrate-vps.mjs --target ./data');
  const target = path.resolve(targetArgument);
  if (await exists(target)) throw new Error('El destino ya existe. Elige un directorio nuevo para evitar sobrescribir datos.');
  const sourceUrl = required('SOURCE_TURSO_DATABASE_URL');
  const localSource = option('--source-storage');
  const s3 = localSource ? null : new S3Client({ region: 'auto', endpoint: required('SOURCE_R2_ENDPOINT'), credentials: {
    accessKeyId: required('SOURCE_R2_ACCESS_KEY_ID'), secretAccessKey: required('SOURCE_R2_SECRET_ACCESS_KEY'),
  } });
  const bucket = localSource ? null : required('SOURCE_R2_BUCKET');
  const source = createClient({ url: sourceUrl, authToken: sourceUrl.startsWith('file:') ? undefined : required('SOURCE_TURSO_AUTH_TOKEN') });
  const staging = path.resolve(option('--staging'));
  if (path.dirname(staging) !== path.dirname(target) || !path.basename(staging).startsWith('.vamz-migration-')) throw new Error('Directorio temporal no válido.');
  await mkdir(path.join(staging, 'db'), { recursive: true, mode: 0o750 });
  const storage = path.join(staging, 'storage');
  await mkdir(storage, { mode: 0o750 });
  const destination = createClient({ url: pathToFileURL(path.join(staging, 'db/vamz.sqlite')).href });
  let transaction;
  try {
    await destination.executeMultiple(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    const rows = {};
    // Una sola transacción de lectura mantiene una instantánea coherente de las tablas.
    transaction = await source.transaction('read');
    const sourceTables = new Set((await transaction.execute("SELECT name FROM sqlite_master WHERE type='table'")).rows.map(row => row.name));
    for (const [table, names] of Object.entries(columns)) rows[table] = table === 'minecraft_versions' && !sourceTables.has(table) ? [] : (await transaction.execute(`SELECT ${names.join(',')} FROM ${table}`)).rows;
    await transaction.commit();
    transaction.close();
    transaction = null;
    const keys = new Set();
    for (const resource of rows.resources) {
      resource.path = safeKey(String(resource.path));
      keys.add(resource.path);
      if (resource.cover_path) { resource.cover_path = safeKey(String(resource.cover_path)); keys.add(resource.cover_path); }
    }
    const manifest = [];
    for (const key of keys) {
      const filename = path.join(storage, ...key.split('/'));
      await mkdir(path.dirname(filename), { recursive: true, mode: 0o750 });
      let body;
      let expected;
      if (localSource) {
        const sourceFile = path.join(path.resolve(localSource), ...key.split('/'));
        expected = (await stat(sourceFile)).size;
        body = createReadStream(sourceFile);
      } else {
        const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        body = object.Body;
        expected = object.ContentLength;
      }
      if (!body || expected === undefined || expected <= 0) throw new Error('Un archivo del origen está vacío o no está disponible.');
      const disk = await statfs(staging);
      if (Number(disk.bavail) * Number(disk.bsize) < expected + 2 * 1024 ** 3) throw new Error('No hay espacio suficiente para migrar conservando 2 GB libres.');
      let size = 0;
      const hash = createHash('sha256');
      await pipeline(body, new Transform({ transform(chunk, _encoding, callback) { size += chunk.length; hash.update(chunk); callback(null, chunk); } }), createWriteStream(filename, { flags: 'wx', mode: 0o640 }));
      if (size !== expected) throw new Error('Un archivo se copió incompleto.');
      const sha256 = hash.digest('hex');
      const diskHash = createHash('sha256');
      for await (const chunk of createReadStream(filename)) diskHash.update(chunk);
      if (diskHash.digest('hex') !== sha256) throw new Error('La verificación de un archivo no coincide.');
      manifest.push({ key, size, sha256 });
    }
    const sizes = new Map(manifest.map(file => [file.key, file.size]));
    for (const row of rows.resources) { row.file_size = sizes.get(row.path); row.cover_size = row.cover_path ? sizes.get(row.cover_path) : 0; }
    const tx = await destination.transaction('write');
    try {
      for (const [table, names] of Object.entries(columns)) {
        for (const row of rows[table]) await tx.execute({ sql: `INSERT INTO ${table} (${names.join(',')}) VALUES (${names.map(() => '?').join(',')})`, args: names.map(name => row[name] ?? null) });
      }
      await tx.commit();
    } catch (error) { await tx.rollback(); throw error; }
    finally { tx.close(); }
    if ((await destination.execute('PRAGMA integrity_check')).rows[0]?.integrity_check !== 'ok' || (await destination.execute('PRAGMA foreign_key_check')).rows.length) throw new Error('La base de datos copiada no supera la comprobación de integridad.');
    for (const table of Object.keys(columns)) {
      if (Number((await destination.execute(`SELECT COUNT(*) AS total FROM ${table}`)).rows[0].total) !== rows[table].length) throw new Error('El número de registros no coincide.');
    }
    await writeFile(path.join(staging, 'migration-manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), users: rows.users.length, resources: rows.resources.length, socialLinks: rows.social_links.length, files: manifest }, null, 2), { mode: 0o600 });
    destination.close();
    console.log(`Copia verificada: ${rows.users.length} usuarios, ${rows.resources.length} recursos y ${manifest.length} archivos. Origen sin modificar.`);
  } finally {
    if (transaction) { try { await transaction.rollback(); } finally { transaction.close(); } }
    destination.close(); source.close(); s3?.destroy();
  }
}

async function run() {
  if (process.argv.includes('--copy-worker')) return migrate();
  const argument = option('--target');
  if (!argument || argument.startsWith('--')) throw new Error('Indica un destino nuevo con --target ./data.');
  const target = path.resolve(argument);
  if (await exists(target)) throw new Error('El destino ya existe. No se sobrescribirá.');
  const staging = path.join(path.dirname(target), `.vamz-migration-${randomUUID()}`);
  const worker = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2), '--copy-worker', '--staging', staging], { stdio: 'inherit', env: process.env, windowsHide: true });
  if (worker.status !== 0) throw new Error('La copia no terminó correctamente. No se activará el destino.');
  if (await exists(target)) throw new Error('El destino apareció durante la copia. No se sobrescribirá.');
  await rename(staging, target);
  console.log('Directorio de datos preparado.');
}

run().catch(error => {
  // Los errores del proveedor pueden contener URLs o credenciales; no se imprimen.
  console.error(error.constructor === Error ? error.message : 'La copia falló. Revisa la conexión y las credenciales del origen.');
  const diagnostic = [error.name, error.code, error.cause?.code].filter(value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value));
  if (diagnostic.length) console.error(`Diagnóstico: ${diagnostic.join(' / ')}`);
  console.error('No se ha modificado el origen. Si existe un directorio .vamz-migration-*, consérvalo para revisar la copia incompleta.');
  process.exitCode = 1;
});
