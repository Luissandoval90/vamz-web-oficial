import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { resources, resourceReviews } from "@/db/schema";
import { getRequestUser } from "@/lib/request-auth";
import { rejectCrossOrigin } from "@/lib/request-origin";
import { readRequestJson } from "@/lib/request-json";
import { limitPublicAction } from "@/lib/auth-rate-limit";
import {
  getResourceReviews,
  getResourceSummary,
} from "@/lib/resource-engagement";

type Context = { params: Promise<{ resourceId: string }> };
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z
    .string()
    .trim()
    .min(8, "Escribe al menos 8 caracteres.")
    .max(1500, "La reseña admite hasta 1500 caracteres."),
});
async function findResource(resourceId: string) {
  return (
    await getDb()
      .select({ id: resources.id, userId: resources.userId })
      .from(resources)
      .where(and(eq(resources.id, resourceId), eq(resources.isPublished, true)))
      .limit(1)
  )[0];
}
export async function GET(request: NextRequest, { params }: Context) {
  const { resourceId } = await params;
  if (!(await findResource(resourceId)))
    return NextResponse.json(
      { error: "Recurso no encontrado." },
      { status: 404 },
    );
  const user = await getRequestUser(request);
  const [data, summary] = await Promise.all([
    getResourceReviews(resourceId, user?.id),
    getResourceSummary(resourceId),
  ]);
  return NextResponse.json(
    { ...data, summary },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: NextRequest, { params }: Context) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const user = await getRequestUser(request);
  if (!user)
    return NextResponse.json(
      { error: "Inicia sesión para escribir una reseña." },
      { status: 401 },
    );
  const limited = await limitPublicAction(
    request,
    "write-review",
    10,
    3600,
    user.id,
  );
  if (limited) return limited;
  const { resourceId } = await params;
  const resource = await findResource(resourceId);
  if (!resource)
    return NextResponse.json(
      { error: "Recurso no encontrado." },
      { status: 404 },
    );
  if (resource.userId === user.id)
    return NextResponse.json(
      { error: "No puedes valorar tu propia publicación." },
      { status: 403 },
    );
  const parsed = reviewSchema.safeParse(await readRequestJson(request));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Revisa la reseña." },
      { status: 400 },
    );
  const now = new Date().toISOString();
  await getDb()
    .insert(resourceReviews)
    .values({
      id: crypto.randomUUID(),
      resourceId,
      userId: user.id,
      ...parsed.data,
      isApproved: false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [resourceReviews.resourceId, resourceReviews.userId],
      set: { ...parsed.data, isApproved: false, updatedAt: now },
    });
  return NextResponse.json(
    {
      message:
        "Tu reseña está pendiente de revisión. Gracias por compartir tu experiencia.",
    },
    { status: 201 },
  );
}
export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const user = await getRequestUser(request);
  if (!user)
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { resourceId } = await params;
  await getDb()
    .delete(resourceReviews)
    .where(
      and(
        eq(resourceReviews.resourceId, resourceId),
        eq(resourceReviews.userId, user.id),
      ),
    );
  return NextResponse.json({ success: true });
}
