import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters."),
  STORAGE_DRIVER: z.enum(["r2", "local"]).default("r2"),
  DATA_DIR: z.string().default("./.local/data"),
  DATABASE_URL: z.string().optional(),
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  ADMIN_EMAILS: z.string().optional().default(""),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  RESOURCE_STORAGE_LIMIT_MB: z.coerce.number().positive().default(1024),
  TURSO_STORAGE_LIMIT_GB: z.coerce.number().positive().default(5),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(2048).default(2048),
  MIN_FREE_SPACE_MB: z.coerce.number().nonnegative().default(2048),
});
type Env = z.infer<typeof envSchema>;
let cachedEnv: Env | null = null;

export const getEnv = () => {
  if (!cachedEnv) cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
};

export const isDatabaseConfigured = () => Boolean(
  process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || process.env.STORAGE_DRIVER === "local",
);

export const getDatabaseUrl = () => {
  const env = getEnv();
  const url = env.DATABASE_URL || (env.STORAGE_DRIVER === "local" ? undefined : env.TURSO_DATABASE_URL);
  if (url) return url;
  if (env.STORAGE_DRIVER === "local") return `file:${path.resolve(env.DATA_DIR, "db/vamz.sqlite").replaceAll("\\", "/")}`;
  throw new Error("Configure DATABASE_URL or TURSO_DATABASE_URL.");
};

export const getLocalStorageRoot = () => path.resolve(getEnv().DATA_DIR, "storage");
