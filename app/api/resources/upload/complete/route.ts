import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { getRequestAdmin, getRequestUser } from "@/lib/request-auth";
import { getStoredFileSize, getStorageQuotaBytes, isOwnedUploadKey, StorageError, validateUpload } from "@/lib/uploads";
import { resourceMetadataSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => null) as { fileName?: unknown; fileKey?: unknown; coverKey?: unknown; publish?: unknown; title?: unknown; description?: unknown } | null;
  if (typeof body?.fileName !== "string" || typeof body.fileKey !== "string" || !isOwnedUploadKey(body.fileKey, user.id) || (body.coverKey != null && (typeof body.coverKey !== "string" || !isOwnedUploadKey(body.coverKey, user.id) || body.coverKey === body.fileKey))) {
    return NextResponse.json({ error: "No se pudo validar la propiedad de los archivos." }, { status: 400 });
  }
  const fileName = body.fileName;
  const fileKey = body.fileKey;
  const coverKey = typeof body.coverKey === "string" ? body.coverKey : null;
  const shouldPublish = body.publish === true;
  const metadataResult = resourceMetadataSchema.safeParse({ title: body.title, description: body.description });
  if (!metadataResult.success) return NextResponse.json({ error: metadataResult.error.issues[0]?.message ?? "Metadatos no válidos." }, { status: 400 });
  if (shouldPublish && !await getRequestAdmin(request, user)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const [fileSize, coverSize] = await Promise.all([getStoredFileSize(fileKey), coverKey ? getStoredFileSize(coverKey) : Promise.resolve(0)]);
    validateUpload({ name: fileName, size: fileSize });
    if (coverKey) validateUpload({ name: coverKey, size: coverSize }, { imageOnly: true, label: "portada" });
    const db = getDb();
    const resource = await db.transaction(async tx => {
      const [existing] = await tx.select().from(resources).where(and(eq(resources.path, fileKey), eq(resources.userId, user.id))).limit(1);
      if (existing) return existing;
      const owned = await tx.select({ fileSize: resources.fileSize, coverSize: resources.coverSize }).from(resources).where(eq(resources.userId, user.id));
      const used = owned.reduce((sum, item) => sum + item.fileSize + item.coverSize, 0);
      if (used + fileSize + coverSize > getStorageQuotaBytes()) throw new StorageError("No hay espacio suficiente para publicar el recurso.", 507);
      const [created] = await tx.insert(resources).values({
        id: crypto.randomUUID(), userId: user.id, filename: fileName, path: fileKey,
        title: metadataResult.data.title || null, description: metadataResult.data.description || null,
        coverPath: coverKey, fileSize, coverSize, isPublished: shouldPublish, publishedAt: shouldPublish ? new Date().toISOString() : null,
      }).returning();
      return created;
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof StorageError ? error.message : "No se pudo finalizar la publicación. Puedes volver a intentarlo." }, { status: error instanceof StorageError ? error.status : 500 });
  }
}
