import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { getRequestAdmin, getRequestUser } from "@/lib/request-auth";
import {
  deleteStoredFile,
  getStorageQuotaBytes,
  saveUploadedFile,
} from "@/lib/uploads";
import { resourceMetadataSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    resourceId: string;
  }>;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = await getRequestAdmin(request, user);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { resourceId } = await context.params;
  const db = getDb();
  const [currentResource] = await db
    .select({
      id: resources.id,
      userId: resources.userId,
      title: resources.title,
      description: resources.description,
      coverPath: resources.coverPath,
      coverSize: resources.coverSize,
      fileSize: resources.fileSize,
    })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.userId, admin.id)))
    .limit(1);

  if (!currentResource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const coverEntry = formData.get("cover");
  const cover = coverEntry instanceof File && coverEntry.size > 0 ? coverEntry : null;
  const removeCover = formData.get("removeCover") === "true";
  const metadataResult = resourceMetadataSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!metadataResult.success) {
    return NextResponse.json(
      { error: metadataResult.error.issues[0]?.message ?? "Invalid metadata." },
      { status: 400 },
    );
  }

  let savedCover: Awaited<ReturnType<typeof saveUploadedFile>> | null = null;

  try {
    const existingResources = await db
      .select({
        id: resources.id,
        fileSize: resources.fileSize,
        coverSize: resources.coverSize,
      })
      .from(resources)
      .where(eq(resources.userId, admin.id));
    const currentlyUsedBytes = existingResources.reduce(
      (sum, resource) => sum + resource.fileSize + resource.coverSize,
      0,
    );
    const nextCoverSizeCandidate =
      removeCover && !cover ? 0 : cover?.size ?? currentResource.coverSize;
    const nextTotalBytes =
      currentlyUsedBytes - currentResource.coverSize + nextCoverSizeCandidate;

    if (nextTotalBytes > getStorageQuotaBytes()) {
      return NextResponse.json(
        {
          error: "No hay espacio suficiente en Cloudflare R2 para actualizar la portada.",
        },
        { status: 400 },
      );
    }

    savedCover = cover
      ? await saveUploadedFile(cover, {
          label: "cover",
          imageOnly: true,
        })
      : null;

    const metadata = metadataResult.data;
    const nextCoverPath =
      removeCover && !savedCover
        ? null
        : savedCover?.relativePath ?? currentResource.coverPath;
    const nextCoverSize =
      removeCover && !savedCover ? 0 : savedCover?.size ?? currentResource.coverSize;

    const [resource] = await db
      .update(resources)
      .set({
        title: metadata.title || null,
        description: metadata.description || null,
        coverPath: nextCoverPath,
        coverSize: nextCoverSize,
      })
      .where(and(eq(resources.id, resourceId), eq(resources.userId, admin.id)))
      .returning({
        id: resources.id,
        title: resources.title,
        description: resources.description,
        coverPath: resources.coverPath,
        coverSize: resources.coverSize,
      });

    if (!resource) {
      if (savedCover) {
        await deleteStoredFile(savedCover.relativePath);
      }

      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    if ((removeCover || savedCover) && currentResource.coverPath) {
      await deleteStoredFile(currentResource.coverPath);
    }

    return NextResponse.json({ resource });
  } catch (error) {
    await deleteStoredFile(savedCover?.relativePath);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo actualizar el recurso.",
      },
      { status: 400 },
    );
  }
}
