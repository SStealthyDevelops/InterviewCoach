"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAnalyticsSummary } from "@/lib/analytics/client";
import { colorForPillar } from "@/lib/analytics/colors";
import type { AnalyticsSummary, TrendPoint } from "@/lib/analytics/types";
import { ChartCard } from "@/components/analytics/ChartCard";
import { LineTrendChart, type TrendSeries } from "@/components/analytics/LineTrendChart";
import { RankedBarChart } from "@/components/analytics/RankedBarChart";
import { StatTile } from "@/components/analytics/StatTile";

function formatDuration(totalSec: number): string {
  const totalMin = Math.round(totalSec / 60);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function toSeries(id: string, label: string, color: string, points: TrendPoint[]): TrendSeries {
  return { id, label, color, points: points.map((p) => ({ createdAt: p.createdAt, value: p.value })) };
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalyticsSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your analytics right now.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-700 dark:text-zinc-300">{error}</p>
      </div>
    );
  }

  if (summary === null) {
    return null;
  }

  if (summary.totalSessions === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-700 dark:text-zinc-300">
          No practice sessions yet — analytics will show up here once you have a few.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium underline">
          Practice a question
        </Link>
      </div>
    );
  }

  const scoreDeltaTile = summary.scoreDelta
    ? {
        text: `${summary.scoreDelta.deltaPct >= 0 ? "+" : ""}${summary.scoreDelta.deltaPct.toFixed(0)}% vs earlier sessions`,
        positive: summary.scoreDelta.deltaPct >= 0,
      }
    : null;

  const vocabTotal = summary.vocabularyTotals.strong + summary.vocabularyTotals.weak;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Long-term trends across every practice session, stored locally.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Sessions practiced" value={`${summary.totalSessions}`} />
        <StatTile label="Total practice time" value={formatDuration(summary.totalPracticeSec)} />
        <StatTile
          label="Average score"
          value={summary.averageScore !== null ? `${Math.round(summary.averageScore)}` : "—"}
          delta={scoreDeltaTile}
        />
        <StatTile
          label="Current streak"
          value={`${summary.currentStreakDays} day${summary.currentStreakDays === 1 ? "" : "s"}`}
        />
      </div>

      <ChartCard
        title="Overall score over time"
        subtitle="Each point is one practice session, most recent on the right."
      >
        <LineTrendChart
          series={[toSeries("score", "Overall score", "var(--chart-series-1)", summary.scoreTrend)]}
          yDomain={[0, 100]}
        />
      </ChartCard>

      <ChartCard
        title="Score by pillar"
        subtitle={
          summary.bestPillar && summary.toughestPillar
            ? `Strongest: ${summary.bestPillar.name} (${Math.round(summary.bestPillar.average)}) · Focus area: ${summary.toughestPillar.name} (${Math.round(summary.toughestPillar.average)})`
            : undefined
        }
      >
        <LineTrendChart
          series={summary.pillarTrends.map((t, i) =>
            toSeries(t.pillar, t.pillar, colorForPillar(t.pillar, i), t.points)
          )}
          yDomain={[0, 100]}
        />
      </ChartCard>

      <div className="grid gap-6 sm:grid-cols-2">
        <ChartCard title="Speaking pace" subtitle="Words per minute per session.">
          <LineTrendChart
            series={[toSeries("pace", "WPM", "var(--chart-series-1)", summary.paceTrend)]}
            band={{ min: 110, max: 160, label: "target range" }}
          />
        </ChartCard>

        <ChartCard title="Filler words" subtitle="Filler words used per minute.">
          <LineTrendChart
            series={[
              toSeries("filler-rate", "Fillers/min", "var(--chart-series-1)", summary.fillerRateTrend),
            ]}
          />
        </ChartCard>
      </div>

      <ChartCard title="Eye contact" subtitle="Percent of time facing the camera per session.">
        <LineTrendChart
          series={[
            toSeries("eye-contact", "Facing camera", "var(--chart-series-1)", summary.eyeContactTrend),
          ]}
          yDomain={[0, 100]}
        />
      </ChartCard>

      <div className="grid gap-6 sm:grid-cols-2">
        <ChartCard title="Most common filler words" subtitle="Totals across every session.">
          <RankedBarChart items={summary.topFillerWords.map((f) => ({ label: f.word, value: f.count }))} />
        </ChartCard>

        <ChartCard title="Vocabulary habits" subtitle="Strong vs. weak phrasing, totals across every session.">
          {vocabTotal === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-600">
              Not enough sessions yet
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div
                  style={{ width: `${(summary.vocabularyTotals.strong / vocabTotal) * 100}%` }}
                  className="bg-emerald-500"
                />
                <div
                  style={{ width: `${(summary.vocabularyTotals.weak / vocabTotal) * 100}%` }}
                  className="bg-amber-500"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {summary.vocabularyTotals.strong} strong
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  {summary.vocabularyTotals.weak} weak
                </span>
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
