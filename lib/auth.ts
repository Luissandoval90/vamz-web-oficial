import { SignJWT, jwtVerify } from "jose";

import { getEnv } from "@/lib/env";

export const SESSION_COOKIE_NAME = "vamz_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  username?: string | null;
};

const getJwtSecret = () => new TextEncoder().encode(getEnv().JWT_SECRET);

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
});

export const createSessionToken = async (user: SessionUser) => {
  return new SignJWT({
    email: user.email,
    username: user.username ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS)
    .sign(getJwtSecret());
};

export const verifySessionToken = async (token: string) => {
  const result = await jwtVerify(token, getJwtSecret(), {
    algorithms: ["HS256"],
  });

  const email = result.payload.email;
  const username = result.payload.username;

  if (
    typeof result.payload.sub !== "string" ||
    typeof email !== "string" ||
    (username !== undefined && username !== null && typeof username !== "string")
  ) {
    throw new Error("Invalid session payload.");
  }

  return {
    id: result.payload.sub,
    email,
    username: typeof username === "string" ? username : null,
  } satisfies SessionUser;
};
