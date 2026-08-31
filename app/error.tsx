"use client";

// App Router error boundary for this route segment and its children. Only
// relevant in production (npm run build) launches - dev mode shows Next's
// own overlay instead. Without this, a production build falls back to a
// generic, unbranded "application error" message with no recovery action.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          The app hit an unexpected error. Your practice data is safe — it&apos;s
          stored locally and this didn&apos;t affect it.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Try again
        </button>
        {/* A plain anchor, not next/link - if the error left client-side
            routing in a bad state, a full page reload is a more reliable
            way back than client navigation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="mt-3 block text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Back to home
        </a>
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-xs text-zinc-400 dark:text-zinc-600">
            Technical details
          </summary>
          <pre className="mt-2 overflow-x-auto text-xs whitespace-pre-wrap text-zinc-500 dark:text-zinc-500">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  );
}
