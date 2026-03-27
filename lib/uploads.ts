import "server-only";

import path from "node:path";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { getEnv } from "@/lib/env";
import { getR2BucketName, getR2Client, normalizeStoredObjectKey } from "@/lib/r2";
import { getFileExtension, imageExtensions } from "@/lib/resource-utils";

export const getStorageQuotaBytes = () => getEnv().RESOURCE_STORAGE_LIMIT_MB * 1024 * 1024;

const mimeTypes: Record<string, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  json: "application/json",
  mcaddon: "application/zip",
  mcpack: "application/zip",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain; charset=utf-8",
  webp: "image/webp",
  zip: "application/zip",
};

const sanitizeFilename = (filename: string) => filename.replace(/[^a-zA-Z0-9._-]/g, "-");

const createStoredFilename = (filename: string) => {
  const extension = path.extname(filename);
  const basename = path.basename(filename, extension);
  const safeBasename = sanitizeFilename(basename).slice(0, 64) || "file";
  const suffix = `${Date.now()}-${crypto.randomUUID()}`;

  return `${safeBasename}-${suffix}${extension}`;
};

type ValidateUploadOptions = {
  maxSizeInBytes?: number;
  required?: boolean;
  label?: string;
  imageOnly?: boolean;
};

export const validateUpload = (
  file: File | null,
  {
    maxSizeInBytes,
    required = true,
    label = "file",
    imageOnly = false,
  }: ValidateUploadOptions = {},
) => {
  if (!file || file.size === 0) {
    if (!required) {
      return;
    }

    throw new Error(`Please choose a ${label} to upload.`);
  }

  if (imageOnly && !imageExtensions.has(getFileExtension(file.name))) {
    throw new Error("The cover must be an image file.");
  }

  if (
    typeof maxSizeInBytes === "number" &&
    Number.isFinite(maxSizeInBytes) &&
    maxSizeInBytes > 0 &&
    file.size > maxSizeInBytes
  ) {
    const sizeInMb = Math.round(maxSizeInBytes / (1024 * 1024));
    throw new Error(`${label[0]?.toUpperCase() ?? "F"}${label.slice(1)} must be ${sizeInMb} MB or smaller.`);
  }
};

type SaveUploadedFileOptions = ValidateUploadOptions;

export const saveUploadedFile = async (file: File, options: SaveUploadedFileOptions = {}) => {
  validateUpload(file, options);

  const storedFilename = createStoredFilename(file.name);
  const objectKey = normalizeStoredObjectKey(path.join("uploads", storedFilename));
  const bytes = Buffer.from(await file.arrayBuffer());
  const bucket = getR2BucketName();
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: bytes,
      ContentLength: bytes.length,
      ContentType: getContentTypeFromFilename(file.name),
    }),
  );

  return {
    diskPath: objectKey,
    storedFilename,
    relativePath: objectKey,
    size: bytes.length,
  };
};

export const resolveStoredFilePath = (relativePath: string) => normalizeStoredObjectKey(relativePath);

export const deleteStoredFile = async (relativePath: string | null | undefined) => {
  if (!relativePath) {
    return;
  }

  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: getR2BucketName(),
        Key: resolveStoredFilePath(relativePath),
      }),
    );
  } catch (error) {
    throw error;
  }
};

export const getStoredFileSize = async (relativePath: string | null | undefined) => {
  if (!relativePath) {
    return 0;
  }

  try {
    const result = await getR2Client().send(
      new HeadObjectCommand({
        Bucket: getR2BucketName(),
        Key: resolveStoredFilePath(relativePath),
      }),
    );

    return result.ContentLength ?? 0;
  } catch {
    return 0;
  }
};

export const getStoredFileBuffer = async (relativePath: string | null | undefined) => {
  if (!relativePath) {
    throw new Error("Stored file path is required.");
  }

  const result = await getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: resolveStoredFilePath(relativePath),
    }),
  );

  if (!result.Body) {
    throw new Error("Stored file body is empty.");
  }

  const bytes = await result.Body.transformToByteArray();

  return {
    buffer: Buffer.from(bytes),
    contentType: result.ContentType ?? getContentTypeFromFilename(relativePath),
  };
};

export const getContentTypeFromFilename = (filename: string) => {
  const extension = path.extname(filename).replace(".", "").toLowerCase();
  return mimeTypes[extension] ?? "application/octet-stream";
};
