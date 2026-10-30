import "server-only";
import { desc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { resources, socialLinks, users } from "@/db/schema";
import { getDisplayUsername } from "@/lib/usernames";
import { isDatabaseConfigured } from "@/lib/env";

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
    })
    .from(resources)
    .innerJoin(users, eq(users.id, resources.userId))
    .where(eq(resources.isPublished, true))
    .orderBy(desc(resources.publishedAt), desc(resources.createdAt));
  const rows = await (limit ? query.limit(limit) : query);
  return rows.map(({ username, email, ...resource }) => ({
    ...resource,
    author: getDisplayUsername(username, email),
  }));
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
  return getDb()
    .select()
    .from(socialLinks)
    .orderBy(desc(socialLinks.updatedAt));
});
