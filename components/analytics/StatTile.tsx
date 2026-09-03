interface StatTileProps {
  label: string;
  value: string;
  delta?: { text: string; positive: boolean } | null;
}

export function StatTile({ label, value, delta }: StatTileProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
      {delta && (
        <p
          className={`mt-1 text-xs font-medium ${
            delta.positive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {delta.text}
        </p>
      )}
    </div>
  );
}
