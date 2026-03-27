import "server-only";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";

const createDatabaseClient = () => {
  const env = getEnv();

  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
};

const createDatabase = () => {
  const client = createDatabaseClient();

  return drizzle(client, { schema });
};

type Database = ReturnType<typeof createDatabase>;

let database: Database | null = null;
let databaseClient: ReturnType<typeof createDatabaseClient> | null = null;

export const getDb = () => {
  if (!database) {
    database = createDatabase();
  }

  return database;
};

export const getDbClient = () => {
  if (!databaseClient) {
    databaseClient = createDatabaseClient();
  }

  return databaseClient;
};
