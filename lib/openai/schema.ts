import { z } from "zod";

// Structured Outputs schema for the single combined content/quality/vocabulary
// analysis call (source spec §7). Mirrors lib/types.ts's AiAnalysis shape.
export const aiAnalysisSchema = z.object({
  relevance: z.object({
    score: z.number().min(0).max(100),
    explanation: z.string(),
    quote: z.string(),
  }),
  quality: z.object({
    score: z.number().min(0).max(100),
    explanation: z.string(),
    quote: z.string(),
    flaggedPhrases: z.array(
      z.object({
        original: z.string(),
        rewrite: z.string(),
      })
    ),
  }),
  vocabulary: z.object({
    score: z.number().min(0).max(100),
    explanation: z.string(),
    quote: z.string(),
    suggestions: z.array(
      z.object({
        original: z.string(),
        suggestion: z.string(),
      })
    ),
  }),
});

export type AiAnalysisSchema = z.infer<typeof aiAnalysisSchema>;
