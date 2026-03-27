import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { getRequestAdmin, getRequestUser } from "@/lib/request-auth";
import { getStorageQuotaBytes } from "@/lib/uploads";
import {
  deleteStoredFile,
  saveUploadedFile,
} from "@/lib/uploads";
import { resourceMetadataSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const coverEntry = formData.get("cover");
  const cover = coverEntry instanceof File && coverEntry.size > 0 ? coverEntry : null;
  const shouldPublish = formData.get("publish") === "true";
  const metadataResult = resourceMetadataSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!(file instanceof File)) {
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

  const db = getDb();
  const existingResources = await db
    .select({
      fileSize: resources.fileSize,
      coverSize: resources.coverSize,
    })
    .from(resources)
    .where(eq(resources.userId, user.id));
  const currentlyUsedBytes = existingResources.reduce(
    (sum, resource) => sum + resource.fileSize + resource.coverSize,
    0,
  );
  const incomingBytes = file.size + (cover?.size ?? 0);
  const storageLimitBytes = getStorageQuotaBytes();

  if (currentlyUsedBytes + incomingBytes > storageLimitBytes) {
    return NextResponse.json(
      {
        error: "No hay espacio suficiente en Cloudflare R2 para subir este recurso.",
      },
      { status: 400 },
    );
  }

  let savedFile: Awaited<ReturnType<typeof saveUploadedFile>> | null = null;
  let savedCover: Awaited<ReturnType<typeof saveUploadedFile>> | null = null;

  try {
    savedFile = await saveUploadedFile(file, {
      label: "file",
    });
    savedCover = cover
      ? await saveUploadedFile(cover, {
          label: "cover",
          imageOnly: true,
        })
      : null;

    const resourceId = crypto.randomUUID();
    const publishedAt = shouldPublish ? new Date().toISOString() : null;
    const metadata = metadataResult.data;

    await db.insert(resources).values({
      id: resourceId,
      userId: user.id,
      filename: file.name,
      path: savedFile.relativePath,
      title: metadata.title || null,
      description: metadata.description || null,
      coverPath: savedCover?.relativePath ?? null,
      fileSize: savedFile.size,
      coverSize: savedCover?.size ?? 0,
      isPublished: shouldPublish,
      publishedAt,
    });

    return NextResponse.json(
      {
        resource: {
          id: resourceId,
          filename: file.name,
          path: savedFile.relativePath,
          title: metadata.title || null,
          description: metadata.description || null,
          coverPath: savedCover?.relativePath ?? null,
          fileSize: savedFile.size,
          coverSize: savedCover?.size ?? 0,
          isPublished: shouldPublish,
          publishedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    await deleteStoredFile(savedFile?.relativePath);
    await deleteStoredFile(savedCover?.relativePath);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed.",
      },
      { status: 400 },
    );
  }
}
