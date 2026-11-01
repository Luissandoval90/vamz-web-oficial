import "server-only";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { resourceComments, resources, users } from "@/db/schema";
import { getDisplayUsername } from "@/lib/usernames";

export async function getResourceComments(resourceId: string, userId?: string) {
  const db = getDb();
  const publicFilter = and(
    eq(resourceComments.resourceId, resourceId),
    eq(resourceComments.isApproved, true),
  );
  const rows = await db
    .select({
      id: resourceComments.id,
      body: resourceComments.body,
      approved: resourceComments.isApproved,
      createdAt: resourceComments.createdAt,
      username: users.username,
      userId: resourceComments.userId,
      ownerId: resources.userId,
    })
    .from(resourceComments)
    .innerJoin(users, eq(users.id, resourceComments.userId))
    .innerJoin(resources, eq(resources.id, resourceComments.resourceId))
    .where(
      userId
        ? or(
            publicFilter,
            and(
              eq(resourceComments.resourceId, resourceId),
              eq(resourceComments.userId, userId),
            ),
          )
        : publicFilter,
    )
    .orderBy(desc(resourceComments.createdAt))
    .limit(60);
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(resourceComments)
    .where(publicFilter);
  return {
    comments: rows.map(({ userId: authorId, ownerId, ...row }) => ({
      ...row,
      username: getDisplayUsername(row.username, "miembro@vamz.local"),
      isOwn: authorId === userId,
      isAuthor: authorId === ownerId,
    })),
    commentCount: Number(total),
  };
}
