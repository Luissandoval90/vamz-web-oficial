import path from "node:path";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { getRequestUser } from "@/lib/request-auth";
import { getContentTypeFromFilename, getStoredFileStream } from "@/lib/uploads";

type RouteContext = {
  params: Promise<{
    resourceId: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getRequestUser(request);
  const { resourceId } = await context.params;
  const db = getDb();
  const [resource] = await db
    .select({
      id: resources.id,
      userId: resources.userId,
      filename: resources.filename,
      coverPath: resources.coverPath,
      isPublished: resources.isPublished,
    })
    .from(resources)
    .where(eq(resources.id, resourceId))
    .limit(1);

  if (!resource?.coverPath) {
    return NextResponse.json({ error: "Cover not found." }, { status: 404 });
  }

  const canAccessPrivateResource =
    user && (user.id === resource.userId || isAdminEmail(user.email));

  if (!resource.isPublished && !canAccessPrivateResource) {
    return NextResponse.json({ error: "Cover not found." }, { status: 404 });
  }

  try {
    const file = await getStoredFileStream(resource.coverPath);

    return new NextResponse(file.stream, {
      headers: {
        "Content-Disposition": `inline; filename="${path.basename(resource.coverPath)}"`,
        "Content-Type": file.contentType || getContentTypeFromFilename(resource.coverPath),
        "Content-Length": String(file.size),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Cover file is missing from storage." }, { status: 404 });
  }
}
