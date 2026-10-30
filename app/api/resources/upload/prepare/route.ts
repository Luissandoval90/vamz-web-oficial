import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { getRequestAdmin, getRequestUser } from "@/lib/request-auth";
import {
  createPresignedUploadUrl,
  createStoredObjectKey,
  getStorageQuotaBytes,
  getLocalUsedBytes,
  isLocalStorage,
  StorageError,
  validateUpload,
} from "@/lib/uploads";
import { resourceMetadataSchema } from "@/lib/validators";

export const runtime = "nodejs";

const parseUploadFile = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    name?: unknown;
    size?: unknown;
    type?: unknown;
  };

  if (typeof candidate.name !== "string" || typeof candidate.size !== "number") {
    return null;
  }

  return {
    name: candidate.name,
    size: candidate.size,
    type: typeof candidate.type === "string" ? candidate.type : "application/octet-stream",
  };
};

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        file?: unknown;
        cover?: unknown;
        publish?: unknown;
        title?: unknown;
        description?: unknown;
      }
    | null;

  const file = parseUploadFile(body?.file);
  const cover = parseUploadFile(body?.cover);
  const shouldPublish = body?.publish === true;
  const metadataResult = resourceMetadataSchema.safeParse({
    title: body?.title,
    description: body?.description,
  });

  if (!file) {
    return NextResponse.json({ error: "Please choose a valid file." }, { status: 400 });
  }

  if (!metadataResult.success) {
    return NextResponse.json(
      { error: metadataResult.error.issues[0]?.message ?? "Invalid metadata." },
      { status: 400 },
    );
  }

  if (shouldPublish) {
    const admin = await getRequestAdmin(request, user);

    if (!admin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  try {
  validateUpload(
    {
      name: file.name,
      size: file.size,
    } as File,
    { label: "file" },
  );

  if (cover) {
    validateUpload(
      {
        name: cover.name,
        size: cover.size,
      } as File,
      { label: "cover", imageOnly: true },
    );
  }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Archivo no válido." }, { status: error instanceof StorageError ? error.status : 400 });
  }

  const db = getDb();
  const existingResources = await db
    .select({
      fileSize: resources.fileSize,
      coverSize: resources.coverSize,
    })
    .from(resources)
    .where(eq(resources.userId, user.id));
  const currentlyUsedBytes = isLocalStorage() ? await getLocalUsedBytes() : existingResources.reduce(
    (sum, resource) => sum + resource.fileSize + resource.coverSize,
    0,
  );
  const incomingBytes = file.size + (cover?.size ?? 0);
  const storageLimitBytes = getStorageQuotaBytes();

  if (currentlyUsedBytes + incomingBytes > storageLimitBytes) {
    return NextResponse.json(
      {
        error: "No hay espacio suficiente para subir este recurso.",
      },
      { status: 400 },
    );
  }

  const fileKey = createStoredObjectKey(file.name, user.id);
  const coverKey = cover ? createStoredObjectKey(cover.name, user.id) : null;

  const [fileUploadUrl, coverUploadUrl] = await Promise.all([
    createPresignedUploadUrl(fileKey, file.type, 900, { userId: user.id, size: file.size }),
    coverKey && cover ? createPresignedUploadUrl(coverKey, cover.type, 900, { userId: user.id, size: cover.size }) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    file: {
      key: fileKey,
      uploadUrl: fileUploadUrl,
      contentType: file.type,
      size: file.size,
      originalName: file.name,
    },
    cover: cover && coverKey && coverUploadUrl
      ? {
          key: coverKey,
          uploadUrl: coverUploadUrl,
          contentType: cover.type,
          size: cover.size,
          originalName: cover.name,
        }
      : null,
  });
}
