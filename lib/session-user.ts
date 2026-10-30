import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { verifySessionToken } from "@/lib/auth";

export async function resolveSessionUser(token: string) {
  try {
    const session = await verifySessionToken(token);
    const [user] = await getDb().select({ id: users.id, email: users.email, username: users.username })
      .from(users).where(and(eq(users.id, session.id), eq(users.email, session.email))).limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}
