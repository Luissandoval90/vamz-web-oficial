import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDb } from "@/db";
import {
  resources,
  socialLinks,
  users,
  minecraftVersions,
  resourceReviews,
} from "@/db/schema";
import {
  buildStorageSummary,
  resolveResourcesStorage,
} from "@/lib/resource-storage";
import { requireAdminUser } from "@/lib/server-auth";
import { getDisplayUsername } from "@/lib/usernames";
import {
  getLocalUsedBytes,
  getLocalUserUsedBytes,
  isLocalStorage,
} from "@/lib/uploads";
import { getUserStorageQuotaBytes, isAdminEmail } from "@/lib/admin";
import { getEnv } from "@/lib/env";
import { engagementColumns } from "@/lib/public-content";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const user = await requireAdminUser();
  const admin = isAdminEmail(user.email);
  const db = getDb();
  const params = await searchParams;
  const view =
    params?.view === "reviews"
      ? "reviews"
      : admin && params?.view === "links"
        ? "links"
        : admin && params?.view === "minecraft"
          ? "minecraft"
          : "panel";
  const [profiles, rows, links, reviews] = await Promise.all([
    db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
    db
      .select({
        resource: getTableColumns(resources),
        minecraft: getTableColumns(minecraftVersions),
        metrics: engagementColumns,
      })
      .from(resources)
      .leftJoin(
        minecraftVersions,
        eq(minecraftVersions.resourceId, resources.id),
      )
      .where(admin ? undefined : eq(resources.userId, user.id))
      .orderBy(desc(resources.createdAt)),
    admin
      ? db.select().from(socialLinks).orderBy(desc(socialLinks.updatedAt))
      : Promise.resolve([]),
    view === "reviews"
      ? db
          .select({
            id: resourceReviews.id,
            resourceId: resourceReviews.resourceId,
            title: resources.title,
            filename: resources.filename,
            username: users.username,
            rating: resourceReviews.rating,
            body: resourceReviews.body,
            approved: resourceReviews.isApproved,
            updatedAt: resourceReviews.updatedAt,
          })
          .from(resourceReviews)
          .innerJoin(resources, eq(resources.id, resourceReviews.resourceId))
          .innerJoin(users, eq(users.id, resourceReviews.userId))
          .orderBy(asc(resourceReviews.isApproved), desc(resourceReviews.updatedAt))
          .limit(200)
      : Promise.resolve([]),
  ]);
  const items = await resolveResourcesStorage(
    rows.map((row) => ({ ...row.resource, minecraft: row.minecraft })),
  );
  const ownUsed = items
    .filter((item) => item.userId === user.id)
    .reduce((sum, item) => sum + item.totalSize, 0);
  const used = isLocalStorage()
    ? admin
      ? await getLocalUsedBytes()
      : Math.max(ownUsed, await getLocalUserUsedBytes(user.id))
    : ownUsed;
  return (
    <DashboardShell
      user={{
        ...user,
        username: getDisplayUsername(
          profiles[0]?.username ?? user.username,
          user.email,
        ),
      }}
      isAdmin={admin}
      maxUploadBytes={getEnv().MAX_UPLOAD_MB * 1024 * 1024}
      resources={items.filter((item) => !item.minecraft)}
      versions={items.filter((item) => item.minecraft)}
      socialLinks={links}
      reviews={reviews}
      activity={{
        views: rows.reduce((sum, row) => sum + Number(row.metrics.views), 0),
        downloads: rows.reduce(
          (sum, row) => sum + Number(row.metrics.downloads),
          0,
        ),
        reviews: rows.reduce(
          (sum, row) => sum + Number(row.metrics.reviewCount),
          0,
        ),
      }}
      resourcesStorage={buildStorageSummary(
        items,
        used,
        getUserStorageQuotaBytes(user.email),
      )}
      initialView={view}
    />
  );
}
