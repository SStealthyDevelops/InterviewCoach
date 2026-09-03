// Pure, DB-free analytics math — kept separate from lib/db/analyticsRepo.ts
// so it's unit-testable without touching SQLite.

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Consecutive-day practice streak ending today or yesterday (a day isn't
 * "missed" until it has fully elapsed with no session).
 */
export function currentStreakDays(createdAtIso: string[], now: Date = new Date()): number {
  const days = new Set(createdAtIso.map((iso) => dayKey(new Date(iso))));

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface ScoreDelta {
  earlierAvg: number;
  recentAvg: number;
  deltaPct: number;
}

/** Compares the average of the earlier half of a time-ascending series against the recent half. */
export function scoreDelta(scoresByTimeAsc: number[]): ScoreDelta | null {
  if (scoresByTimeAsc.length < 4) return null;

  const mid = Math.floor(scoresByTimeAsc.length / 2);
  const earlierAvg = average(scoresByTimeAsc.slice(0, mid))!;
  const recentAvg = average(scoresByTimeAsc.slice(mid))!;
  const deltaPct = earlierAvg === 0 ? 0 : ((recentAvg - earlierAvg) / earlierAvg) * 100;

  return { earlierAvg, recentAvg, deltaPct };
}
