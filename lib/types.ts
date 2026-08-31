// Shared domain types for the Interview Coach MVP.
// See docs/superpowers/specs/2026-08-31-interview-coach-mvp-design.md

export interface TranscriptWord {
  word: string;
  start: number; // seconds
  end: number; // seconds
}

export interface Transcript {
  text: string;
  words: TranscriptWord[];
}

export interface FillerOccurrence {
  word: string;
  start: number;
  end: number;
}

export interface FillerStats {
  totalCount: number;
  perMinute: number;
  byWord: Record<string, number>;
  occurrences: FillerOccurrence[];
}

export type PaceBand = "slow" | "ok" | "fast";

export interface PaceStats {
  wordsPerMinute: number;
  band: PaceBand;
  totalWords: number;
  durationSec: number;
}

export type VocabularyMatchKind = "strong" | "weak";

export interface VocabularyMatch {
  kind: VocabularyMatchKind;
  phrase: string;
  start: number;
  end: number;
}

export interface VocabularyStats {
  strongMatches: VocabularyMatch[];
  weakMatches: VocabularyMatch[];
}

export type EyeContactTrend = "steady" | "frequent-breaks" | "unavailable";

export interface EyeContactStats {
  facingCameraPct: number; // 0-100, -1 if unavailable
  longestLookAwayStreakSec: number;
  trend: EyeContactTrend;
}

export interface AiPillarResult {
  score: number; // 0-100
  explanation: string;
  quote: string; // verbatim substring of the transcript
}

export interface AiQualityResult extends AiPillarResult {
  flaggedPhrases: { original: string; rewrite: string }[];
}

export interface AiVocabularyResult extends AiPillarResult {
  suggestions: { original: string; suggestion: string }[];
}

export interface AiAnalysis {
  relevance: AiPillarResult;
  quality: AiQualityResult;
  vocabulary: AiVocabularyResult;
}

export type ScoreBand = "Strong" | "Solid, with gaps" | "Needs work";

export interface ScorePillar {
  name:
    | "Content Relevance"
    | "Structure & Clarity"
    | "Delivery"
    | "Presence"
    | "Vocabulary & Impact";
  score: number; // 0-100
  takeaway: string;
}

export type TranscriptTag = "filler" | "weak" | "strong" | null;

export interface AnnotatedTranscriptSegment {
  text: string;
  tag: TranscriptTag;
}

export interface ScorecardHighlight {
  summary: string;
  quote?: string;
}

export interface Scorecard {
  overallScore: number; // 0-100
  overallBand: ScoreBand;
  question: string;
  pillars: ScorePillar[];
  topWorked: ScorecardHighlight[];
  topFixes: { summary: string; said: string; tryInstead: string }[];
  annotatedTranscript: AnnotatedTranscriptSegment[];
}

export interface Question {
  id: string;
  text: string;
  category: "behavioral" | "general" | "technical-general" | "curveball";
}

export interface Session {
  id: string;
  createdAt: string; // ISO
  question: { text: string; category?: Question["category"] };
  durationSec: number;
  videoBlob?: Blob;
  transcript: Transcript;
  fillerStats: FillerStats;
  paceStats: PaceStats;
  vocabularyStats: VocabularyStats;
  eyeContactStats: EyeContactStats;
  aiAnalysis: AiAnalysis;
  scorecard: Scorecard;
}
