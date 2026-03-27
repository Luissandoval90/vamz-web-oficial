import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { getRequestUser } from "@/lib/request-auth";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = getDb();
  const uploadedResources = await db
    .select({
      id: resources.id,
      filename: resources.filename,
      path: resources.path,
      title: resources.title,
      description: resources.description,
      coverPath: resources.coverPath,
      fileSize: resources.fileSize,
      coverSize: resources.coverSize,
      isPublished: resources.isPublished,
      publishedAt: resources.publishedAt,
      createdAt: resources.createdAt,
    })
    .from(resources)
    .where(eq(resources.userId, user.id))
    .orderBy(desc(resources.createdAt));

  return NextResponse.json({ resources: uploadedResources });
}
