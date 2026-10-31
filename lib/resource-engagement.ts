import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import {
  resourceEvents,
  resourceReviews,
  resourceStats,
  users,
} from "@/db/schema";
import { getEnv } from "@/lib/env";
import { getDisplayUsername } from "@/lib/usernames";

export const VISITOR_COOKIE = "vamz_visitor";
export const visitorCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 180,
};

export function getVisitor(request: NextRequest) {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  return existing && /^[a-f0-9-]{36}$/.test(existing)
    ? { id: existing, fresh: false }
    : { id: randomUUID(), fresh: true };
}

export async function recordResourceEvent(
  resourceId: string,
  kind: "view" | "download",
  visitorId: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const day = Math.floor(now / 86400);
  const visitorHash = createHmac("sha256", getEnv().JWT_SECRET)
    .update(`${visitorId}:${day}`)
    .digest("hex");
  const db = getDb();
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(resourceEvents)
      .values({ resourceId, kind, visitorHash, expiresAt: (day + 2) * 86400 })
      .onConflictDoNothing()
      .returning({ resourceId: resourceEvents.resourceId });
    if (inserted.length)
      await tx
        .insert(resourceStats)
        .values({
          resourceId,
          views: kind === "view" ? 1 : 0,
          downloads: kind === "download" ? 1 : 0,
        })
        .onConflictDoUpdate({
          target: resourceStats.resourceId,
          set:
            kind === "view"
              ? { views: sql`${resourceStats.views} + 1` }
              : { downloads: sql`${resourceStats.downloads} + 1` },
        });
    await tx
      .delete(resourceEvents)
      .where(sql`${resourceEvents.expiresAt} <= ${now}`);
  });
  return getResourceSummary(resourceId);
}

export async function getResourceSummary(resourceId: string) {
  const db = getDb();
  const [stats, reviews] = await Promise.all([
    db
      .select()
      .from(resourceStats)
      .where(eq(resourceStats.resourceId, resourceId))
      .limit(1),
    db
      .select({
        reviewCount: count(),
        rating: sql<number>`coalesce(avg(${resourceReviews.rating}), 0)`,
      })
      .from(resourceReviews)
      .where(
        and(
          eq(resourceReviews.resourceId, resourceId),
          eq(resourceReviews.isApproved, true),
        ),
      ),
  ]);
  return {
    views: stats[0]?.views ?? 0,
    downloads: stats[0]?.downloads ?? 0,
    reviewCount: reviews[0]?.reviewCount ?? 0,
    rating: Number(reviews[0]?.rating ?? 0),
  };
}

export async function getResourceReviews(resourceId: string, userId?: string) {
  const db = getDb();
  const selection = {
    id: resourceReviews.id,
    rating: resourceReviews.rating,
    body: resourceReviews.body,
    createdAt: resourceReviews.createdAt,
    updatedAt: resourceReviews.updatedAt,
    username: users.username,
    approved: resourceReviews.isApproved,
  };
  const [publicRows, ownRows] = await Promise.all([
    db
      .select(selection)
      .from(resourceReviews)
      .innerJoin(users, eq(users.id, resourceReviews.userId))
      .where(
        and(
          eq(resourceReviews.resourceId, resourceId),
          eq(resourceReviews.isApproved, true),
        ),
      )
      .orderBy(desc(resourceReviews.createdAt))
      .limit(30),
    userId
      ? db
          .select(selection)
          .from(resourceReviews)
          .innerJoin(users, eq(users.id, resourceReviews.userId))
          .where(
            and(
              eq(resourceReviews.resourceId, resourceId),
              eq(resourceReviews.userId, userId),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);
  const clean = (row: (typeof publicRows)[number]) => ({
    ...row,
    username: getDisplayUsername(row.username, "miembro@vamz.local"),
  });
  return {
    reviews: publicRows.map(clean),
    ownReview: ownRows[0] ? clean(ownRows[0]) : null,
  };
}
