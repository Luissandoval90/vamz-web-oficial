import { desc, eq } from "drizzle-orm";

import { DashboardShell } from "@/components/dashboard-shell";
import { getDb } from "@/db";
import { resources, socialLinks, users } from "@/db/schema";
import { buildStorageSummary, resolveResourcesStorage } from "@/lib/resource-storage";
import { requireAdminUser } from "@/lib/server-auth";
import { getDisplayUsername } from "@/lib/usernames";

type DashboardPageProps = {
  searchParams?: Promise<{
    view?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireAdminUser();
  const db = getDb();
  const resolvedSearchParams = await searchParams;
  const requestedView = resolvedSearchParams?.view === "links" ? "links" : "panel";
  const [currentUser] = await db
    .select({
      username: users.username,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const uploadedResources = await db
    .select()
    .from(resources)
    .where(eq(resources.userId, user.id))
    .orderBy(desc(resources.createdAt));
  const publishedSocialLinks = await db.select().from(socialLinks).orderBy(desc(socialLinks.updatedAt));
  const resolvedResources = await resolveResourcesStorage(uploadedResources);
  const resourcesStorage = buildStorageSummary(resolvedResources);

  return (
    <DashboardShell
      user={{
        ...user,
        username: getDisplayUsername(currentUser?.username ?? user.username, user.email),
      }}
      resources={resolvedResources}
      socialLinks={publishedSocialLinks}
      resourcesStorage={resourcesStorage}
      initialView={requestedView}
    />
  );
}
