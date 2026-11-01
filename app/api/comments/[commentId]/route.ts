import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { resourceComments } from "@/db/schema";
import { getRequestUser, getRequestAdmin } from "@/lib/request-auth";
import { rejectCrossOrigin } from "@/lib/request-origin";
import { readRequestJson } from "@/lib/request-json";
import { isAdminEmail } from "@/lib/admin";
type Context = { params: Promise<{ commentId: string }> };
export async function PATCH(request: NextRequest, { params }: Context) {
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
  const { commentId } = await params;
  const rows = await getDb()
    .update(resourceComments)
    .set({ isApproved: body.approved })
    .where(eq(resourceComments.id, commentId))
    .returning({ id: resourceComments.id });
  return rows.length
    ? NextResponse.json({ success: true })
    : NextResponse.json(
        { error: "Comentario no encontrado." },
        { status: 404 },
      );
}
export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const user = await getRequestUser(request);
  if (!user)
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { commentId } = await params;
  const db = getDb();
  const [comment] = await db
    .select({ userId: resourceComments.userId })
    .from(resourceComments)
    .where(eq(resourceComments.id, commentId))
    .limit(1);
  if (!comment)
    return NextResponse.json(
      { error: "Comentario no encontrado." },
      { status: 404 },
    );
  if (comment.userId !== user.id && !isAdminEmail(user.email))
    return NextResponse.json(
      { error: "Solo puedes retirar tus propios comentarios." },
      { status: 403 },
    );
  await db.delete(resourceComments).where(eq(resourceComments.id, commentId));
  return NextResponse.json({ success: true });
}
