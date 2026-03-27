import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { getRequestAdmin, getRequestUser } from "@/lib/request-auth";
import { deleteStoredFile, getStoredFileSize, storedFileExists } from "@/lib/uploads";
import { resourceMetadataSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        fileName?: unknown;
        fileKey?: unknown;
        coverKey?: unknown;
        publish?: unknown;
        title?: unknown;
        description?: unknown;
      }
    | null;

  if (typeof body?.fileName !== "string" || typeof body?.fileKey !== "string") {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const coverKey = typeof body.coverKey === "string" ? body.coverKey : null;

  const shouldPublish = body.publish === true;
  const metadataResult = resourceMetadataSchema.safeParse({
    title: body.title,
    description: body.description,
  });

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

  const fileExists = await storedFileExists(body.fileKey);
  const coverExists = coverKey ? await storedFileExists(coverKey) : false;

  if (!fileExists) {
    return NextResponse.json({ error: "El archivo principal no termino de subirse a R2." }, { status: 400 });
  }

  if (body.coverKey && !coverExists) {
    return NextResponse.json({ error: "La portada no termino de subirse a R2." }, { status: 400 });
  }

  const [fileSize, coverSize] = await Promise.all([
    getStoredFileSize(body.fileKey),
    coverKey ? getStoredFileSize(coverKey) : Promise.resolve(0),
  ]);

  const db = getDb();
  const resourceId = crypto.randomUUID();
  const publishedAt = shouldPublish ? new Date().toISOString() : null;
  const metadata = metadataResult.data;

  try {
    await db.insert(resources).values({
      id: resourceId,
      userId: user.id,
      filename: body.fileName,
      path: body.fileKey,
      title: metadata.title || null,
      description: metadata.description || null,
      coverPath: coverKey,
      fileSize,
      coverSize,
      isPublished: shouldPublish,
      publishedAt,
    });

    return NextResponse.json(
      {
        resource: {
          id: resourceId,
          filename: body.fileName,
          path: body.fileKey,
          title: metadata.title || null,
          description: metadata.description || null,
          coverPath: coverKey,
          fileSize,
          coverSize,
          isPublished: shouldPublish,
          publishedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    await deleteStoredFile(body.fileKey);
    await deleteStoredFile(coverKey);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed.",
      },
      { status: 400 },
    );
  }
}
