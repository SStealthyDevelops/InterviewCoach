import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "@/lib/db/schema";

// Server-only module (imported from Route Handlers only). Never import this
// from a "use client" component — node:sqlite doesn't exist in the browser.

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "analytics.db");

function runMigrations(db: DatabaseSync): void {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  let version = row.user_version;
  for (; version < MIGRATIONS.length; version++) {
    db.exec(MIGRATIONS[version]);
    db.exec(`PRAGMA user_version = ${version + 1}`);
  }
}

function openDb(): DatabaseSync {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  runMigrations(db);
  return db;
}

// `next dev` keeps the module registry across Fast Refresh reloads of a
// route handler, but not always across a full server restart, so cache the
// connection on `globalThis` (the standard Next.js singleton pattern) to
// avoid re-opening the file on every hot reload.
const globalForDb = globalThis as unknown as { __analyticsDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.__analyticsDb) {
    globalForDb.__analyticsDb = openDb();
  }
  return globalForDb.__analyticsDb;
}

export function withTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
