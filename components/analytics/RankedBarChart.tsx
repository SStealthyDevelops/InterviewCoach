"use client";

import { useState } from "react";
import { ChartEmptyState } from "./ChartCard";

interface RankedBarChartProps {
  items: { label: string; value: number }[];
  color?: string;
  height?: number;
}

const WIDTH = 640;
const PAD = { top: 4, right: 40, bottom: 4, left: 96 };
const BAR_HEIGHT = 20;
const BAR_GAP = 8;

export function RankedBarChart({ items, color = "var(--chart-series-1)", height }: RankedBarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return <ChartEmptyState height={height ?? 120} />;
  }

  const rowHeight = BAR_HEIGHT + BAR_GAP;
  const svgHeight = height ?? items.length * rowHeight + PAD.top + PAD.bottom;
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  function widthFor(value: number): number {
    return (value / maxValue) * plotWidth;
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${svgHeight}`} className="w-full" role="img">
      {items.map((item, i) => {
        const y = PAD.top + i * rowHeight;
        const barWidth = Math.max(2, widthFor(item.value));
        const hovered = hoverIndex === i;
        return (
          <g
            key={item.label}
            onPointerEnter={() => setHoverIndex(i)}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <text
              x={PAD.left - 10}
              y={y + BAR_HEIGHT / 2}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-zinc-600 dark:fill-zinc-400"
              fontSize={12}
            >
              {item.label}
            </text>
            <rect
              x={PAD.left}
              y={y}
              width={plotWidth}
              height={BAR_HEIGHT}
              fill="transparent"
            />
            <rect
              x={PAD.left}
              y={y}
              width={barWidth}
              height={BAR_HEIGHT}
              rx={4}
              fill={color}
              opacity={hovered ? 1 : 0.85}
            />
            <text
              x={PAD.left + barWidth + 8}
              y={y + BAR_HEIGHT / 2}
              dominantBaseline="middle"
              className="fill-zinc-900 dark:fill-zinc-100"
              fontSize={12}
              fontWeight={600}
            >
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
