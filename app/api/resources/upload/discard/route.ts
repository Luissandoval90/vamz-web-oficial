import { or, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { getRequestAdmin } from "@/lib/request-auth";
import { rejectCrossOrigin } from "@/lib/request-origin";
import { readRequestJson } from "@/lib/request-json";
import { deleteStoredFile, isOwnedUploadKey } from "@/lib/uploads";

export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const user = await getRequestAdmin(request);
  if (!user)
    return NextResponse.json(
      { error: "Acceso reservado al administrador." },
      { status: 403 },
    );
  const body = (await readRequestJson(request)) as { keys?: unknown } | null;
  if (
    !Array.isArray(body?.keys) ||
    body.keys.length > 2 ||
    body.keys.some(
      (key) => typeof key !== "string" || !isOwnedUploadKey(key, user.id),
    )
  )
    return NextResponse.json(
      { error: "Archivos no válidos." },
      { status: 400 },
    );
  let discarded = 0;
  for (const key of body.keys as string[]) {
    const [existing] = await getDb()
      .select({ id: resources.id })
      .from(resources)
      .where(or(eq(resources.path, key), eq(resources.coverPath, key)))
      .limit(1);
    if (!existing) {
      await deleteStoredFile(key);
      discarded++;
    }
  }
  return NextResponse.json({ discarded });
}
