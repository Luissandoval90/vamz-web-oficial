import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

import { getEnv } from "@/lib/env";

let cachedClient: S3Client | null = null;

export const getR2Client = () => {
  if (!cachedClient) {
    const env = getEnv();

    cachedClient = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return cachedClient;
};

export const getR2BucketName = () => getEnv().R2_BUCKET;

export const normalizeStoredObjectKey = (value: string) => value.replace(/^\/+/, "").replaceAll("\\", "/");
