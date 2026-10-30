import { rejectCrossOrigin } from "@/lib/request-origin";
import { limitAuthentication } from "@/lib/auth-rate-limit";
import { readRequestJson } from "@/lib/request-json";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { registerSchema } from "@/lib/validators";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const limited = await limitAuthentication(request, "register");
  if (limited) return limited;
  const body = await readRequestJson(request);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const db = getDb();
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  if (isAdminEmail(parsed.data.email)) {
    return NextResponse.json({ error: "Este correo está reservado para la administración. Utiliza tu cuenta existente o contacta con el administrador." }, { status: 403 });
  }

  const user = {
    id: crypto.randomUUID(),
    email: parsed.data.email,
    username: parsed.data.username,
    passwordHash: await bcrypt.hash(parsed.data.password, 12),
  };

  await db.insert(users).values(user);

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  const response = NextResponse.json(
    {
      redirectTo: "/recursos",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    },
    { status: 201 },
  );

  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

  return response;
}
