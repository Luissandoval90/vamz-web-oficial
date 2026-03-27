import { defineConfig } from "drizzle-kit";

for (const envFile of [".env.local", ".env"]) {
  try {
    process.loadEnvFile?.(envFile);
  } catch {
    // Ignore missing env files and fall back to shell-provided variables.
  }
}

const dbCredentials =
  process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
    ? {
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : undefined;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  ...(dbCredentials ? { dbCredentials } : {}),
});
