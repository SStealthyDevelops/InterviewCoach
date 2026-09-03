export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">{subtitle}</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function ChartEmptyState({ height = 200 }: { height?: number }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center rounded-md border border-dashed border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
    >
      Not enough sessions yet
    </div>
  );
}
