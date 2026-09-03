import type { Session } from "@/lib/types";
import type { AnalyticsSummary, SessionAnalyticsInput } from "@/lib/analytics/types";

/**
 * Fire-and-forget: the long-term analytics DB is a supplementary record, not
 * the source of truth for a session (IndexedDB is, via lib/storage/db.ts), so
 * a failure here must never block the user from seeing their report.
 */
export async function recordSessionAnalytics(session: Session): Promise<void> {
  const {
    id,
    createdAt,
    question,
    durationSec,
    transcript,
    fillerStats,
    paceStats,
    vocabularyStats,
    eyeContactStats,
    aiAnalysis,
    scorecard,
  } = session;
  const withoutVideo: SessionAnalyticsInput = {
    id,
    createdAt,
    question,
    durationSec,
    transcript,
    fillerStats,
    paceStats,
    vocabularyStats,
    eyeContactStats,
    aiAnalysis,
    scorecard,
  };
  try {
    await fetch("/api/analytics/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withoutVideo),
    });
  } catch (error) {
    console.error("Failed to record session analytics", error);
  }
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch("/api/analytics/summary");
  if (!res.ok) {
    throw new Error("Failed to load analytics summary.");
  }
  return res.json();
}

export async function deleteSessionAnalytics(id: string): Promise<void> {
  try {
    await fetch(`/api/analytics/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    console.error("Failed to delete session analytics", error);
  }
}

export async function deleteAllAnalytics(): Promise<void> {
  try {
    await fetch("/api/analytics/sessions", { method: "DELETE" });
  } catch (error) {
    console.error("Failed to delete all session analytics", error);
  }
}
