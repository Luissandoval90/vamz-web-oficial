import type { MetadataRoute } from "next";
import {
  getPublicMinecraftVersions,
  getPublicResources,
} from "@/lib/public-content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = "https://vamz.umifront.com";
  const [resources, versions] = await Promise.all([
    getPublicResources(),
    getPublicMinecraftVersions(),
  ]);
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: origin + "/recursos", changeFrequency: "weekly", priority: 0.9 },
    { url: origin + "/minecraft", changeFrequency: "weekly", priority: 0.8 },
    ...[...resources, ...versions].map((resource) => ({
      url: `${origin}/recurso/${resource.id}`,
      lastModified: new Date(resource.publishedAt || resource.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
