// Single place to bump OpenAI model names and pricing as the lineup changes.
// See docs/superpowers/specs/2026-08-31-interview-coach-mvp-design.md section 5.

export const TRANSCRIPTION_MODEL = "whisper-1";
export const ANALYSIS_MODEL = "gpt-4o-mini";

// USD pricing used only to produce a rough pre-session cost estimate shown
// to the user. Not used for billing. Update when OpenAI changes pricing.
export const PRICING = {
  transcriptionPerMinuteUsd: 0.006,
  analysisInputPerMillionTokensUsd: 0.15,
  analysisOutputPerMillionTokensUsd: 0.6,
} as const;

// Rough token estimates for the single structured analysis call, used only
// for the pre-session cost estimate (not exact).
export const ANALYSIS_ESTIMATE = {
  // question + transcript + system/schema overhead
  estimatedInputTokensPerSession: 1200,
  estimatedOutputTokens: 500,
} as const;

export const RECORDING_CAP_SEC = 180; // 3-minute soft cap
export const RECORDING_WARNING_SEC = 150; // warn at 2:30
