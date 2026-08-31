import { describe, it, expect } from "vitest";
import { quotesAreGrounded } from "./quoteValidation";
import type { AiAnalysis } from "@/lib/types";

const transcript =
  "I led the migration project and it was a great learning experience for me and the team.";

function makeAnalysis(overrides: Partial<AiAnalysis> = {}): AiAnalysis {
  return {
    relevance: {
      score: 80,
      explanation: "Answers the question directly.",
      quote: "I led the migration project",
    },
    quality: {
      score: 70,
      explanation: "Clear structure.",
      quote: "it was a great learning experience",
      flaggedPhrases: [],
    },
    vocabulary: {
      score: 60,
      explanation: "Uses 'led' well.",
      quote: "I led the migration project",
      suggestions: [],
    },
    ...overrides,
  };
}

describe("quotesAreGrounded", () => {
  it("returns true when every quote is a verbatim substring of the transcript", () => {
    expect(quotesAreGrounded(makeAnalysis(), transcript)).toBe(true);
  });

  it("is case-insensitive and tolerant of surrounding whitespace", () => {
    const analysis = makeAnalysis({
      relevance: {
        score: 80,
        explanation: "x",
        quote: "  I LED the migration project  ",
      },
    });
    expect(quotesAreGrounded(analysis, transcript)).toBe(true);
  });

  it("returns false when a quote is empty", () => {
    const analysis = makeAnalysis({
      relevance: { score: 80, explanation: "x", quote: "" },
    });
    expect(quotesAreGrounded(analysis, transcript)).toBe(false);
  });

  it("returns false when a quote does not appear in the transcript", () => {
    const analysis = makeAnalysis({
      quality: {
        score: 70,
        explanation: "x",
        quote: "this sentence was never said",
        flaggedPhrases: [],
      },
    });
    expect(quotesAreGrounded(analysis, transcript)).toBe(false);
  });
});
