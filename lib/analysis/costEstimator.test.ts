import { describe, it, expect } from "vitest";
import { estimateSessionCostUsd } from "./costEstimator";

describe("estimateSessionCostUsd", () => {
  it("estimates cost for a 3-minute recording", () => {
    const cost = estimateSessionCostUsd(180);
    // transcription: 3 min * 0.006 = 0.018
    // analysis: (1200/1e6)*0.15 + (500/1e6)*0.6 = 0.00018 + 0.0003 = 0.00048
    expect(cost).toBeCloseTo(0.01848, 5);
  });

  it("scales transcription cost with duration", () => {
    const short = estimateSessionCostUsd(60);
    const long = estimateSessionCostUsd(120);
    expect(long).toBeGreaterThan(short);
  });

  it("returns a positive cost for zero duration (analysis call still runs)", () => {
    expect(estimateSessionCostUsd(0)).toBeGreaterThan(0);
  });
});
