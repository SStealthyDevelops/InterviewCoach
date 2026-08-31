import type {
  AiAnalysis,
  AnnotatedTranscriptSegment,
  EyeContactStats,
  FillerStats,
  PaceStats,
  Scorecard,
  ScoreBand,
  ScorePillar,
  Transcript,
  TranscriptTag,
  TranscriptWord,
  VocabularyStats,
} from "@/lib/types";

export interface ComposeScorecardInput {
  question: string;
  transcript: Transcript;
  fillerStats: FillerStats;
  paceStats: PaceStats;
  vocabularyStats: VocabularyStats;
  eyeContactStats: EyeContactStats;
  aiAnalysis: AiAnalysis;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function deliveryPillar(fillerStats: FillerStats, paceStats: PaceStats): ScorePillar {
  const fillerPenalty = Math.min(50, fillerStats.perMinute * 8);
  const pacePenalty = paceStats.band === "ok" ? 0 : 15;
  const score = clamp(100 - fillerPenalty - pacePenalty, 0, 100);

  return {
    name: "Delivery",
    score,
    takeaway: `${fillerStats.perMinute.toFixed(1)} filler words per minute; pace was ${paceStats.band} (${Math.round(paceStats.wordsPerMinute)} WPM).`,
  };
}

function presencePillar(eyeContactStats: EyeContactStats): ScorePillar {
  if (eyeContactStats.trend === "unavailable") {
    return {
      name: "Presence",
      score: 50,
      takeaway:
        "Eye-contact tracking was unavailable for this session, so this score is a neutral placeholder rather than a real measurement.",
    };
  }

  return {
    name: "Presence",
    score: clamp(eyeContactStats.facingCameraPct, 0, 100),
    takeaway: `You faced the camera ${Math.round(eyeContactStats.facingCameraPct)}% of the time (${eyeContactStats.trend === "steady" ? "steady" : "frequent breaks in eye contact"}); longest look-away streak was ${eyeContactStats.longestLookAwayStreakSec.toFixed(1)}s.`,
  };
}

function overallBandFor(score: number): ScoreBand {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Solid, with gaps";
  return "Needs work";
}

interface RankedItem<T> {
  strength: number;
  item: T;
}

function topN<T>(candidates: RankedItem<T>[], n: number): T[] {
  return candidates
    .slice()
    .sort((a, b) => b.strength - a.strength)
    .slice(0, n)
    .map((c) => c.item);
}

function buildTopWorked(input: ComposeScorecardInput): Scorecard["topWorked"] {
  const { aiAnalysis, fillerStats, vocabularyStats, eyeContactStats } = input;
  const candidates: RankedItem<Scorecard["topWorked"][number]>[] = [];

  if (aiAnalysis.relevance.score >= 70) {
    candidates.push({
      strength: aiAnalysis.relevance.score,
      item: { summary: "You answered the question directly.", quote: aiAnalysis.relevance.quote },
    });
  }
  if (aiAnalysis.quality.score >= 70) {
    candidates.push({
      strength: aiAnalysis.quality.score,
      item: { summary: "Your answer was clearly structured.", quote: aiAnalysis.quality.quote },
    });
  }
  if (fillerStats.perMinute < 3) {
    candidates.push({
      strength: 90 - fillerStats.perMinute * 10,
      item: {
        summary: `You kept filler words to a minimum (${fillerStats.perMinute.toFixed(1)}/min).`,
      },
    });
  }
  if (vocabularyStats.strongMatches.length > 0) {
    const example = vocabularyStats.strongMatches[0].phrase;
    candidates.push({
      strength: 70,
      item: {
        summary: `You used strong action words like "${example}".`,
        quote: example,
      },
    });
  }
  if (eyeContactStats.trend === "steady" && eyeContactStats.facingCameraPct >= 70) {
    candidates.push({
      strength: eyeContactStats.facingCameraPct,
      item: {
        summary: `You maintained solid eye contact with the camera (${Math.round(eyeContactStats.facingCameraPct)}% of the time).`,
      },
    });
  }

  return topN(candidates, 3);
}

function buildTopFixes(input: ComposeScorecardInput): Scorecard["topFixes"] {
  const { aiAnalysis, fillerStats, paceStats } = input;
  const candidates: RankedItem<Scorecard["topFixes"][number]>[] = [];

  for (const flagged of aiAnalysis.quality.flaggedPhrases) {
    candidates.push({
      strength: 100 - aiAnalysis.quality.score,
      item: {
        summary: "This phrasing undercuts your answer.",
        said: flagged.original,
        tryInstead: flagged.rewrite,
      },
    });
  }
  for (const suggestion of aiAnalysis.vocabulary.suggestions) {
    candidates.push({
      strength: 100 - aiAnalysis.vocabulary.score,
      item: {
        summary: "Swap this for a stronger phrase.",
        said: suggestion.original,
        tryInstead: suggestion.suggestion,
      },
    });
  }
  if (fillerStats.perMinute >= 3) {
    candidates.push({
      strength: fillerStats.perMinute * 10,
      item: {
        summary: "Cut back on filler words.",
        said: `${fillerStats.perMinute.toFixed(1)} filler words per minute`,
        tryInstead: "Pause silently instead of using a filler word.",
      },
    });
  }
  if (paceStats.band !== "ok") {
    const isFast = paceStats.band === "fast";
    candidates.push({
      strength: 40,
      item: {
        summary: isFast ? "Slow down a little." : "Pick up the pace a little.",
        said: `${Math.round(paceStats.wordsPerMinute)} words per minute`,
        tryInstead: isFast
          ? "Aim for roughly 110-160 WPM by pausing between ideas."
          : "Aim for roughly 110-160 WPM to keep your energy up.",
      },
    });
  }

  return topN(candidates, 3);
}

function isWordWithin(word: TranscriptWord, range: { start: number; end: number }): boolean {
  return word.start >= range.start && word.end <= range.end;
}

function annotateTranscript(
  words: TranscriptWord[],
  fillerStats: FillerStats,
  vocabularyStats: VocabularyStats
): AnnotatedTranscriptSegment[] {
  return words.map((word) => {
    let tag: TranscriptTag = null;

    if (fillerStats.occurrences.some((o) => isWordWithin(word, o))) {
      tag = "filler";
    } else if (vocabularyStats.weakMatches.some((m) => isWordWithin(word, m))) {
      tag = "weak";
    } else if (vocabularyStats.strongMatches.some((m) => isWordWithin(word, m))) {
      tag = "strong";
    }

    return { text: word.word, tag };
  });
}

/**
 * Merges every local + AI signal into the rendered feedback report (source
 * spec §5.8, §8). No pillar is rendered with just a number: every score is
 * paired with an explanation and, where possible, a concrete quote/stat.
 */
export function composeScorecard(input: ComposeScorecardInput): Scorecard {
  const { question, transcript, fillerStats, paceStats, vocabularyStats, eyeContactStats, aiAnalysis } =
    input;

  const pillars: ScorePillar[] = [
    {
      name: "Content Relevance",
      score: aiAnalysis.relevance.score,
      takeaway: aiAnalysis.relevance.explanation,
    },
    {
      name: "Structure & Clarity",
      score: aiAnalysis.quality.score,
      takeaway: aiAnalysis.quality.explanation,
    },
    deliveryPillar(fillerStats, paceStats),
    presencePillar(eyeContactStats),
    {
      name: "Vocabulary & Impact",
      score: aiAnalysis.vocabulary.score,
      takeaway: aiAnalysis.vocabulary.explanation,
    },
  ];

  const overallScore = Math.round(
    pillars.reduce((sum, p) => sum + p.score, 0) / pillars.length
  );

  return {
    overallScore,
    overallBand: overallBandFor(overallScore),
    question,
    pillars,
    topWorked: buildTopWorked(input),
    topFixes: buildTopFixes(input),
    annotatedTranscript: annotateTranscript(transcript.words, fillerStats, vocabularyStats),
  };
}
