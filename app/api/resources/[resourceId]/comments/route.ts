import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { resources, resourceComments } from "@/db/schema";
import { getRequestUser } from "@/lib/request-auth";
import { rejectCrossOrigin } from "@/lib/request-origin";
import { readRequestJson } from "@/lib/request-json";
import { limitPublicAction } from "@/lib/auth-rate-limit";
import { isAdminEmail } from "@/lib/admin";
import { getResourceComments } from "@/lib/resource-comments";
type Context = { params: Promise<{ resourceId: string }> };
const schema = z.object({
  body: z
    .string()
    .trim()
    .min(2, "Escribe al menos 2 caracteres.")
    .max(1500, "El comentario admite hasta 1500 caracteres."),
});
async function findResource(id: string) {
  return (
    await getDb()
      .select({ id: resources.id, userId: resources.userId })
      .from(resources)
      .where(and(eq(resources.id, id), eq(resources.isPublished, true)))
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
  return NextResponse.json(await getResourceComments(resourceId, user?.id), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
export async function POST(request: NextRequest, { params }: Context) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const user = await getRequestUser(request);
  if (!user)
    return NextResponse.json(
      { error: "Inicia sesión para comentar." },
      { status: 401 },
    );
  const limited = await limitPublicAction(
    request,
    "write-comment",
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
  const parsed = schema.safeParse(await readRequestJson(request));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const approved = isAdminEmail(user.email);
  await getDb()
    .insert(resourceComments)
    .values({
      id,
      resourceId,
      userId: user.id,
      body: parsed.data.body,
      isApproved: approved,
      createdAt: now,
      updatedAt: now,
    });
  return NextResponse.json(
    {
      comment: { id, approved, isAuthor: user.id === resource.userId },
      message: approved
        ? "Comentario publicado."
        : "Comentario enviado. Puedes verlo aquí mientras se revisa.",
    },
    { status: 201 },
  );
}
