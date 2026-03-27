import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { getRequestAdmin, getRequestUser } from "@/lib/request-auth";
import {
  deleteStoredFile,
  getContentTypeFromFilename,
  getStoredFileBuffer,
} from "@/lib/uploads";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    resourceId: string;
  }>;
};

const getSafeDownloadFilename = (filename: string) => {
  const dotIndex = filename.lastIndexOf(".");
  const extension = dotIndex >= 0 ? filename.slice(dotIndex) : "";
  const basename = dotIndex >= 0 ? filename.slice(0, dotIndex) : filename;
  const safeBasename =
    basename
      .replace(/[^\x20-\x7E]+/g, "-")
      .replace(/["\\]/g, "")
      .trim() || "resource";

  return `${safeBasename}${extension}`;
};

const createContentDisposition = (filename: string, shouldDownload: boolean) => {
  const dispositionType = shouldDownload ? "attachment" : "inline";
  const safeFilename = getSafeDownloadFilename(filename);
  const encodedFilename = encodeURIComponent(filename);

  return `${dispositionType}; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getRequestUser(request);
  const shouldDownload = request.nextUrl.searchParams.get("download") === "1";

  const { resourceId } = await context.params;
  const db = getDb();
  const [resource] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, resourceId))
    .limit(1);

  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const canAccessPrivateResource =
    user && (user.id === resource.userId || isAdminEmail(user.email));

  if (!resource.isPublished && !canAccessPrivateResource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  let file: Awaited<ReturnType<typeof getStoredFileBuffer>>;

  try {
    file = await getStoredFileBuffer(resource.path);
  } catch {
    return NextResponse.json({ error: "File is missing from storage." }, { status: 404 });
  }

  return new NextResponse(file.buffer, {
    headers: {
      "Content-Disposition": createContentDisposition(resource.filename, shouldDownload),
      "Content-Type": file.contentType || getContentTypeFromFilename(resource.filename),
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = await getRequestAdmin(request, user);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        isPublished?: unknown;
      }
    | null;

  if (typeof body?.isPublished !== "boolean") {
    return NextResponse.json({ error: "Invalid publish value." }, { status: 400 });
  }

  const { resourceId } = await context.params;
  const db = getDb();
  const [resource] = await db
    .update(resources)
    .set({
      isPublished: body.isPublished,
      publishedAt: body.isPublished ? new Date().toISOString() : null,
    })
    .where(and(eq(resources.id, resourceId), eq(resources.userId, admin.id)))
    .returning({
      id: resources.id,
      isPublished: resources.isPublished,
      publishedAt: resources.publishedAt,
    });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  return NextResponse.json({ resource });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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
  const [resource] = await db
    .delete(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.userId, admin.id)))
    .returning({
      id: resources.id,
      path: resources.path,
      coverPath: resources.coverPath,
    });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  await deleteStoredFile(resource.path);
  await deleteStoredFile(resource.coverPath);

  return NextResponse.json({ success: true });
}
