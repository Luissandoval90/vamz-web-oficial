import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { socialLinks } from "@/db/schema";
import { getRequestAdmin } from "@/lib/request-auth";
import { socialLinkSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    linkId: string;
  }>;
};

export const runtime = "nodejs";

const parseLinkId = async (context: RouteContext) => {
  const { linkId } = await context.params;
  const parsedId = Number(linkId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await getRequestAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const linkId = await parseLinkId(context);

  if (!linkId) {
    return NextResponse.json({ error: "Invalid link id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = socialLinkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const db = getDb();
  const [link] = await db
    .update(socialLinks)
    .set({
      platform: parsed.data.platform,
      url: parsed.data.url,
      icon: parsed.data.icon,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(socialLinks.id, linkId))
    .returning();

  if (!link) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  return NextResponse.json({ link });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const admin = await getRequestAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const linkId = await parseLinkId(context);

  if (!linkId) {
    return NextResponse.json({ error: "Invalid link id." }, { status: 400 });
  }

  const db = getDb();
  const [link] = await db.delete(socialLinks).where(eq(socialLinks.id, linkId)).returning();

  if (!link) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
