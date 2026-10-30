import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getDbClient } from "@/db";

async function consume(key: string, maximum: number, windowSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const db = getDbClient();
  const result = await db.execute({
    sql: `INSERT INTO auth_rate_limits (key, attempts, expires_at) VALUES (?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET
        attempts = CASE WHEN expires_at <= ? THEN 1 ELSE attempts + 1 END,
        expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END
      RETURNING attempts, expires_at`,
    args: [key, now + windowSeconds, now, now],
  });
  await db.execute({ sql: "DELETE FROM auth_rate_limits WHERE expires_at <= ?", args: [now] });
  return Number(result.rows[0].attempts) > maximum ? Math.max(1, Number(result.rows[0].expires_at) - now) : 0;
}

export async function limitAuthentication(request: Request, action: "login" | "register", email?: string) {
  // Caddy overwrites this header; the application port is not publicly exposed.
  const identity = email ? `account:${email}` : `ip:${request.headers.get("x-real-ip") ?? "direct"}`;
  const key = createHash("sha256").update(`${action}:${identity}`).digest("hex");
  const retry = await consume(key, email ? 12 : action === "register" ? 5 : 40, action === "register" ? 3600 : 900);
  if (!retry) return null;
  return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo." }, {
    status: 429, headers: { "Retry-After": String(retry), "Cache-Control": "no-store" },
  });
}
