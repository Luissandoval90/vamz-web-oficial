import { rejectCrossOrigin } from "@/lib/request-origin";
import { readRequestJson } from "@/lib/request-json";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import {
  resources,
  minecraftVersions,
  resourceEvents,
  resourceReviews,
  resourceStats,
} from "@/db/schema";
import {
  getVisitor,
  recordResourceEvent,
  VISITOR_COOKIE,
  visitorCookieOptions,
} from "@/lib/resource-engagement";
import { limitPublicAction } from "@/lib/auth-rate-limit";
import { isAdminEmail } from "@/lib/admin";
import { getRequestUser } from "@/lib/request-auth";
import {
  deleteStoredFile,
  getContentTypeFromFilename,
  getStoredFileStream,
  StorageError,
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

  return `${safeBasename}${extension}`
    .replace(/[^\x20-\x7E]+/g, "-")
    .replace(/["\\]/g, "");
};

const createContentDisposition = (
  filename: string,
  shouldDownload: boolean,
) => {
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

  const canAccessPrivateResource = user && isAdminEmail(user.email);

  if (!resource.isPublished && !canAccessPrivateResource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  let file: Awaited<ReturnType<typeof getStoredFileStream>>;

  try {
    file = await getStoredFileStream(
      resource.path,
      request.headers.get("range"),
    );
  } catch (error) {
    if (error instanceof StorageError && error.status === 416)
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${resource.fileSize}` },
      });
    return NextResponse.json(
      { error: "File is missing from storage." },
      { status: 404 },
    );
  }

  const response = new NextResponse(file.stream, {
    status: file.contentRange ? 206 : 200,
    headers: {
      "Content-Disposition": createContentDisposition(
        resource.filename,
        shouldDownload,
      ),
      "Content-Type":
        file.contentType || getContentTypeFromFilename(resource.filename),
      "Content-Length": String(file.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
      ...(file.contentRange ? { "Content-Range": file.contentRange } : {}),
    },
  });
  if (
    shouldDownload &&
    resource.isPublished &&
    (!file.contentRange || file.contentRange.startsWith("bytes 0-")) &&
    !/bot|crawler|spider|Lighthouse|HeadlessChrome/i.test(
      request.headers.get("user-agent") ?? "",
    )
  ) {
    const visitor = getVisitor(request);
    await (async () => {
      if (!(await limitPublicAction(request, "download-counter", 120, 600)))
        await recordResourceEvent(resource.id, "download", visitor.id);
    })().catch(() => console.error("No se pudo registrar la descarga."));
    if (visitor.fresh)
      response.cookies.set(VISITOR_COOKIE, visitor.id, visitorCookieOptions);
  }
  return response;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const user = await getRequestUser(request);
  if (user && !isAdminEmail(user.email))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await readRequestJson(request)) as {
    isPublished?: unknown;
  } | null;

  if (typeof body?.isPublished !== "boolean") {
    return NextResponse.json(
      { error: "Invalid publish value." },
      { status: 400 },
    );
  }

  const { resourceId } = await context.params;
  const db = getDb();
  const [resource] = await db
    .update(resources)
    .set({
      isPublished: body.isPublished,
      publishedAt: body.isPublished ? new Date().toISOString() : null,
    })
    .where(
      and(
        eq(resources.id, resourceId),
        isAdminEmail(user.email) ? undefined : eq(resources.userId, user.id),
      ),
    )
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
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const user = await getRequestUser(request);
  if (user && !isAdminEmail(user.email))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { resourceId } = await context.params;
  const db = getDb();
  const resource = await db.transaction(async (tx) => {
    const [owned] = await tx
      .select({
        id: resources.id,
        path: resources.path,
        coverPath: resources.coverPath,
      })
      .from(resources)
      .where(
        and(
          eq(resources.id, resourceId),
          isAdminEmail(user.email) ? undefined : eq(resources.userId, user.id),
        ),
      )
      .limit(1);
    if (!owned) return null;
    await tx
      .delete(minecraftVersions)
      .where(eq(minecraftVersions.resourceId, resourceId));
    await tx
      .delete(resourceEvents)
      .where(eq(resourceEvents.resourceId, resourceId));
    await tx
      .delete(resourceReviews)
      .where(eq(resourceReviews.resourceId, resourceId));
    await tx
      .delete(resourceStats)
      .where(eq(resourceStats.resourceId, resourceId));
    await tx.delete(resources).where(eq(resources.id, resourceId));
    return owned;
  });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  await deleteStoredFile(resource.path);
  await deleteStoredFile(resource.coverPath);

  return NextResponse.json({ success: true });
}
