import type { PaceBand, PaceStats, TranscriptWord } from "@/lib/types";

// Typical conversational interview-answer pace is ~110-160 WPM.
const SLOW_BELOW_WPM = 110;
const FAST_ABOVE_WPM = 160;

function bandFor(wordsPerMinute: number): PaceBand {
  if (wordsPerMinute < SLOW_BELOW_WPM) return "slow";
  if (wordsPerMinute > FAST_ABOVE_WPM) return "fast";
  return "ok";
}

/**
 * Deterministic, local pace calculation from transcript word timestamps.
 * No AI call.
 */
export function calculatePace(
  words: TranscriptWord[],
  durationSec: number
): PaceStats {
  const totalWords = words.length;
  const minutes = durationSec / 60;
  const wordsPerMinute = minutes > 0 ? totalWords / minutes : 0;

  return {
    wordsPerMinute,
    band: bandFor(wordsPerMinute),
    totalWords,
    durationSec,
  };
}
