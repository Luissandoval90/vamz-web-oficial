import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { resources, minecraftVersions, users } from "@/db/schema";
import { minecraftVersionSchema } from "@/lib/minecraft-versions";
import { getRequestUser } from "@/lib/request-auth";
import { getUserStorageQuotaBytes, isAdminEmail } from "@/lib/admin";
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
      ownerEmail: users.email,
    })
    .from(resources)
    .innerJoin(users, eq(users.id, resources.userId))
    .where(and(eq(resources.id, resourceId), isAdminEmail(user.email) ? undefined : eq(resources.userId, user.id)))
    .limit(1);

  if (!currentResource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const coverEntry = formData.get("cover");
  const cover = coverEntry instanceof File && coverEntry.size > 0 ? coverEntry : null;
  const removeCover = formData.get("removeCover") === "true";
  const version = formData.has("version") ? minecraftVersionSchema.safeParse({ version: formData.get("version"), edition: formData.get("edition"), platform: formData.get("platform") }) : null;
  if (version && !isAdminEmail(user.email)) return NextResponse.json({ error: "Solo el administrador puede editar versiones de Minecraft." }, { status: 403 });
  if (version && !version.success) return NextResponse.json({ error: "Revisa la versión, la edición y la plataforma." }, { status: 400 });
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
      .where(eq(resources.userId, currentResource.userId));
    const currentlyUsedBytes = existingResources.reduce(
      (sum, resource) => sum + resource.fileSize + resource.coverSize,
      0,
    );
    const nextCoverSizeCandidate =
      removeCover && !cover ? 0 : cover?.size ?? currentResource.coverSize;
    const nextTotalBytes =
      currentlyUsedBytes - currentResource.coverSize + nextCoverSizeCandidate;

    if (nextTotalBytes > Math.min(getStorageQuotaBytes(), getUserStorageQuotaBytes(currentResource.ownerEmail))) {
      return NextResponse.json(
        {
          error: "No hay espacio suficiente para actualizar la portada.",
        },
        { status: 400 },
      );
    }

    savedCover = cover
      ? await saveUploadedFile(cover, {
          label: "cover",
          ownerId: currentResource.userId,
          ownerQuotaBytes: isAdminEmail(currentResource.ownerEmail) ? undefined : getUserStorageQuotaBytes(currentResource.ownerEmail),
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

    const [resource] = await db.transaction(async tx => {
      if (version?.success) await tx.update(minecraftVersions).set(version.data).where(eq(minecraftVersions.resourceId, resourceId));
      return tx
      .update(resources)
      .set({
        title: metadata.title || null,
        description: metadata.description || null,
        coverPath: nextCoverPath,
        coverSize: nextCoverSize,
      })
      .where(and(eq(resources.id, resourceId), isAdminEmail(user.email) ? undefined : eq(resources.userId, user.id)))
      .returning({
        id: resources.id,
        title: resources.title,
        description: resources.description,
        coverPath: resources.coverPath,
        coverSize: resources.coverSize,
      });
    });

    if (!resource) {
      if (savedCover) {
        await deleteStoredFile(savedCover.relativePath);
      }

      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    if ((removeCover || savedCover) && currentResource.coverPath) {
      await deleteStoredFile(currentResource.coverPath).catch(() => {
        console.error("No se pudo eliminar la portada anterior del almacenamiento.");
      });
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
