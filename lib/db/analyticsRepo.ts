import { getDb, withTransaction } from "@/lib/db/client";
import { average, currentStreakDays, scoreDelta } from "@/lib/analytics/compute";
import { PILLAR_ORDER } from "@/lib/analytics/types";
import type {
  AnalyticsSummary,
  FillerWordCount,
  PillarTrendSeries,
  SessionAnalyticsInput,
  TrendPoint,
  VocabularyTotals,
} from "@/lib/analytics/types";

// Server-only module (imported from Route Handlers only) — see lib/db/client.ts.

export function recordSession(input: SessionAnalyticsInput): void {
  const db = getDb();

  const vocabCounts = new Map<string, { kind: string; phrase: string; count: number }>();
  for (const match of input.vocabularyStats.strongMatches) {
    const key = `strong:${match.phrase}`;
    const existing = vocabCounts.get(key);
    vocabCounts.set(key, { kind: "strong", phrase: match.phrase, count: (existing?.count ?? 0) + 1 });
  }
  for (const match of input.vocabularyStats.weakMatches) {
    const key = `weak:${match.phrase}`;
    const existing = vocabCounts.get(key);
    vocabCounts.set(key, { kind: "weak", phrase: match.phrase, count: (existing?.count ?? 0) + 1 });
  }

  withTransaction(db, () => {
    // Cascades to pillar_scores/filler_words/vocabulary_matches/session_metrics,
    // so a retried recording is idempotent rather than duplicating rows.
    db.prepare("DELETE FROM sessions WHERE id = ?").run(input.id);

    db.prepare(
      `INSERT INTO sessions (
        id, created_at, question_text, question_category, duration_sec,
        overall_score, overall_band, pace_wpm, pace_band,
        filler_total_count, filler_per_minute, eye_contact_pct, eye_contact_trend, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      input.id,
      input.createdAt,
      input.question.text,
      input.question.category ?? null,
      input.durationSec,
      input.scorecard.overallScore,
      input.scorecard.overallBand,
      input.paceStats.wordsPerMinute,
      input.paceStats.band,
      input.fillerStats.totalCount,
      input.fillerStats.perMinute,
      input.eyeContactStats.facingCameraPct,
      input.eyeContactStats.trend,
      JSON.stringify(input)
    );

    const pillarStmt = db.prepare(
      "INSERT INTO pillar_scores (session_id, pillar_name, score, takeaway) VALUES (?, ?, ?, ?)"
    );
    for (const pillar of input.scorecard.pillars) {
      pillarStmt.run(input.id, pillar.name, pillar.score, pillar.takeaway);
    }

    const fillerStmt = db.prepare(
      "INSERT INTO filler_words (session_id, word, count) VALUES (?, ?, ?)"
    );
    for (const [word, count] of Object.entries(input.fillerStats.byWord)) {
      fillerStmt.run(input.id, word, count);
    }

    const vocabStmt = db.prepare(
      "INSERT INTO vocabulary_matches (session_id, kind, phrase, count) VALUES (?, ?, ?, ?)"
    );
    for (const entry of vocabCounts.values()) {
      vocabStmt.run(input.id, entry.kind, entry.phrase, entry.count);
    }
  });
}

export function deleteAllSessions(): void {
  getDb().exec("DELETE FROM sessions");
}

export function deleteSessionById(id: string): void {
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

interface SessionRow {
  id: string;
  created_at: string;
  duration_sec: number;
  overall_score: number;
  pace_wpm: number | null;
  filler_per_minute: number | null;
  eye_contact_pct: number | null;
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const db = getDb();

  const sessionRows = db
    .prepare(
      `SELECT id, created_at, duration_sec, overall_score, pace_wpm, filler_per_minute, eye_contact_pct
       FROM sessions ORDER BY created_at ASC`
    )
    .all() as unknown as SessionRow[];

  const scores = sessionRows.map((r) => r.overall_score);

  const scoreTrend: TrendPoint[] = sessionRows.map((r) => ({
    sessionId: r.id,
    createdAt: r.created_at,
    value: r.overall_score,
  }));
  const paceTrend: TrendPoint[] = sessionRows
    .filter((r) => r.pace_wpm !== null)
    .map((r) => ({ sessionId: r.id, createdAt: r.created_at, value: r.pace_wpm as number }));
  const fillerRateTrend: TrendPoint[] = sessionRows
    .filter((r) => r.filler_per_minute !== null)
    .map((r) => ({ sessionId: r.id, createdAt: r.created_at, value: r.filler_per_minute as number }));
  const eyeContactTrend: TrendPoint[] = sessionRows
    .filter((r) => r.eye_contact_pct !== null && r.eye_contact_pct >= 0)
    .map((r) => ({ sessionId: r.id, createdAt: r.created_at, value: r.eye_contact_pct as number }));

  const pillarRows = db
    .prepare(
      `SELECT p.session_id as session_id, p.pillar_name as pillar_name, p.score as score, s.created_at as created_at
       FROM pillar_scores p JOIN sessions s ON s.id = p.session_id
       ORDER BY s.created_at ASC`
    )
    .all() as unknown as Array<{ session_id: string; pillar_name: string; score: number; created_at: string }>;

  const pillarTrendMap = new Map<string, TrendPoint[]>();
  for (const row of pillarRows) {
    const list = pillarTrendMap.get(row.pillar_name) ?? [];
    list.push({ sessionId: row.session_id, createdAt: row.created_at, value: row.score });
    pillarTrendMap.set(row.pillar_name, list);
  }
  const knownOrder: readonly string[] = PILLAR_ORDER;
  const pillarTrends: PillarTrendSeries[] = [
    ...PILLAR_ORDER.filter((name) => pillarTrendMap.has(name)).map((name) => ({
      pillar: name,
      points: pillarTrendMap.get(name)!,
    })),
    // Forward-compatible: a pillar name added later still shows up.
    ...[...pillarTrendMap.entries()]
      .filter(([name]) => !knownOrder.includes(name))
      .map(([pillar, points]) => ({ pillar, points })),
  ];

  const pillarAverageRows = db
    .prepare(`SELECT pillar_name, AVG(score) as avg_score FROM pillar_scores GROUP BY pillar_name`)
    .all() as unknown as Array<{ pillar_name: string; avg_score: number }>;
  const pillarAverages = pillarAverageRows.map((r) => ({ name: r.pillar_name, average: r.avg_score }));
  const bestPillar =
    pillarAverages.length > 0
      ? pillarAverages.reduce((a, b) => (b.average > a.average ? b : a))
      : null;
  const toughestPillar =
    pillarAverages.length > 0
      ? pillarAverages.reduce((a, b) => (b.average < a.average ? b : a))
      : null;

  const fillerWordRows = db
    .prepare(`SELECT word, SUM(count) as total FROM filler_words GROUP BY word ORDER BY total DESC LIMIT 8`)
    .all() as unknown as Array<{ word: string; total: number }>;
  const topFillerWords: FillerWordCount[] = fillerWordRows.map((r) => ({ word: r.word, count: r.total }));

  const vocabRows = db
    .prepare(`SELECT kind, SUM(count) as total FROM vocabulary_matches GROUP BY kind`)
    .all() as unknown as Array<{ kind: string; total: number }>;
  const vocabularyTotals: VocabularyTotals = { strong: 0, weak: 0 };
  for (const row of vocabRows) {
    if (row.kind === "strong") vocabularyTotals.strong = row.total;
    else if (row.kind === "weak") vocabularyTotals.weak = row.total;
  }

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  return {
    totalSessions: sessionRows.length,
    totalPracticeSec: sessionRows.reduce((sum, r) => sum + r.duration_sec, 0),
    averageScore: average(scores),
    currentStreakDays: currentStreakDays(sessionRows.map((r) => r.created_at)),
    sessionsLast7Days: sessionRows.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo).length,
    sessionsLast30Days: sessionRows.filter((r) => new Date(r.created_at).getTime() >= thirtyDaysAgo).length,
    bestPillar,
    toughestPillar,
    scoreDelta: scoreDelta(scores),
    scoreTrend,
    pillarTrends,
    fillerRateTrend,
    paceTrend,
    eyeContactTrend,
    topFillerWords,
    vocabularyTotals,
  };
}
