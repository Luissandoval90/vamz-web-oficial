import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { resourceReviews } from "@/db/schema";
import { getRequestAdmin } from "@/lib/request-auth";
import { rejectCrossOrigin } from "@/lib/request-origin";
import { readRequestJson } from "@/lib/request-json";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  if (!(await getRequestAdmin(request)))
    return NextResponse.json(
      { error: "Acceso reservado al administrador." },
      { status: 403 },
    );
  const body = (await readRequestJson(request)) as {
    approved?: unknown;
  } | null;
  if (typeof body?.approved !== "boolean")
    return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
  const { reviewId } = await params;
  const updated = await getDb()
    .update(resourceReviews)
    .set({ isApproved: body.approved })
    .where(eq(resourceReviews.id, reviewId))
    .returning({ id: resourceReviews.id });
  return updated.length
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Reseña no encontrada." }, { status: 404 });
}
