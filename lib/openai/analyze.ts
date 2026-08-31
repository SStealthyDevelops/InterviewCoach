import { zodResponseFormat } from "openai/helpers/zod";
import { createOpenAiClient } from "./client";
import { aiAnalysisSchema } from "./schema";
import { quotesAreGrounded } from "./quoteValidation";
import { ANALYSIS_MODEL } from "@/lib/config/models";
import type { AiAnalysis, VocabularyStats } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert interview coach reviewing a spoken practice answer.
You will be given the interview question and a transcript of the candidate's answer, plus
vocabulary words the transcript already contains (flagged locally, not by you).
Score three dimensions from 0-100 each: relevance (does the answer actually address the
question, stay on topic, include a concrete example), quality (structure/clarity: rambling,
hedging, negative framing, missing situation/action/result shape, weak conclusion), and
vocabulary (are strong action words used meaningfully in context, are there weak/passive
phrases that should be swapped for something stronger).
For EVERY dimension, "quote" MUST be a verbatim substring copied exactly from the transcript
text you were given — never paraphrase or invent it. If you cannot find a supporting quote,
pick the closest verbatim sentence rather than inventing one.`;

function buildUserPrompt(
  question: string,
  transcriptText: string,
  vocabulary: VocabularyStats
): string {
  const strong = vocabulary.strongMatches.map((m) => m.phrase).join(", ") || "none";
  const weak = vocabulary.weakMatches.map((m) => m.phrase).join(", ") || "none";

  return `Question: ${question}

Transcript:
"""
${transcriptText}
"""

Locally-detected strong action words already present: ${strong}
Locally-detected weak/passive phrases already present: ${weak}`;
}

async function requestAnalysis(
  apiKey: string,
  question: string,
  transcriptText: string,
  vocabulary: VocabularyStats
): Promise<AiAnalysis> {
  const client = createOpenAiClient(apiKey);

  const completion = await client.chat.completions.parse({
    model: ANALYSIS_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: buildUserPrompt(question, transcriptText, vocabulary),
      },
    ],
    response_format: zodResponseFormat(aiAnalysisSchema, "interview_analysis"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("OpenAI response did not include a parsed analysis result.");
  }
  return parsed;
}

/**
 * Runs the single structured content/quality/vocabulary analysis call
 * (source spec §7), retrying once if any returned quote isn't actually
 * present in the transcript (grounding mitigation, source spec §12).
 */
export async function analyzeAnswer(
  apiKey: string,
  question: string,
  transcriptText: string,
  vocabulary: VocabularyStats
): Promise<AiAnalysis> {
  const first = await requestAnalysis(apiKey, question, transcriptText, vocabulary);
  if (quotesAreGrounded(first, transcriptText)) {
    return first;
  }

  const retry = await requestAnalysis(apiKey, question, transcriptText, vocabulary);
  return retry;
}
