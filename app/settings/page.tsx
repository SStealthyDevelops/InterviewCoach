"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { validateApiKey } from "@/lib/openai/keyValidation";
import {
  clearAllSettings,
  getSaveVideoByDefault,
  getStoredApiKey,
  setSaveVideoByDefault,
  setStoredApiKey,
  subscribeSaveVideoByDefault,
  subscribeStoredApiKey,
} from "@/lib/storage/settings";
import { deleteAllSessions } from "@/lib/storage/db";

function getServerSnapshotFalse() {
  return false;
}

export default function SettingsPage() {
  const hasKey = useSyncExternalStore(
    subscribeStoredApiKey,
    () => !!getStoredApiKey(),
    getServerSnapshotFalse
  );
  const saveVideo = useSyncExternalStore(
    subscribeSaveVideoByDefault,
    getSaveVideoByDefault,
    getServerSnapshotFalse
  );

  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "validating" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [deleted, setDeleted] = useState(false);

  async function handleKeySubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("validating");
    setMessage("");

    const result = await validateApiKey(apiKey);
    if (!result.valid) {
      setStatus("error");
      setMessage(result.message);
      return;
    }

    setStoredApiKey(apiKey.trim());
    setApiKey("");
    setStatus("saved");
    setMessage("API key saved.");
  }

  async function handleDeleteAll() {
    await deleteAllSessions();
    clearAllSettings();
    setDeleted(true);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          OpenAI API key
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {hasKey
            ? "A key is currently stored in this browser. Enter a new one to replace it."
            : "No key is currently stored."}
        </p>
        <form onSubmit={handleKeySubmit} className="space-y-2">
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {message && (
            <p
              className={`text-sm ${status === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "validating" || apiKey.trim().length === 0}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {status === "validating" ? "Validating..." : "Save key"}
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recording preferences
        </h2>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={saveVideo}
            onChange={(e) => setSaveVideoByDefault(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
          />
          Save video recordings by default
        </label>
      </section>

      <section className="space-y-2 rounded-lg border border-red-200 p-4 dark:border-red-900">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">
          Delete all local data
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Permanently deletes your API key and every saved practice session (videos,
          transcripts, and scores) from this browser. This cannot be undone.
        </p>
        {deleted ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            All local data has been deleted.
          </p>
        ) : (
          <button
            type="button"
            onClick={handleDeleteAll}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Delete all local data
          </button>
        )}
      </section>
    </div>
  );
}
