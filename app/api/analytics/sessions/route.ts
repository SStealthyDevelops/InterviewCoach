import { NextResponse } from "next/server";
import { deleteAllSessions, deleteSessionById, recordSession } from "@/lib/db/analyticsRepo";
import { sessionAnalyticsInputSchema, type SessionAnalyticsInput } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = sessionAnalyticsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid session payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    recordSession(parsed.data as unknown as SessionAnalyticsInput);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to record session analytics", error);
    return NextResponse.json({ error: "Failed to record session." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  try {
    if (id) {
      deleteSessionById(id);
    } else {
      deleteAllSessions();
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete session analytics", error);
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}
