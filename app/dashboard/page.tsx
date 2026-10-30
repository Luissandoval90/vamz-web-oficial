import { desc, eq, getTableColumns } from "drizzle-orm";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDb } from "@/db";
import { resources, socialLinks, users, minecraftVersions } from "@/db/schema";
import { buildStorageSummary, resolveResourcesStorage } from "@/lib/resource-storage";
import { requireUser } from "@/lib/server-auth";
import { getDisplayUsername } from "@/lib/usernames";
import { getLocalUsedBytes, getLocalUserUsedBytes, isLocalStorage } from "@/lib/uploads";
import { getUserStorageQuotaBytes, isAdminEmail } from "@/lib/admin";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ view?: string }> }) {
  const user = await requireUser();
  const admin = isAdminEmail(user.email);
  const db = getDb();
  const params = await searchParams;
  const view = admin && params?.view === "links" ? "links" : admin && params?.view === "minecraft" ? "minecraft" : "panel";
  const [profiles, rows, links] = await Promise.all([
    db.select({ username: users.username }).from(users).where(eq(users.id, user.id)).limit(1),
    db.select({ resource: getTableColumns(resources), minecraft: getTableColumns(minecraftVersions) }).from(resources)
      .leftJoin(minecraftVersions, eq(minecraftVersions.resourceId, resources.id))
      .where(admin ? undefined : eq(resources.userId, user.id)).orderBy(desc(resources.createdAt)),
    admin ? db.select().from(socialLinks).orderBy(desc(socialLinks.updatedAt)) : Promise.resolve([]),
  ]);
  const items = await resolveResourcesStorage(rows.map(row => ({ ...row.resource, minecraft: row.minecraft })));
  const ownUsed = items.filter(item => item.userId === user.id).reduce((sum, item) => sum + item.totalSize, 0);
  const used = isLocalStorage() ? admin ? await getLocalUsedBytes() : Math.max(ownUsed, await getLocalUserUsedBytes(user.id)) : ownUsed;
  return <DashboardShell
    user={{ ...user, username: getDisplayUsername(profiles[0]?.username ?? user.username, user.email) }}
    isAdmin={admin}
    resources={items.filter(item => !item.minecraft)}
    versions={items.filter(item => item.minecraft)}
    socialLinks={links}
    resourcesStorage={buildStorageSummary(items, used, getUserStorageQuotaBytes(user.email))}
    initialView={view}
  />;
}
