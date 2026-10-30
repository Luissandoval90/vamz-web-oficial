import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import { getDatabaseUrl, getEnv } from "@/lib/env";

const createDatabaseClient = () => {
  const url = getDatabaseUrl();
  return createClient({ url, ...(url.startsWith("file:") ? {} : { authToken: getEnv().TURSO_AUTH_TOKEN }) });
};
type Client = ReturnType<typeof createDatabaseClient>;
let databaseClient: Client | null = null;
export const getDbClient = () => {
  if (!databaseClient) databaseClient = createDatabaseClient();
  return databaseClient;
};
const createDatabase = () => drizzle(getDbClient(), { schema });
let database: ReturnType<typeof createDatabase> | null = null;
export const getDb = () => {
  if (!database) database = createDatabase();
  return database;
};
