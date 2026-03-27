import "server-only";

import { getDbClient } from "@/db";
import { getEnv } from "@/lib/env";

const BYTES_PER_GB = 1024 * 1024 * 1024;

export type TursoStorageSummary = {
  limitBytes: number;
  usedBytes: number;
  availableBytes: number;
  usagePercent: number;
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const resolveTursoStorageSummary = async (): Promise<TursoStorageSummary> => {
  const client = getDbClient();
  const env = getEnv();
  const [pageSizeResult, pageCountResult, freelistResult] = await Promise.all([
    client.execute("pragma page_size"),
    client.execute("pragma page_count"),
    client.execute("pragma freelist_count"),
  ]);

  const pageSize = toNumber(pageSizeResult.rows[0]?.page_size);
  const pageCount = toNumber(pageCountResult.rows[0]?.page_count);
  const freelistCount = toNumber(freelistResult.rows[0]?.freelist_count);
  const usedPages = Math.max(0, pageCount - freelistCount);
  const usedBytes = pageSize * usedPages;
  const limitBytes = Math.max(1, env.TURSO_STORAGE_LIMIT_GB * BYTES_PER_GB);
  const availableBytes = Math.max(0, limitBytes - usedBytes);
  const usagePercent = Math.min(100, (usedBytes / limitBytes) * 100);

  return {
    limitBytes,
    usedBytes,
    availableBytes,
    usagePercent,
  };
};
