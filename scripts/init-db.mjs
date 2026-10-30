import { createClient } from "@libsql/client";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL || `file:${path.resolve(process.env.DATA_DIR || "./.local/data", "db/vamz.sqlite").replaceAll("\\", "/")}`;
if (!url.startsWith("file:")) throw new Error("Este inicializador solo admite bases de datos SQLite locales.");
const filename = url.startsWith("file://") ? fileURLToPath(url) : path.resolve(url.slice(5));
await mkdir(path.dirname(filename), { recursive: true, mode: 0o750 });
await mkdir(path.resolve(process.env.DATA_DIR || "./.local/data", "storage"), { recursive: true, mode: 0o750 });
const db = createClient({ url });
try {
  await db.execute("PRAGMA journal_mode=WAL");
  await db.executeMultiple(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
  const integrity = await db.execute("PRAGMA integrity_check");
  if (integrity.rows[0]?.integrity_check !== "ok") throw new Error("La base de datos no supera la comprobación de integridad.");
  console.log("Base de datos local preparada.");
} finally { db.close(); }
