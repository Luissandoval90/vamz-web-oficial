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
}: {
  resource: {
    id: string;
    filename: string;
    title?: string | null;
    coverPath?: string | null;
  };
  previewUrl?: string;
}) {
  const primary =
    previewUrl ||
    (resource.coverPath
      ? `/api/resources/${resource.id}/cover`
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
      unoptimized={src.startsWith("/api/")}
      onError={() => setFailedUrls((current) => [...current, src])}
    />
  );
}
