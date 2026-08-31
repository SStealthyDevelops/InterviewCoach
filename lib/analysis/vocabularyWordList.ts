import type { TranscriptWord, VocabularyMatch, VocabularyStats } from "@/lib/types";

// Maintained word lists for the local vocabulary pass (§5.7). This flags
// candidates instantly and for free; the OpenAI structured call then judges
// these in context and suggests alternatives.
const STRONG_VERBS = [
  "led",
  "negotiated",
  "launched",
  "reduced",
  "owned",
  "drove",
  "built",
  "spearheaded",
  "delivered",
  "achieved",
  "improved",
  "increased",
  "decreased",
  "initiated",
  "mentored",
  "designed",
  "implemented",
  "resolved",
  "exceeded",
  "transformed",
];

const WEAK_PHRASES: string[][] = [
  ["was", "responsible", "for"],
  ["sort", "of", "worked", "on"],
  ["helped", "with"],
  ["worked", "on"],
  ["was", "involved", "in"],
  ["was", "tasked", "with"],
  ["assisted", "with"],
].sort((a, b) => b.length - a.length);

function normalize(word: string): string {
  return word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, "");
}

function matchesPhraseAt(
  words: TranscriptWord[],
  index: number,
  phrase: string[]
): boolean {
  if (index + phrase.length > words.length) return false;
  return phrase.every(
    (token, offset) => normalize(words[index + offset].word) === token
  );
}

function originalPhrase(words: TranscriptWord[], start: number, length: number): string {
  return words
    .slice(start, start + length)
    .map((w) => w.word)
    .join(" ");
}

/**
 * Deterministic, local strong/weak vocabulary scan: no AI call. Flags
 * candidate strong action verbs and weak/passive phrases with their
 * transcript location, for the OpenAI call to then judge in context.
 */
export function scanVocabulary(words: TranscriptWord[]): VocabularyStats {
  const strongMatches: VocabularyMatch[] = [];
  const weakMatches: VocabularyMatch[] = [];

  let i = 0;
  while (i < words.length) {
    const weakPhrase = WEAK_PHRASES.find((phrase) =>
      matchesPhraseAt(words, i, phrase)
    );
    if (weakPhrase) {
      const lastWord = words[i + weakPhrase.length - 1];
      weakMatches.push({
        kind: "weak",
        phrase: originalPhrase(words, i, weakPhrase.length),
        start: words[i].start,
        end: lastWord.end,
      });
      i += weakPhrase.length;
      continue;
    }

    if (STRONG_VERBS.includes(normalize(words[i].word))) {
      strongMatches.push({
        kind: "strong",
        phrase: words[i].word,
        start: words[i].start,
        end: words[i].end,
      });
    }

    i += 1;
  }

  return { strongMatches, weakMatches };
}
