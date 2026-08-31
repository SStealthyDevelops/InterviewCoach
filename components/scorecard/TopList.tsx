import type { Scorecard } from "@/lib/types";

export function TopWorkedList({ items }: { items: Scorecard["topWorked"] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        What worked
      </h2>
      <ul className="mt-2 space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          >
            <p>{item.summary}</p>
            {item.quote && (
              <p className="mt-1 italic text-emerald-700 dark:text-emerald-400">
                &ldquo;{item.quote}&rdquo;
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopFixesList({ items }: { items: Scorecard["topFixes"] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        What to fix
      </h2>
      <ul className="mt-2 space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          >
            <p>{item.summary}</p>
            <p className="mt-1">
              <span className="opacity-70">You said:</span> &ldquo;{item.said}&rdquo;
            </p>
            <p>
              <span className="opacity-70">Try instead:</span> &ldquo;{item.tryInstead}
              &rdquo;
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
