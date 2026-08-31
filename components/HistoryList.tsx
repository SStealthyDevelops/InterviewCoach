"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listSessions, deleteSession } from "@/lib/storage/db";
import type { Session } from "@/lib/types";

const BAND_STYLES: Record<Session["scorecard"]["overallBand"], string> = {
  Strong: "text-emerald-600 dark:text-emerald-400",
  "Solid, with gaps": "text-amber-600 dark:text-amber-400",
  "Needs work": "text-red-600 dark:text-red-400",
};

export function HistoryList() {
  const [sessions, setSessions] = useState<Session[] | null>(null);

  useEffect(() => {
    listSessions().then(setSessions);
  }, []);

  async function handleDelete(id: string) {
    await deleteSession(id);
    setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
  }

  if (sessions === null) {
    return null;
  }

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-700 dark:text-zinc-300">
          No practice sessions yet.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium underline">
          Practice a question
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        History
      </h1>
      <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {sessions.map((session) => (
          <li key={session.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <Link href={`/report?id=${session.id}`} className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                {session.question.text}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                {new Date(session.createdAt).toLocaleString()}
              </p>
            </Link>
            <span
              className={`text-sm font-semibold ${BAND_STYLES[session.scorecard.overallBand]}`}
            >
              {session.scorecard.overallScore}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(session.id)}
              className="text-xs font-medium text-zinc-400 hover:text-red-600 dark:text-zinc-600 dark:hover:text-red-400"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
