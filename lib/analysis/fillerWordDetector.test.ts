import { describe, it, expect } from "vitest";
import { detectFillerWords } from "./fillerWordDetector";
import type { TranscriptWord } from "@/lib/types";

function words(list: [string, number, number][]): TranscriptWord[] {
  return list.map(([word, start, end]) => ({ word, start, end }));
}

describe("detectFillerWords", () => {
  it("counts single-word fillers case-insensitively", () => {
    const w = words([
      ["So", 0, 0.3],
      ["Um", 0.3, 0.6],
      ["I", 0.6, 0.8],
      ["led", 0.8, 1.0],
      ["the", 1.0, 1.1],
      ["team", 1.1, 1.4],
    ]);
    const stats = detectFillerWords(w, 60);
    expect(stats.totalCount).toBe(1);
    expect(stats.byWord["um"]).toBe(1);
    expect(stats.occurrences).toEqual([{ word: "um", start: 0.3, end: 0.6 }]);
  });

  it("does not match filler substrings inside unrelated words (word-boundary aware)", () => {
    // "like" should not match inside "unlikely"
    const w = words([
      ["It's", 0, 0.2],
      ["unlikely", 0.2, 0.7],
    ]);
    const stats = detectFillerWords(w, 60);
    expect(stats.totalCount).toBe(0);
  });

  it("matches multi-word fillers like 'you know' and 'sort of'", () => {
    const w = words([
      ["you", 0, 0.2],
      ["know", 0.2, 0.4],
      ["it", 0.4, 0.5],
      ["was", 0.5, 0.6],
      ["sort", 0.6, 0.7],
      ["of", 0.7, 0.8],
      ["hard", 0.8, 1.0],
    ]);
    const stats = detectFillerWords(w, 60);
    expect(stats.totalCount).toBe(2);
    expect(stats.byWord["you know"]).toBe(1);
    expect(stats.byWord["sort of"]).toBe(1);
  });

  it("computes fillers per minute from duration", () => {
    // 4 fillers in 120 seconds = 2 per minute
    const w = words([
      ["um", 0, 0.2],
      ["uh", 1, 1.2],
      ["like", 2, 2.2],
      ["um", 3, 3.2],
    ]);
    const stats = detectFillerWords(w, 120);
    expect(stats.totalCount).toBe(4);
    expect(stats.perMinute).toBeCloseTo(2, 5);
  });

  it("returns zero stats for empty transcript", () => {
    const stats = detectFillerWords([], 60);
    expect(stats.totalCount).toBe(0);
    expect(stats.perMinute).toBe(0);
    expect(stats.occurrences).toEqual([]);
  });
});
