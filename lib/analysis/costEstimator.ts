import {
  ANALYSIS_ESTIMATE,
  PRICING,
} from "@/lib/config/models";

/**
 * Rough pre-session USD cost estimate: transcription cost scales with
 * recording duration, analysis cost is a fixed rough estimate for the one
 * structured chat call. Shown to the user before they start recording.
 */
export function estimateSessionCostUsd(durationSec: number): number {
  const minutes = durationSec / 60;
  const transcriptionCost = minutes * PRICING.transcriptionPerMinuteUsd;

  const analysisCost =
    (ANALYSIS_ESTIMATE.estimatedInputTokensPerSession / 1_000_000) *
      PRICING.analysisInputPerMillionTokensUsd +
    (ANALYSIS_ESTIMATE.estimatedOutputTokens / 1_000_000) *
      PRICING.analysisOutputPerMillionTokensUsd;

  return transcriptionCost + analysisCost;
}
