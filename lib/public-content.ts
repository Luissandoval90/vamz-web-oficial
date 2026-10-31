import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { resources, socialLinks, users, minecraftVersions } from "@/db/schema";
import { getDisplayUsername } from "@/lib/usernames";
import { isDatabaseConfigured } from "@/lib/env";
import { isSafeSocialUrl } from "@/lib/social-links";

export const engagementColumns = {
  views: sql<number>`coalesce((select views from resource_stats where resource_id = ${resources.id}), 0)`,
  downloads: sql<number>`coalesce((select downloads from resource_stats where resource_id = ${resources.id}), 0)`,
  reviewCount: sql<number>`(select count(*) from resource_reviews where resource_id = ${resources.id} and is_approved = 1)`,
  rating: sql<number>`coalesce((select avg(rating) from resource_reviews where resource_id = ${resources.id} and is_approved = 1), 0)`,
};

export const getPublicResources = cache(async (limit?: number) => {
  if (!isDatabaseConfigured()) return [];
  const query = getDb()
    .select({
      id: resources.id,
      filename: resources.filename,
      title: resources.title,
      description: resources.description,
      coverPath: resources.coverPath,
      fileSize: resources.fileSize,
      createdAt: resources.createdAt,
      publishedAt: resources.publishedAt,
      username: users.username,
      email: users.email,
      ...engagementColumns,
    })
    .from(resources)
    .innerJoin(users, eq(users.id, resources.userId))
    .leftJoin(minecraftVersions, eq(minecraftVersions.resourceId, resources.id))
    .where(
      and(
        eq(resources.isPublished, true),
        isNull(minecraftVersions.resourceId),
      ),
    )
    .orderBy(desc(resources.publishedAt), desc(resources.createdAt));
  const rows = await (limit ? query.limit(limit) : query);
  return rows.map(({ username, email, ...resource }) => ({
    ...resource,
    author: getDisplayUsername(username, email),
  }));
});

export const getPublicMinecraftVersions = cache(async () => {
  if (!isDatabaseConfigured()) return [];
  return getDb()
    .select({
      id: resources.id,
      filename: resources.filename,
      title: resources.title,
      description: resources.description,
      fileSize: resources.fileSize,
      createdAt: resources.createdAt,
      publishedAt: resources.publishedAt,
      version: minecraftVersions.version,
      edition: minecraftVersions.edition,
      platform: minecraftVersions.platform,
      coverPath: resources.coverPath,
      ...engagementColumns,
    })
    .from(minecraftVersions)
    .innerJoin(resources, eq(resources.id, minecraftVersions.resourceId))
    .where(eq(resources.isPublished, true))
    .orderBy(desc(resources.publishedAt));
});

export const getPublicSocialLinks = cache(async () => {
  if (!isDatabaseConfigured())
    return [
      { id: 1, platform: "Discord", url: "https://discord.gg/RhEdF4XZC" },
      { id: 2, platform: "Twitch", url: "https://twitch.tv/vamztwitch" },
      { id: 3, platform: "YouTube", url: "https://youtube.com/@vamz2660" },
      { id: 4, platform: "Instagram", url: "https://instagram.com/vaaaamz/" },
      { id: 5, platform: "TikTok", url: "https://tiktok.com/@vaaaamz" },
    ];
  const links = await getDb()
    .select()
    .from(socialLinks)
    .orderBy(desc(socialLinks.updatedAt));
  return links.filter((link) => isSafeSocialUrl(link.url));
});
