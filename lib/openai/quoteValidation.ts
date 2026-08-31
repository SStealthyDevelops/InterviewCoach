import type { AiAnalysis } from "@/lib/types";

/**
 * Grounding check (source spec §12 mitigation): every quote the model
 * returns must be a real, verbatim (case/whitespace-insensitive) substring
 * of what the user actually said. If not, the caller should retry the
 * analysis call once rather than show a possibly-hallucinated quote.
 */
export function quotesAreGrounded(
  analysis: AiAnalysis,
  transcriptText: string
): boolean {
  const haystack = transcriptText.toLowerCase();
  const quotes = [
    analysis.relevance.quote,
    analysis.quality.quote,
    analysis.vocabulary.quote,
  ];

  return quotes.every((quote) => {
    const trimmed = quote.trim();
    if (trimmed.length === 0) return false;
    return haystack.includes(trimmed.toLowerCase());
  });
}
