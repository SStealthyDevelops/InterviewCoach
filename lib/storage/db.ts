import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Session } from "@/lib/types";

interface InterviewCoachDb extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: { "by-createdAt": string };
  };
}

const DB_NAME = "interview-coach";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<InterviewCoachDb>> | null = null;

function getDb(): Promise<IDBPDatabase<InterviewCoachDb>> {
  if (!dbPromise) {
    dbPromise = openDB<InterviewCoachDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("sessions", { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDb();
  await db.put("sessions", session);
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDb();
  return db.get("sessions", id);
}

/** Newest first. */
export async function listSessions(): Promise<Session[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex("sessions", "by-createdAt");
  return all.reverse();
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("sessions", id);
}

export async function deleteAllSessions(): Promise<void> {
  const db = await getDb();
  await db.clear("sessions");
}
