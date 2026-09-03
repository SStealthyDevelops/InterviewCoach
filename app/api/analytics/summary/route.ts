import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/db/analyticsRepo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to load analytics summary", error);
    return NextResponse.json({ error: "Failed to load analytics summary." }, { status: 500 });
  }
}
