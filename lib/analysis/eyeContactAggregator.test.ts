import { describe, it, expect } from "vitest";
import { EyeContactAggregator } from "./eyeContactAggregator";

describe("EyeContactAggregator", () => {
  it("reports unavailable with no samples", () => {
    const agg = new EyeContactAggregator();
    const stats = agg.getStats();
    expect(stats.trend).toBe("unavailable");
    expect(stats.facingCameraPct).toBe(-1);
  });

  it("reports 100% and steady when always facing the camera", () => {
    const agg = new EyeContactAggregator();
    for (let t = 0; t <= 5; t += 1) {
      agg.addSample(true, t);
    }
    const stats = agg.getStats();
    expect(stats.facingCameraPct).toBe(100);
    expect(stats.trend).toBe("steady");
    expect(stats.longestLookAwayStreakSec).toBe(0);
  });

  it("tracks the longest continuous look-away streak in seconds", () => {
    const agg = new EyeContactAggregator();
    agg.addSample(true, 0);
    agg.addSample(true, 1); // still facing camera at t=1
    agg.addSample(false, 2); // look-away streak begins accruing from here
    agg.addSample(false, 3);
    agg.addSample(false, 4); // 3 seconds elapsed while looking away (1->4)
    agg.addSample(true, 5); // look-away streak ends
    agg.addSample(false, 6);
    agg.addSample(true, 7); // short second streak (1s), shorter than the first

    const stats = agg.getStats();
    expect(stats.longestLookAwayStreakSec).toBe(3);
  });

  it("bands trend as frequent-breaks once facing-camera percentage drops low", () => {
    const agg = new EyeContactAggregator();
    for (let t = 0; t < 10; t += 1) {
      agg.addSample(t < 3, t); // facing camera only 3/10 samples
    }
    const stats = agg.getStats();
    expect(stats.facingCameraPct).toBe(30);
    expect(stats.trend).toBe("frequent-breaks");
  });
});
