import { describe, it, expect } from "vitest";
import { composeScorecard } from "./composeScorecard";
import type {
  AiAnalysis,
  EyeContactStats,
  FillerStats,
  PaceStats,
  Transcript,
  VocabularyStats,
} from "@/lib/types";

const transcriptText =
  "I led the migration project and um it went really well for the team.";
const transcript: Transcript = {
  text: transcriptText,
  words: transcriptText
    .split(" ")
    .map((word, i) => ({ word, start: i * 0.4, end: i * 0.4 + 0.3 })),
};

const goodAiAnalysis: AiAnalysis = {
  relevance: {
    score: 85,
    explanation: "Directly answers the question with a concrete example.",
    quote: "I led the migration project",
  },
  quality: {
    score: 78,
    explanation: "Clear structure with a defined outcome.",
    quote: "it went really well for the team",
    flaggedPhrases: [
      { original: "it went really well", rewrite: "we cut deployment time by 30%" },
    ],
  },
  vocabulary: {
    score: 72,
    explanation: "'led' is used meaningfully.",
    quote: "I led the migration project",
    suggestions: [{ original: "went really well", suggestion: "exceeded expectations" }],
  },
};

const lowFillerStats: FillerStats = {
  totalCount: 1,
  perMinute: 1,
  byWord: { um: 1 },
  occurrences: [{ word: "um", start: 2.4, end: 2.7 }],
};

const okPaceStats: PaceStats = {
  wordsPerMinute: 130,
  band: "ok",
  totalWords: 13,
  durationSec: 6,
};

const vocabularyStats: VocabularyStats = {
  strongMatches: [{ kind: "strong", phrase: "led", start: 0.4, end: 0.7 }],
  weakMatches: [],
};

const goodEyeContact: EyeContactStats = {
  facingCameraPct: 88,
  longestLookAwayStreakSec: 2,
  trend: "steady",
};

function baseInput() {
  return {
    question: "Tell me about a time you led a project.",
    transcript,
    fillerStats: lowFillerStats,
    paceStats: okPaceStats,
    vocabularyStats,
    eyeContactStats: goodEyeContact,
    aiAnalysis: goodAiAnalysis,
  };
}

describe("composeScorecard", () => {
  it("produces all five pillars each backed by an explanation", () => {
    const card = composeScorecard(baseInput());
    expect(card.pillars).toHaveLength(5);
    const names = card.pillars.map((p) => p.name);
    expect(names).toEqual([
      "Content Relevance",
      "Structure & Clarity",
      "Delivery",
      "Presence",
      "Vocabulary & Impact",
    ]);
    for (const pillar of card.pillars) {
      expect(pillar.takeaway.length).toBeGreaterThan(0);
      expect(pillar.score).toBeGreaterThanOrEqual(0);
      expect(pillar.score).toBeLessThanOrEqual(100);
    }
  });

  it("maps AI scores directly onto relevance, quality, and vocabulary pillars", () => {
    const card = composeScorecard(baseInput());
    const byName = Object.fromEntries(card.pillars.map((p) => [p.name, p.score]));
    expect(byName["Content Relevance"]).toBe(85);
    expect(byName["Structure & Clarity"]).toBe(78);
    expect(byName["Vocabulary & Impact"]).toBe(72);
  });

  it("scores Delivery high for low filler rate and on-band pace", () => {
    const card = composeScorecard(baseInput());
    const delivery = card.pillars.find((p) => p.name === "Delivery")!;
    expect(delivery.score).toBeGreaterThanOrEqual(80);
  });

  it("penalizes Delivery for a high filler rate", () => {
    const heavyFillers: FillerStats = {
      totalCount: 20,
      perMinute: 15,
      byWord: { um: 20 },
      occurrences: [],
    };
    const card = composeScorecard({ ...baseInput(), fillerStats: heavyFillers });
    const delivery = card.pillars.find((p) => p.name === "Delivery")!;
    expect(delivery.score).toBeLessThan(60);
  });

  it("maps eye-contact percentage onto the Presence pillar", () => {
    const card = composeScorecard(baseInput());
    const presence = card.pillars.find((p) => p.name === "Presence")!;
    expect(presence.score).toBe(88);
  });

  it("notes when eye-contact tracking was unavailable instead of faking a score", () => {
    const unavailable: EyeContactStats = {
      facingCameraPct: -1,
      longestLookAwayStreakSec: 0,
      trend: "unavailable",
    };
    const card = composeScorecard({ ...baseInput(), eyeContactStats: unavailable });
    const presence = card.pillars.find((p) => p.name === "Presence")!;
    expect(presence.takeaway.toLowerCase()).toContain("unavailable");
  });

  it("computes an overall score as the average of the five pillars, rounded", () => {
    const card = composeScorecard(baseInput());
    const expectedAvg = Math.round(
      card.pillars.reduce((sum, p) => sum + p.score, 0) / 5
    );
    expect(card.overallScore).toBe(expectedAvg);
  });

  it("bands overall score as Strong at 80+, Solid with gaps at 60-79, Needs work below 60", () => {
    expect(composeScorecard(baseInput()).overallBand).toMatch(/Strong|Solid, with gaps/);

    const weakEverything = composeScorecard({
      ...baseInput(),
      aiAnalysis: {
        relevance: { score: 20, explanation: "Off topic.", quote: "I led the migration project" },
        quality: {
          score: 20,
          explanation: "Rambling.",
          quote: "it went really well for the team",
          flaggedPhrases: [],
        },
        vocabulary: {
          score: 20,
          explanation: "Weak wording.",
          quote: "I led the migration project",
          suggestions: [],
        },
      },
      fillerStats: { totalCount: 30, perMinute: 20, byWord: {}, occurrences: [] },
    });
    expect(weakEverything.overallBand).toBe("Needs work");
  });

  it("includes up to 3 top-worked highlights and 3 top fixes, each concrete", () => {
    const card = composeScorecard(baseInput());
    expect(card.topWorked.length).toBeGreaterThan(0);
    expect(card.topWorked.length).toBeLessThanOrEqual(3);
    expect(card.topFixes.length).toBeGreaterThan(0);
    expect(card.topFixes.length).toBeLessThanOrEqual(3);
    for (const fix of card.topFixes) {
      expect(fix.said.length).toBeGreaterThan(0);
      expect(fix.tryInstead.length).toBeGreaterThan(0);
    }
  });

  it("annotates the transcript, tagging filler and strong-verb words", () => {
    const card = composeScorecard(baseInput());
    const fillerSegment = card.annotatedTranscript.find((s) => s.text === "um");
    const strongSegment = card.annotatedTranscript.find((s) => s.text === "led");
    expect(fillerSegment?.tag).toBe("filler");
    expect(strongSegment?.tag).toBe("strong");
    const untaggedSegment = card.annotatedTranscript.find((s) => s.text === "the");
    expect(untaggedSegment?.tag).toBeNull();
  });

  it("carries the question text through to the scorecard", () => {
    const card = composeScorecard(baseInput());
    expect(card.question).toBe("Tell me about a time you led a project.");
  });
});
