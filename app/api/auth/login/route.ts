import { rejectCrossOrigin } from "@/lib/request-origin";
import { isAdminEmail } from "@/lib/admin";
import { limitAuthentication } from "@/lib/auth-rate-limit";
import { readRequestJson } from "@/lib/request-json";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getDisplayUsername } from "@/lib/usernames";
import { credentialsSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const limited = await limitAuthentication(request, "login");
  if (limited) return limited;
  const body = await readRequestJson(request);
  const parsed = credentialsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const accountLimit = await limitAuthentication(request, "login", parsed.data.email);
  if (accountLimit) return accountLimit;
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  const passwordMatches = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? "$2b$12$3BdPFmr8YtmJ0NbAeAyyD.cQdUuZr7ueJJ3pxV7p6CmZKfQ0HDkYO");

  if (!user || !passwordMatches) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  const username = getDisplayUsername(user.username, user.email);

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    username,
  });

  const response = NextResponse.json({
    redirectTo: isAdminEmail(user.email) ? "/dashboard" : "/recursos",
    user: {
      id: user.id,
      email: user.email,
      username,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

  return response;
}
