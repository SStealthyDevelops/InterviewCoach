import { z } from "zod";
import type { Session } from "@/lib/types";

/** What the client sends after composing a scorecard. Video never leaves IndexedDB. */
export type SessionAnalyticsInput = Omit<Session, "videoBlob">;

// Validates only the fields analyticsRepo.ts reads out into columns.
// `.passthrough()` at each level keeps the rest of the payload intact so it
// still lands whole in `sessions.raw_json` — see lib/db/schema.ts.
export const sessionAnalyticsInputSchema = z
  .object({
    id: z.string().min(1),
    createdAt: z.string().min(1),
    question: z.object({ text: z.string(), category: z.string().optional() }).passthrough(),
    durationSec: z.number(),
    fillerStats: z
      .object({
        totalCount: z.number(),
        perMinute: z.number(),
        byWord: z.record(z.string(), z.number()),
      })
      .passthrough(),
    paceStats: z.object({ wordsPerMinute: z.number(), band: z.string() }).passthrough(),
    vocabularyStats: z
      .object({
        strongMatches: z.array(z.object({ phrase: z.string() }).passthrough()),
        weakMatches: z.array(z.object({ phrase: z.string() }).passthrough()),
      })
      .passthrough(),
    eyeContactStats: z.object({ facingCameraPct: z.number(), trend: z.string() }).passthrough(),
    scorecard: z
      .object({
        overallScore: z.number(),
        overallBand: z.string(),
        pillars: z.array(
          z.object({ name: z.string(), score: z.number(), takeaway: z.string() }).passthrough()
        ),
      })
      .passthrough(),
  })
  .passthrough();

/** Fixed display/series order for the five scorecard pillars. */
export const PILLAR_ORDER = [
  "Content Relevance",
  "Structure & Clarity",
  "Delivery",
  "Presence",
  "Vocabulary & Impact",
] as const;

export interface TrendPoint {
  sessionId: string;
  createdAt: string; // ISO
  value: number;
}

export interface PillarTrendSeries {
  pillar: string;
  points: TrendPoint[];
}

export interface FillerWordCount {
  word: string;
  count: number;
}

export interface VocabularyTotals {
  strong: number;
  weak: number;
}

export interface PillarAverage {
  name: string;
  average: number;
}

export interface ScoreDeltaSummary {
  earlierAvg: number;
  recentAvg: number;
  deltaPct: number;
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalPracticeSec: number;
  averageScore: number | null;
  currentStreakDays: number;
  sessionsLast7Days: number;
  sessionsLast30Days: number;
  bestPillar: PillarAverage | null;
  toughestPillar: PillarAverage | null;
  scoreDelta: ScoreDeltaSummary | null;
  scoreTrend: TrendPoint[];
  pillarTrends: PillarTrendSeries[];
  fillerRateTrend: TrendPoint[];
  paceTrend: TrendPoint[];
  eyeContactTrend: TrendPoint[];
  topFillerWords: FillerWordCount[];
  vocabularyTotals: VocabularyTotals;
}
