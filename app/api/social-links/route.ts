import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { socialLinks } from "@/db/schema";
import { getRequestAdmin } from "@/lib/request-auth";
import { socialLinkSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const admin = await getRequestAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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
  const now = new Date().toISOString();
  const [link] = await db
    .insert(socialLinks)
    .values({
      platform: parsed.data.platform,
      url: parsed.data.url,
      icon: parsed.data.icon,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ link }, { status: 201 });
}
