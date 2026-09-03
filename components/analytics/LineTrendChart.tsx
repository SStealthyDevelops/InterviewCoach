"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { niceTicks } from "./chartMath";
import { ChartEmptyState } from "./ChartCard";

export interface TrendSeries {
  id: string;
  label: string;
  color: string;
  points: { createdAt: string; value: number }[];
}

interface LineTrendChartProps {
  series: TrendSeries[];
  height?: number;
  yDomain?: [number, number];
  yFormat?: (value: number) => string;
  /** A shaded reference band (e.g. the "healthy" pace range) drawn behind the data. */
  band?: { min: number; max: number; label: string };
}

const WIDTH = 640;
// Right padding leaves room for a single-series end-value label (see
// showEndLabel below) so it doesn't clip against the SVG viewBox edge.
const PAD = { top: 16, right: 36, bottom: 24, left: 34 };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function LineTrendChart({
  series,
  height = 200,
  yDomain,
  yFormat = (v) => `${Math.round(v)}`,
  band,
}: LineTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const nonEmpty = series.filter((s) => s.points.length > 0);
  const pointCount = nonEmpty.reduce((max, s) => Math.max(max, s.points.length), 0);

  const allValues = nonEmpty.flatMap((s) => s.points.map((p) => p.value));
  const domain: [number, number] = yDomain ?? [
    allValues.length > 0 ? Math.min(...allValues) : 0,
    allValues.length > 0 ? Math.max(...allValues) : 1,
  ];
  const rawTicks = niceTicks(domain[0], domain[1], 4);
  const yMin = Math.min(domain[0], rawTicks[0]);
  const yMax = Math.max(domain[1], rawTicks[rawTicks.length - 1]);
  // A narrow value range (e.g. every session near the same WPM) can produce
  // a fractional step whose ticks round to the same displayed label — drop
  // those duplicates rather than showing "130 / 130 / 131 / 131".
  const ticks = rawTicks.filter((t, i) => i === 0 || yFormat(t) !== yFormat(rawTicks[i - 1]));

  if (pointCount === 0) {
    return <ChartEmptyState height={height} />;
  }

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = height - PAD.top - PAD.bottom;

  function xFor(index: number): number {
    if (pointCount <= 1) return PAD.left + plotWidth / 2;
    return PAD.left + (index / (pointCount - 1)) * plotWidth;
  }
  function yFor(value: number): number {
    if (yMax === yMin) return PAD.top + plotHeight / 2;
    return PAD.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const localX = (e.clientX - rect.left) * scaleX;
    const ratio = pointCount <= 1 ? 0 : (localX - PAD.left) / plotWidth;
    setHoverIndex(Math.min(pointCount - 1, Math.max(0, Math.round(ratio * (pointCount - 1)))));
  }

  const showLegend = nonEmpty.length > 1;
  const lastPoint = nonEmpty[0]?.points[nonEmpty[0].points.length - 1];
  const showEndLabel = nonEmpty.length === 1 && lastPoint;

  const hovered = hoverIndex !== null;
  const hoverX = hoverIndex !== null ? xFor(hoverIndex) : 0;
  const hoverEntries = hoverIndex !== null
    ? nonEmpty
        .map((s) => ({ series: s, point: s.points[hoverIndex] }))
        .filter((e): e is { series: TrendSeries; point: { createdAt: string; value: number } } => !!e.point)
    : [];
  const tooltipDate = hoverEntries[0]?.point.createdAt;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full touch-none"
        role="img"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {band && (
          <g>
            <rect
              x={PAD.left}
              y={yFor(Math.min(band.max, yMax))}
              width={plotWidth}
              height={Math.max(0, yFor(Math.max(band.min, yMin)) - yFor(Math.min(band.max, yMax)))}
              fill="var(--chart-good)"
              opacity={0.08}
            />
            <text
              x={WIDTH - PAD.right}
              y={yFor(Math.min(band.max, yMax)) - 4}
              textAnchor="end"
              className="fill-zinc-500 dark:fill-zinc-500"
              fontSize={9}
            >
              {band.label}
            </text>
          </g>
        )}

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={yFor(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-zinc-500 dark:fill-zinc-500"
              fontSize={10}
            >
              {yFormat(tick)}
            </text>
          </g>
        ))}

        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + plotHeight}
          y2={PAD.top + plotHeight}
          stroke="var(--chart-axis)"
          strokeWidth={1}
        />

        {nonEmpty[0] && (
          <>
            <text x={PAD.left} y={height - 6} textAnchor="start" className="fill-zinc-500" fontSize={10}>
              {formatDate(nonEmpty[0].points[0].createdAt)}
            </text>
            <text
              x={WIDTH - PAD.right}
              y={height - 6}
              textAnchor="end"
              className="fill-zinc-500"
              fontSize={10}
            >
              {formatDate(nonEmpty[0].points[nonEmpty[0].points.length - 1].createdAt)}
            </text>
          </>
        )}

        {hovered && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={PAD.top}
            y2={PAD.top + plotHeight}
            stroke="var(--chart-axis)"
            strokeWidth={1}
          />
        )}

        {nonEmpty.map((s) => {
          const path = s.points.map((p, i) => `${xFor(i)},${yFor(p.value)}`).join(" ");
          const last = s.points[s.points.length - 1];
          const lastIdx = s.points.length - 1;
          return (
            <g key={s.id}>
              {s.points.length > 1 ? (
                <polyline
                  points={path}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <circle cx={xFor(0)} cy={yFor(s.points[0].value)} r={4} fill={s.color} />
              )}
              {last && (
                <circle
                  cx={xFor(lastIdx)}
                  cy={yFor(last.value)}
                  r={4}
                  fill={s.color}
                  stroke="var(--chart-surface)"
                  strokeWidth={2}
                />
              )}
              {hovered && s.points[hoverIndex!] && (
                <circle
                  cx={xFor(hoverIndex!)}
                  cy={yFor(s.points[hoverIndex!].value)}
                  r={4}
                  fill={s.color}
                  stroke="var(--chart-surface)"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}

        {showEndLabel && lastPoint && (
          <text
            x={xFor(nonEmpty[0].points.length - 1) + 6}
            y={yFor(lastPoint.value)}
            dominantBaseline="middle"
            className="fill-zinc-600 dark:fill-zinc-400"
            fontSize={11}
            fontWeight={600}
          >
            {yFormat(lastPoint.value)}
          </text>
        )}
      </svg>

      {hovered && hoverEntries.length > 0 && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          style={{ left: `${(hoverX / WIDTH) * 100}%` }}
        >
          {tooltipDate && (
            <p className="mb-1 font-medium text-zinc-500 dark:text-zinc-400">{formatDate(tooltipDate)}</p>
          )}
          {hoverEntries.map(({ series: s, point }) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-3 shrink-0"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span className="text-zinc-500 dark:text-zinc-400">{s.label}</span>
              <span className="ml-auto font-semibold text-zinc-900 dark:text-zinc-100">
                {yFormat(point.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {nonEmpty.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="inline-block h-0.5 w-3" style={{ backgroundColor: s.color }} aria-hidden />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
