import { readRequestJson } from "@/lib/request-json";
import { isAdminEmail } from "@/lib/admin";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getRequestUser } from "@/lib/request-auth";
import { profileSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (user && !isAdminEmail(user.email)) return NextResponse.json({ error: "Solo el administrador puede gestionar el contenido." }, { status: 403 });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await readRequestJson(request);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const db = getDb();

  await db
    .update(users)
    .set({
      username: parsed.data.username,
    })
    .where(eq(users.id, user.id));

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    username: parsed.data.username,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      username: parsed.data.username,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

  return response;
}
