import path from "node:path";
import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, realpath, statfs, link, unlink } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { randomUUID } from "node:crypto";

export class StorageError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const validateObjectKey = (key: string) => {
  const parts = key.split("/");
  if (!key.startsWith("uploads/") || key.length > 512 || !/^[a-zA-Z0-9/_.-]+$/.test(key) || parts.some(part => !part || part === "." || part === "..")) {
    throw new StorageError("Ruta de archivo no válida.");
  }
  return key;
};

export const resolveLocalFile = async (root: string, key: string, createParent = false) => {
  validateObjectKey(key);
  if (createParent) await mkdir(root, { recursive: true, mode: 0o750 });
  const base = await realpath(root);
  const parts = key.split("/");
  let parent = base;
  for (const part of parts.slice(0, -1)) {
    parent = path.join(parent, part);
    if (createParent) await mkdir(parent, { mode: 0o750 }).catch(error => {
      if (error.code !== "EEXIST") throw error;
    });
    const info = await lstat(parent);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new StorageError("Directorio de almacenamiento no válido.");
  }
  const file = path.join(parent, parts[parts.length - 1]);
  const info = await lstat(file).catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (info && (info.isSymbolicLink() || !info.isFile())) throw new StorageError("Archivo de almacenamiento no válido.");
  return file;
};

export const getLocalStorageUsage = async (root: string): Promise<number> => {
  let used = 0;
  const entries = await readdir(root, { withFileTypes: true }).catch(error => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  for (const entry of entries) {
    const location = path.join(root, entry.name);
    if (entry.isSymbolicLink()) throw new StorageError("El almacenamiento contiene un enlace no permitido.");
    if (entry.isDirectory()) used += await getLocalStorageUsage(location);
    else if (entry.isFile()) used += (await lstat(location)).size;
  }
  return used;
};

const activeUploads = new Map<string, number>();

export const writeLocalUpload = async ({ root, key, body, expectedSize, quotaBytes, minimumFreeBytes = 0, signal }: {
  root: string;
  key: string;
  body: ReadableStream<Uint8Array>;
  expectedSize: number;
  quotaBytes: number;
  minimumFreeBytes?: number;
  signal?: AbortSignal;
}) => {
  if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0) throw new StorageError("Tamaño de archivo no válido.");
  validateObjectKey(key);
  if (activeUploads.has(key)) throw new StorageError("Este archivo ya se está subiendo.", 409);
  if (activeUploads.size >= 2) throw new StorageError("Hay otras subidas en curso. Inténtalo en un momento.", 503);
  activeUploads.set(key, expectedSize);
  let temporary: string | null = null;
  try {
    const file = await resolveLocalFile(root, key, true);
    const pending = [...activeUploads.entries()].reduce((sum, [other, size]) => sum + (other === key ? 0 : size), 0);
    const [used, disk] = await Promise.all([getLocalStorageUsage(root), statfs(root)]);
    if (used + pending + expectedSize > quotaBytes || Number(disk.bavail) * Number(disk.bsize) - pending - expectedSize < minimumFreeBytes) {
      throw new StorageError("No hay espacio suficiente para completar la subida.", 507);
    }
    temporary = `${file}.part-${randomUUID()}`;
    const handle = await open(temporary, "wx", 0o640);
    let received = 0;
    const counter = new Transform({ transform(chunk, _encoding, callback) {
      received += chunk.length;
      callback(received > expectedSize ? new StorageError("El archivo supera el tamaño autorizado.", 413) : null, chunk);
    } });
    await pipeline(Readable.fromWeb(body as NodeReadableStream<Uint8Array>), counter, handle.createWriteStream(), { signal });
    if (received !== expectedSize) throw new StorageError("La subida quedó incompleta.");
    await link(temporary, file).catch(error => {
      if (error.code === "EEXIST") throw new StorageError("Este archivo ya existe.", 409);
      throw error;
    });
    return received;
  } finally {
    if (temporary) await unlink(temporary).catch(() => undefined);
    activeUploads.delete(key);
  }
};

export const parseByteRange = (range: string | null, size: number) => {
  if (!range) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2]) || size === 0) throw new StorageError("Rango no disponible.", 416);
  const suffix = !match[1];
  const start = suffix ? Math.max(0, size - Number(match[2])) : Number(match[1]);
  const end = suffix || !match[2] ? size - 1 : Math.min(Number(match[2]), size - 1);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) throw new StorageError("Rango no disponible.", 416);
  return { start, end };
};

export const openLocalStream = async (root: string, key: string, range: string | null = null) => {
  const file = await resolveLocalFile(root, key);
  const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    const info = await handle.stat();
    if (!info.isFile()) throw new StorageError("Archivo no disponible.", 404);
    const selection = parseByteRange(range, info.size);
    return {
      stream: Readable.toWeb(handle.createReadStream(selection ?? {})) as ReadableStream<Uint8Array>,
      size: selection ? selection.end - selection.start + 1 : info.size,
      totalSize: info.size,
      contentRange: selection ? `bytes ${selection.start}-${selection.end}/${info.size}` : undefined,
      modifiedAt: info.mtime.toUTCString(),
    };
  } catch (error) {
    await handle.close();
    throw error;
  }
};
