import "server-only";

import { getStoredFileSize, getStorageQuotaBytes } from "@/lib/uploads";

type ResourceWithStorage = {
  fileSize: number;
  coverSize: number;
  path: string;
  coverPath: string | null;
};

export const resolveResourceStorage = async <T extends ResourceWithStorage>(resource: T) => {
  const fileSize = resource.fileSize > 0 ? resource.fileSize : await getStoredFileSize(resource.path);
  const coverSize =
    resource.coverSize > 0 ? resource.coverSize : await getStoredFileSize(resource.coverPath);

  return {
    ...resource,
    fileSize,
    coverSize,
    totalSize: fileSize + coverSize,
  };
};

export const resolveResourcesStorage = async <T extends ResourceWithStorage>(resources: T[]) =>
  Promise.all(resources.map((resource) => resolveResourceStorage(resource)));

export const buildStorageSummary = <
  T extends {
    totalSize: number;
  },
>(
  resources: T[],
) => {
  const limitBytes = getStorageQuotaBytes();
  const usedBytes = resources.reduce((sum, resource) => sum + resource.totalSize, 0);
  const availableBytes = Math.max(limitBytes - usedBytes, 0);
  const usagePercent = limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;

  return {
    limitBytes,
    usedBytes,
    availableBytes,
    usagePercent,
  };
};
