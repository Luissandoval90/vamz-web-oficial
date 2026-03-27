"use client";

import { useMemo, useState } from "react";

import { getFileExtension, getResourceKind, imageExtensions } from "@/lib/resource-utils";

type ResourceThumbProps = {
  resource: {
    id: string;
    filename: string;
    title?: string | null;
    coverPath?: string | null;
  };
  previewUrl?: string;
};

const DEFAULT_RESOURCE_PREVIEW = "/rem3.jpg";

export function ResourceThumb({ resource, previewUrl }: ResourceThumbProps) {
  const kind = getResourceKind(resource.filename);
  const alt = resource.title?.trim() || resource.filename;

  const resolvedPreviewUrl = useMemo(() => {
    if (previewUrl) {
      return previewUrl;
    }

    if (resource.coverPath) {
      return `/api/resources/${resource.id}/cover`;
    }

    if (imageExtensions.has(getFileExtension(resource.filename))) {
      return `/api/resources/${resource.id}`;
    }

    return DEFAULT_RESOURCE_PREVIEW;
  }, [previewUrl, resource.coverPath, resource.filename, resource.id]);

  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const hasPrimaryFailed = failedUrls.includes(resolvedPreviewUrl);
  const hasDefaultFailed = failedUrls.includes(DEFAULT_RESOURCE_PREVIEW);
  const currentSrc = hasPrimaryFailed ? DEFAULT_RESOURCE_PREVIEW : resolvedPreviewUrl;
  const showFallback = hasPrimaryFailed && hasDefaultFailed;

  if (showFallback) {
    return (
      <div className="resource-thumb-fallback">
        <span>{kind}</span>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="resource-thumb-image"
        src={currentSrc}
        alt={alt}
        onError={() => {
          setFailedUrls((current) =>
            current.includes(currentSrc) ? current : [...current, currentSrc],
          );
        }}
      />
    </>
  );
}
