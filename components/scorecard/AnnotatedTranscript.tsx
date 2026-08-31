import type { AnnotatedTranscriptSegment, TranscriptTag } from "@/lib/types";

const TAG_STYLES: Record<Exclude<TranscriptTag, null>, string> = {
  filler: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  weak: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export function AnnotatedTranscript({
  segments,
}: {
  segments: AnnotatedTranscriptSegment[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Your answer, annotated
      </h2>
      <div className="mt-3 flex flex-wrap gap-x-1.5 gap-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
        {segments.map((segment, i) => (
          <span
            key={i}
            className={
              segment.tag
                ? `rounded px-1 py-0.5 ${TAG_STYLES[segment.tag]}`
                : "text-zinc-700 dark:text-zinc-300"
            }
          >
            {segment.text}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-500">
        <Legend swatch="bg-red-100 dark:bg-red-950" label="filler word" />
        <Legend swatch="bg-amber-100 dark:bg-amber-950" label="weak phrase" />
        <Legend swatch="bg-emerald-100 dark:bg-emerald-950" label="strong word" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${swatch}`} />
      {label}
    </span>
  );
}
