import { describe, it, expect } from "vitest";
import { calculatePace } from "./paceCalculator";
import type { TranscriptWord } from "@/lib/types";

function makeWords(count: number): TranscriptWord[] {
  return Array.from({ length: count }, (_, i) => ({
    word: `word${i}`,
    start: i,
    end: i + 0.5,
  }));
}

describe("calculatePace", () => {
  it("computes words per minute from word count and duration", () => {
    // 150 words in 60 seconds = 150 WPM
    const stats = calculatePace(makeWords(150), 60);
    expect(stats.wordsPerMinute).toBeCloseTo(150, 5);
    expect(stats.totalWords).toBe(150);
    expect(stats.durationSec).toBe(60);
  });

  it("bands pace as slow below ~110 WPM", () => {
    const stats = calculatePace(makeWords(90), 60);
    expect(stats.band).toBe("slow");
  });

  it("bands pace as ok in the ~110-160 WPM range", () => {
    const stats = calculatePace(makeWords(140), 60);
    expect(stats.band).toBe("ok");
  });

  it("bands pace as fast above ~160 WPM", () => {
    const stats = calculatePace(makeWords(190), 60);
    expect(stats.band).toBe("fast");
  });

  it("returns zero WPM and slow band for zero duration", () => {
    const stats = calculatePace([], 0);
    expect(stats.wordsPerMinute).toBe(0);
    expect(stats.band).toBe("slow");
  });
});
