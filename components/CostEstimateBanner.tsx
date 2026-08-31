import { estimateSessionCostUsd } from "@/lib/analysis/costEstimator";
import { RECORDING_CAP_SEC } from "@/lib/config/models";

export function CostEstimateBanner() {
  const maxCost = estimateSessionCostUsd(RECORDING_CAP_SEC);

  return (
    <p className="rounded-lg bg-zinc-100 px-4 py-2.5 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      Estimated cost for a full {Math.round(RECORDING_CAP_SEC / 60)}-minute answer:{" "}
      <span className="font-medium text-zinc-900 dark:text-zinc-100">
        ${maxCost.toFixed(3)}
      </span>{" "}
      in OpenAI usage. Shorter answers cost less.
    </p>
  );
}
