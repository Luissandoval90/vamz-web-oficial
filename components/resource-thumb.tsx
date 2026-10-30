"use client";
import Image from "next/image";
import { useState } from "react";
import {
  getFileExtension,
  getResourceKind,
  imageExtensions,
} from "@/lib/resource-utils";
const fallback = "/minecraft-landscape.webp";

export function ResourceThumb({
  resource,
  previewUrl,
  optimize = false,
}: {
  resource: {
    id: string;
    filename: string;
    title?: string | null;
    coverPath?: string | null;
  };
  previewUrl?: string;
  optimize?: boolean;
}) {
  const primary =
    previewUrl ||
    (resource.coverPath
      ? `/api/resources/${resource.id}/cover?v=${encodeURIComponent(resource.coverPath.split("/").at(-1) ?? "")}`
      : imageExtensions.has(getFileExtension(resource.filename))
        ? `/api/resources/${resource.id}`
        : fallback);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const src = failedUrls.includes(primary) ? fallback : primary;
  if (failedUrls.includes(src))
    return (
      <div className="resource-thumb-fallback">
        <span>{getResourceKind(resource.filename)}</span>
      </div>
    );
  return (
    <Image
      className="resource-thumb-image"
      src={src}
      alt={resource.title?.trim() || resource.filename}
      width={800}
      height={500}
      sizes="(max-width: 420px) 100vw, (max-width: 700px) 50vw, 33vw"
      unoptimized={src.startsWith("/api/") && (!optimize || getFileExtension(resource.coverPath || resource.filename) === "svg")}
      onError={() => setFailedUrls((current) => [...current, src])}
    />
  );
}
