import type { EyeContactStats } from "@/lib/types";

const STEADY_THRESHOLD_PCT = 75;

/**
 * Pure, testable accumulator for eye-contact samples. The MediaPipe-driven
 * sampling loop (browser-only, see eyeContactTracker.ts) feeds this one
 * boolean "was facing the camera" sample at a time; this class turns that
 * stream into the report stats. Kept separate from the MediaPipe glue so
 * the actual aggregation logic is unit-testable without a real camera.
 */
export class EyeContactAggregator {
  private totalSamples = 0;
  private facingSamples = 0;
  private currentLookAwaySec = 0;
  private longestLookAwaySec = 0;
  private lastTimestampSec: number | null = null;

  addSample(facingCamera: boolean, timestampSec: number): void {
    if (this.lastTimestampSec !== null) {
      const delta = Math.max(0, timestampSec - this.lastTimestampSec);
      if (facingCamera) {
        this.currentLookAwaySec = 0;
      } else {
        this.currentLookAwaySec += delta;
        this.longestLookAwaySec = Math.max(this.longestLookAwaySec, this.currentLookAwaySec);
      }
    }

    this.lastTimestampSec = timestampSec;
    this.totalSamples += 1;
    if (facingCamera) this.facingSamples += 1;
  }

  getStats(): EyeContactStats {
    if (this.totalSamples === 0) {
      return { facingCameraPct: -1, longestLookAwayStreakSec: 0, trend: "unavailable" };
    }

    const facingCameraPct = (this.facingSamples / this.totalSamples) * 100;

    return {
      facingCameraPct,
      longestLookAwayStreakSec: this.longestLookAwaySec,
      trend: facingCameraPct >= STEADY_THRESHOLD_PCT ? "steady" : "frequent-breaks",
    };
  }
}
