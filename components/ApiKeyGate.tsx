"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { validateApiKey } from "@/lib/openai/keyValidation";
import { getStoredApiKey, setStoredApiKey, subscribeStoredApiKey } from "@/lib/storage/settings";

function getServerSnapshot() {
  return false;
}

/**
 * Blocking first-run gate (source spec §4 step 1, §9). Until a validated
 * OpenAI API key is stored locally, this replaces the whole app with a
 * privacy disclosure + key entry form. Not a route, so it works uniformly
 * across every page.
 *
 * Reads the key via useSyncExternalStore rather than a mount effect: the
 * key lives in localStorage, which doesn't exist during static
 * prerendering, so the server/prerender snapshot is `false` and the real
 * value is read once hydrated on the client — no effect+setState needed,
 * and the gate updates immediately when setStoredApiKey is called.
 */
export function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const hasStoredKey = useSyncExternalStore(
    subscribeStoredApiKey,
    () => !!getStoredApiKey(),
    getServerSnapshot
  );

  if (!hasStoredKey) {
    return <SetupForm />;
  }

  return <>{children}</>;
}

function SetupForm() {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "validating" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("validating");
    setErrorMessage("");

    const result = await validateApiKey(apiKey);
    if (result.valid) {
      setStoredApiKey(apiKey.trim());
      return;
    }

    setStatus("error");
    setErrorMessage(result.message);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome to AI Interview Coach
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          A free, self-hosted practice tool. Record yourself answering an interview
          question and get instant, AI-driven feedback &mdash; powered by your own
          OpenAI API key.
        </p>

        <div className="mt-6 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            What leaves your machine
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your recorded audio is sent to OpenAI to be transcribed.</li>
            <li>
              Your transcript and the interview question are sent to OpenAI to be
              scored for content, structure, and vocabulary.
            </li>
            <li>
              Your video, eye-contact tracking, and filler-word detection never leave
              this machine.
            </li>
            <li>
              Your API key is stored only in this browser&apos;s local storage &mdash;
              never sent anywhere except directly to OpenAI.
            </li>
            <li>
              Eye-contact tracking downloads a small public face-tracking model from a
              CDN the first time you use it (cached afterward). No recording or
              personal data is included in that download.
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100" htmlFor="apiKey">
            OpenAI API key
          </label>
          <input
            id="apiKey"
            type="password"
            required
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {status === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
          <button
            type="submit"
            disabled={status === "validating" || apiKey.trim().length === 0}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {status === "validating" ? "Validating key..." : "Save & start practicing"}
          </button>
        </form>
      </div>
    </div>
  );
}
