import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { resources, minecraftVersions } from "@/db/schema";
import { getRequestAdmin, getRequestUser } from "@/lib/request-auth";
import { getStoredFileSize, getStorageQuotaBytes, isOwnedUploadKey, StorageError, validateUpload } from "@/lib/uploads";
import { resourceMetadataSchema } from "@/lib/validators";
import { getUserStorageQuotaBytes } from "@/lib/admin";
import { minecraftVersionSchema } from "@/lib/minecraft-versions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => null) as { fileName?: unknown; fileKey?: unknown; coverKey?: unknown; publish?: unknown; title?: unknown; description?: unknown; minecraft?: unknown } | null;
  if (typeof body?.fileName !== "string" || typeof body.fileKey !== "string" || !isOwnedUploadKey(body.fileKey, user.id) || (body.coverKey != null && (typeof body.coverKey !== "string" || !isOwnedUploadKey(body.coverKey, user.id) || body.coverKey === body.fileKey))) {
    return NextResponse.json({ error: "No se pudo validar la propiedad de los archivos." }, { status: 400 });
  }
  const fileName = body.fileName;
  const fileKey = body.fileKey;
  const coverKey = typeof body.coverKey === "string" ? body.coverKey : null;
  const shouldPublish = body.publish === true;
  const metadataResult = resourceMetadataSchema.safeParse({ title: body.title, description: body.description });
  if (!metadataResult.success) return NextResponse.json({ error: metadataResult.error.issues[0]?.message ?? "Metadatos no válidos." }, { status: 400 });
  if (body.minecraft != null && !await getRequestAdmin(request, user)) return NextResponse.json({ error: "Solo el administrador puede subir versiones de Minecraft." }, { status: 403 });
  const version = body.minecraft == null ? null : minecraftVersionSchema.safeParse(body.minecraft);
  if (version && !version.success) return NextResponse.json({ error: "Completa los datos de la versión de Minecraft." }, { status: 400 });
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
      if (used + fileSize + coverSize > Math.min(getStorageQuotaBytes(), getUserStorageQuotaBytes(user.email))) throw new StorageError("No hay espacio suficiente en tu cuenta para publicar el recurso.", 507);
      const [created] = await tx.insert(resources).values({
        id: crypto.randomUUID(), userId: user.id, filename: fileName, path: fileKey,
        title: metadataResult.data.title || null, description: metadataResult.data.description || null,
        coverPath: coverKey, fileSize, coverSize, isPublished: shouldPublish, publishedAt: shouldPublish ? new Date().toISOString() : null,
      }).returning();
      if (version?.success) await tx.insert(minecraftVersions).values({ resourceId: created.id, ...version.data });
      return created;
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof StorageError ? error.message : "No se pudo finalizar la publicación. Puedes volver a intentarlo." }, { status: error instanceof StorageError ? error.status : 500 });
  }
}
