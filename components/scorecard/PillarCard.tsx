import type { ScorePillar } from "@/lib/types";

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function PillarCard({ pillar }: { pillar: ScorePillar }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {pillar.name}
        </h3>
        <span className={`text-lg font-bold ${scoreColor(pillar.score)}`}>
          {Math.round(pillar.score)}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{pillar.takeaway}</p>
    </div>
  );
}
