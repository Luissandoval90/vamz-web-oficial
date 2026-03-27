import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters."),
  TURSO_DATABASE_URL: z.string().url("TURSO_DATABASE_URL must be a valid URL."),
  TURSO_AUTH_TOKEN: z.string().min(1, "TURSO_AUTH_TOKEN is required."),
  ADMIN_EMAILS: z.string().optional().default(""),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required."),
  R2_BUCKET: z.string().min(1, "R2_BUCKET is required."),
  R2_ENDPOINT: z.string().url("R2_ENDPOINT must be a valid URL."),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required."),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required."),
  RESOURCE_STORAGE_LIMIT_MB: z.coerce.number().positive().optional().default(1024),
  TURSO_STORAGE_LIMIT_GB: z.coerce.number().positive().optional().default(5),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export const getEnv = () => {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
};
