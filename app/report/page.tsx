"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/storage/db";
import { PillarCard } from "@/components/scorecard/PillarCard";
import { TopWorkedList, TopFixesList } from "@/components/scorecard/TopList";
import { AnnotatedTranscript } from "@/components/scorecard/AnnotatedTranscript";
import type { Session } from "@/lib/types";

const BAND_STYLES: Record<Session["scorecard"]["overallBand"], string> = {
  Strong: "text-emerald-600 dark:text-emerald-400",
  "Solid, with gaps": "text-amber-600 dark:text-amber-400",
  "Needs work": "text-red-600 dark:text-red-400",
};

function ReportPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getSession(id).then((s) => {
      if (!cancelled) setSession(s ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Derived during render; the effect below only revokes the previous
  // object URL on cleanup, it never calls setState.
  const videoUrl = useMemo(
    () => (session?.videoBlob ? URL.createObjectURL(session.videoBlob) : null),
    [session]
  );
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  if (!id || session === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-700 dark:text-zinc-300">Session not found.</p>
        <Link href="/history" className="mt-4 inline-block text-sm font-medium underline">
          Back to history
        </Link>
      </div>
    );
  }

  if (session === undefined) {
    return null;
  }

  const { scorecard } = session;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
      <div>
        <p className={`text-sm font-semibold ${BAND_STYLES[scorecard.overallBand]}`}>
          {scorecard.overallBand}
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {scorecard.overallScore}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-500">/ 100</span>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {scorecard.question}
        </p>
      </div>

      {videoUrl && (
        <video src={videoUrl} controls className="w-full rounded-xl bg-black" />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {scorecard.pillars.map((pillar) => (
          <PillarCard key={pillar.name} pillar={pillar} />
        ))}
      </div>

      <TopWorkedList items={scorecard.topWorked} />
      <TopFixesList items={scorecard.topFixes} />
      <AnnotatedTranscript segments={scorecard.annotatedTranscript} />
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportPageContent />
    </Suspense>
  );
}
