import type { FillerOccurrence, FillerStats, TranscriptWord } from "@/lib/types";

// Maintained filler-word/phrase dictionary. Case-insensitive, word-boundary
// aware (matched against whole transcript tokens, not substrings), longest
// phrases first so "you know" wins over any accidental single-word match.
const FILLER_PHRASES: string[][] = [
  ["you", "know"],
  ["sort", "of"],
  ["kind", "of"],
  ["i", "mean"],
  ["so", "yeah"],
  ["um"],
  ["uh"],
  ["like"],
  ["basically"],
].sort((a, b) => b.length - a.length);

function normalize(word: string): string {
  return word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, "");
}

// "actually" and "right?" are handled as their own tokens rather than being
// folded into normalize(), since "right" alone is not a filler — only the
// tag-question use ("right?") is.
function isRightTag(rawWord: string): boolean {
  return /^right\?+$/i.test(rawWord.trim());
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

/**
 * Deterministic, local filler-word detector: no AI call. Scans a
 * word-timestamped transcript for filler words/phrases and returns counts,
 * a per-minute rate, and the exact timestamped occurrences (for transcript
 * highlighting).
 */
export function detectFillerWords(
  words: TranscriptWord[],
  durationSec: number
): FillerStats {
  const occurrences: FillerOccurrence[] = [];
  const byWord: Record<string, number> = {};

  const record = (key: string, first: TranscriptWord, last: TranscriptWord) => {
    occurrences.push({ word: key, start: first.start, end: last.end });
    byWord[key] = (byWord[key] ?? 0) + 1;
  };

  let i = 0;
  while (i < words.length) {
    if (isRightTag(words[i].word)) {
      record("right?", words[i], words[i]);
      i += 1;
      continue;
    }

    if (normalize(words[i].word) === "actually") {
      record("actually", words[i], words[i]);
      i += 1;
      continue;
    }

    const matchedPhrase = FILLER_PHRASES.find((phrase) =>
      matchesPhraseAt(words, i, phrase)
    );

    if (matchedPhrase) {
      const lastWord = words[i + matchedPhrase.length - 1];
      record(matchedPhrase.join(" "), words[i], lastWord);
      i += matchedPhrase.length;
      continue;
    }

    i += 1;
  }

  const totalCount = occurrences.length;
  const minutes = durationSec / 60;
  const perMinute = minutes > 0 ? totalCount / minutes : 0;

  return { totalCount, perMinute, byWord, occurrences };
}
