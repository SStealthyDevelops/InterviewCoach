import { describe, it, expect } from "vitest";
import { scanVocabulary } from "./vocabularyWordList";
import type { TranscriptWord } from "@/lib/types";

function words(list: [string, number, number][]): TranscriptWord[] {
  return list.map(([word, start, end]) => ({ word, start, end }));
}

describe("scanVocabulary", () => {
  it("flags strong action verbs", () => {
    const w = words([
      ["I", 0, 0.1],
      ["led", 0.1, 0.3],
      ["the", 0.3, 0.4],
      ["project", 0.4, 0.7],
    ]);
    const stats = scanVocabulary(w);
    expect(stats.strongMatches).toEqual([
      { kind: "strong", phrase: "led", start: 0.1, end: 0.3 },
    ]);
    expect(stats.weakMatches).toEqual([]);
  });

  it("flags weak/passive multi-word phrases", () => {
    const w = words([
      ["I", 0, 0.1],
      ["was", 0.1, 0.3],
      ["responsible", 0.3, 0.6],
      ["for", 0.6, 0.7],
      ["the", 0.7, 0.8],
      ["launch", 0.8, 1.0],
    ]);
    const stats = scanVocabulary(w);
    expect(stats.weakMatches).toEqual([
      {
        kind: "weak",
        phrase: "was responsible for",
        start: 0.1,
        end: 0.7,
      },
    ]);
  });

  it("is case-insensitive and word-boundary aware", () => {
    const w = words([
      ["Negotiated", 0, 0.3],
      ["leadership", 0.3, 0.6],
    ]);
    const stats = scanVocabulary(w);
    // "negotiated" matches; "leadership" must NOT match "led" as a substring
    expect(stats.strongMatches.map((m) => m.phrase)).toEqual(["Negotiated"]);
  });

  it("returns empty matches for a transcript with no listed words", () => {
    const w = words([
      ["The", 0, 0.1],
      ["weather", 0.1, 0.4],
      ["was", 0.4, 0.6],
      ["nice", 0.6, 0.8],
    ]);
    const stats = scanVocabulary(w);
    expect(stats.strongMatches).toEqual([]);
    expect(stats.weakMatches).toEqual([]);
  });
});
