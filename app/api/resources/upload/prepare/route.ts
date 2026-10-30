import { rejectCrossOrigin } from "@/lib/request-origin";
import { readRequestJson } from "@/lib/request-json";
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
import { getUserStorageQuotaBytes, isAdminEmail } from "@/lib/admin";
import { minecraftVersionSchema } from "@/lib/minecraft-versions";
import { getLocalUserUsedBytes } from "@/lib/uploads";

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
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const user = await getRequestUser(request);
  if (user && !isAdminEmail(user.email)) return NextResponse.json({ error: "Solo el administrador puede gestionar el contenido." }, { status: 403 });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await readRequestJson(request)) as
    | {
        file?: unknown;
        cover?: unknown;
        publish?: unknown;
        title?: unknown;
        description?: unknown;
        minecraft?: unknown;
      }
    | null;

  const file = parseUploadFile(body?.file);
  const cover = parseUploadFile(body?.cover);
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

  if (body?.minecraft != null) {
    if (!await getRequestAdmin(request, user)) return NextResponse.json({ error: "Solo el administrador puede subir versiones de Minecraft." }, { status: 403 });
    if (!minecraftVersionSchema.safeParse(body.minecraft).success) return NextResponse.json({ error: "Completa la versión, la edición y la plataforma de Minecraft." }, { status: 400 });
  }

  try {
  validateUpload(
    {
      name: file.name,
      size: file.size,
    } as File,
    { label: "archivo principal" },
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
  const ownedBytes = existingResources.reduce((sum, item) => sum + item.fileSize + item.coverSize, 0);
  const ownerUsed = isLocalStorage() ? Math.max(ownedBytes, await getLocalUserUsedBytes(user.id)) : ownedBytes;
  const incomingBytes = file.size + (cover?.size ?? 0);
  const storageLimitBytes = getStorageQuotaBytes();

  if ((!isAdminEmail(user.email) && ownerUsed + incomingBytes > getUserStorageQuotaBytes(user.email)) || currentlyUsedBytes + incomingBytes > storageLimitBytes) {
    return NextResponse.json(
      {
        error: !isAdminEmail(user.email) && ownerUsed + incomingBytes > getUserStorageQuotaBytes(user.email) ? "Tu cuenta tiene 180 MB en total. Elimina algún recurso para liberar espacio." : "No hay espacio suficiente para subir este recurso.",
      },
      { status: 507 },
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
