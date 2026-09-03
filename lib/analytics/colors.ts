import { PILLAR_ORDER } from "@/lib/analytics/types";

// Fixed identity->hue mapping (never assigned by rank) — see app/globals.css
// for the light/dark values behind each token.
const SERIES_TOKENS = [
  "var(--chart-series-1)",
  "var(--chart-series-2)",
  "var(--chart-series-3)",
  "var(--chart-series-4)",
  "var(--chart-series-5)",
] as const;

const PILLAR_COLOR: Record<string, string> = Object.fromEntries(
  PILLAR_ORDER.map((name, i) => [name, SERIES_TOKENS[i % SERIES_TOKENS.length]])
);

export function colorForPillar(pillarName: string, fallbackIndex = 0): string {
  return PILLAR_COLOR[pillarName] ?? SERIES_TOKENS[fallbackIndex % SERIES_TOKENS.length];
}

export const CHART_SERIES_DEFAULT = "var(--chart-series-1)";
export const CHART_GOOD = "var(--chart-good)";
export const CHART_WARN = "var(--chart-warn)";
export const CHART_BAD = "var(--chart-bad)";
