import "server-only";
import path from "node:path";
import { lstat, unlink } from "node:fs/promises";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SignJWT, jwtVerify } from "jose";
import { getEnv, getLocalStorageRoot } from "@/lib/env";
import { getR2BucketName, getR2Client } from "@/lib/r2";
import { getFileExtension, imageExtensions } from "@/lib/resource-utils";
import { getLocalStorageUsage, openLocalStream, resolveLocalFile, StorageError, validateObjectKey, writeLocalUpload } from "@/lib/local-storage";

export { StorageError };
export const isLocalStorage = () => getEnv().STORAGE_DRIVER === "local";
export const getStorageQuotaBytes = () => getEnv().RESOURCE_STORAGE_LIMIT_MB * 1024 * 1024;
export const getLocalUsedBytes = () => getLocalStorageUsage(getLocalStorageRoot());
export const getLocalUserUsedBytes = (userId: string) => {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(userId)) throw new StorageError("Usuario no válido.");
  return getLocalStorageUsage(path.join(getLocalStorageRoot(), "uploads", userId));
};

const mimeTypes: Record<string, string> = {
  avif: "image/avif", bmp: "image/bmp", gif: "image/gif", jpeg: "image/jpeg", jpg: "image/jpeg",
  json: "application/json", mcaddon: "application/zip", mcpack: "application/zip", pdf: "application/pdf",
  png: "image/png", svg: "image/svg+xml", txt: "text/plain; charset=utf-8", webp: "image/webp", zip: "application/zip",
};
export const getContentTypeFromFilename = (filename: string) => mimeTypes[getFileExtension(filename)] ?? "application/octet-stream";

export const createStoredFilename = (filename: string) => {
  const extension = path.extname(filename).replace(/[^a-zA-Z0-9.]/g, "").slice(0, 16);
  const basename = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 64) || "file";
  return `${basename}-${crypto.randomUUID()}${extension}`;
};
export const createStoredObjectKey = (filename: string, ownerId?: string) => {
  if (ownerId && !/^[a-zA-Z0-9_-]{1,80}$/.test(ownerId)) throw new StorageError("Usuario no válido.");
  return `uploads/${ownerId ? ownerId + "/" : ""}${createStoredFilename(filename)}`;
};
export const isOwnedUploadKey = (key: string, ownerId: string) => {
  try { return validateObjectKey(key).startsWith(`uploads/${ownerId}/`); } catch { return false; }
};

type ValidateUploadOptions = { maxSizeInBytes?: number; required?: boolean; label?: string; imageOnly?: boolean; ownerId?: string; ownerQuotaBytes?: number };
export const validateUpload = (file: Pick<File, "name" | "size"> | null, { maxSizeInBytes, required = true, label = "archivo", imageOnly = false }: ValidateUploadOptions = {}) => {
  if (!file || file.size === 0) {
    if (!required) return;
    throw new StorageError(`Selecciona un ${label} válido.`);
  }
  if (!Number.isSafeInteger(file.size) || file.size < 1 || !file.name || file.name.length > 512) throw new StorageError("Archivo no válido.");
  if (imageOnly && !imageExtensions.has(getFileExtension(file.name))) throw new StorageError("La portada debe ser una imagen.");
  const limit = maxSizeInBytes ?? (imageOnly ? 16 : getEnv().MAX_UPLOAD_MB) * 1024 * 1024;
  if (file.size > limit) throw new StorageError(`El ${label} supera el máximo de ${Math.round(limit / 1024 / 1024)} MB.`, 413);
};

export const saveUploadedFile = async (file: File, options: ValidateUploadOptions = {}) => {
  validateUpload(file, options);
  const objectKey = createStoredObjectKey(file.name, options.ownerId);
  if (isLocalStorage()) {
    await writeLocalUpload({ root: getLocalStorageRoot(), key: objectKey, body: file.stream(), expectedSize: file.size, quotaBytes: getStorageQuotaBytes(), ownerQuotaBytes: options.ownerQuotaBytes, minimumFreeBytes: getEnv().MIN_FREE_SPACE_MB * 1024 * 1024 });
  } else {
    await getR2Client().send(new PutObjectCommand({ Bucket: getR2BucketName(), Key: objectKey, Body: Buffer.from(await file.arrayBuffer()), ContentLength: file.size, ContentType: getContentTypeFromFilename(file.name) }));
  }
  return { diskPath: objectKey, storedFilename: path.basename(objectKey), relativePath: objectKey, size: file.size };
};

export const createPresignedUploadUrl = async (objectKey: string, contentType: string, expiresInSeconds = 900, local?: { userId: string; size: number }) => {
  validateObjectKey(objectKey);
  if (!isLocalStorage()) return getSignedUrl(getR2Client(), new PutObjectCommand({ Bucket: getR2BucketName(), Key: objectKey, ContentType: contentType || "application/octet-stream" }), { expiresIn: expiresInSeconds });
  if (!local || !isOwnedUploadKey(objectKey, local.userId)) throw new StorageError("No se pudo autorizar la subida.");
  const token = await new SignJWT({ key: objectKey, size: local.size }).setProtectedHeader({ alg: "HS256", typ: "vamz-upload+jwt" })
    .setSubject(local.userId).setAudience("vamz-local-upload").setIssuedAt().setExpirationTime(`${expiresInSeconds}s`)
    .sign(new TextEncoder().encode(getEnv().JWT_SECRET));
  return `/api/resources/upload/local?token=${encodeURIComponent(token)}`;
};

export const verifyLocalUploadToken = async (token: string, userId: string) => {
  const { payload, protectedHeader } = await jwtVerify(token, new TextEncoder().encode(getEnv().JWT_SECRET), { algorithms: ["HS256"], audience: "vamz-local-upload", subject: userId });
  if (protectedHeader.typ !== "vamz-upload+jwt" || typeof payload.key !== "string" || !isOwnedUploadKey(payload.key, userId) || typeof payload.size !== "number" || !Number.isSafeInteger(payload.size) || payload.size < 1 || payload.size > getEnv().MAX_UPLOAD_MB * 1024 * 1024) throw new StorageError("Autorización de subida no válida.", 403);
  return { key: payload.key, size: payload.size };
};

export const deleteStoredFile = async (key: string | null | undefined) => {
  if (!key) return;
  validateObjectKey(key);
  if (isLocalStorage()) {
    const file = await resolveLocalFile(getLocalStorageRoot(), key).catch(error => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (file) await unlink(file).catch(error => { if (error.code !== "ENOENT") throw error; });
  } else await getR2Client().send(new DeleteObjectCommand({ Bucket: getR2BucketName(), Key: key }));
};

export const getStoredFileSize = async (key: string | null | undefined) => {
  if (!key) return 0;
  validateObjectKey(key);
  try {
    if (isLocalStorage()) return (await lstat(await resolveLocalFile(getLocalStorageRoot(), key))).size;
    return (await getR2Client().send(new HeadObjectCommand({ Bucket: getR2BucketName(), Key: key }))).ContentLength ?? 0;
  } catch (error) {
    if (error instanceof StorageError) throw error;
    return 0;
  }
};
export const storedFileExists = async (key: string | null | undefined) => (await getStoredFileSize(key)) > 0;

export const getStoredFileStream = async (key: string, range: string | null = null) => {
  validateObjectKey(key);
  if (isLocalStorage()) return { ...await openLocalStream(getLocalStorageRoot(), key, range), contentType: getContentTypeFromFilename(key) };
  try {
    const result = await getR2Client().send(new GetObjectCommand({ Bucket: getR2BucketName(), Key: key, ...(range ? { Range: range } : {}) }));
    if (!result.Body) throw new StorageError("Archivo no disponible.", 404);
    return { stream: result.Body.transformToWebStream() as ReadableStream<Uint8Array>, size: result.ContentLength ?? 0, contentRange: result.ContentRange, modifiedAt: result.LastModified?.toUTCString(), contentType: result.ContentType ?? getContentTypeFromFilename(key) };
  } catch (error) {
    if (error instanceof Error && error.name === "InvalidRange") throw new StorageError("Rango no disponible.", 416);
    throw error;
  }
};
