"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RecordingStage, type RecordedAnswer } from "@/components/RecordingStage";
import { ProcessingSteps, type ProcessingStepState } from "@/components/ProcessingSteps";
import { QUESTION_BANK } from "@/lib/data/questionBank";
import { getStoredApiKey, getSaveVideoByDefault } from "@/lib/storage/settings";
import { transcribeRecording } from "@/lib/openai/transcribe";
import { analyzeAnswer } from "@/lib/openai/analyze";
import { detectFillerWords } from "@/lib/analysis/fillerWordDetector";
import { calculatePace } from "@/lib/analysis/paceCalculator";
import { scanVocabulary } from "@/lib/analysis/vocabularyWordList";
import { composeScorecard } from "@/lib/feedback/composeScorecard";
import { saveSession } from "@/lib/storage/db";
import type { Session } from "@/lib/types";

const STEP_LABELS = [
  "Transcribing your answer…",
  "Analyzing filler words & pace…",
  "Scanning vocabulary…",
  "Scoring your answer with AI…",
  "Saving your session…",
];

function initialSteps(): ProcessingStepState[] {
  return STEP_LABELS.map((label) => ({ label, status: "pending" }));
}

type Phase = "recording" | "processing" | "error";

function RecordPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("recording");
  const [steps, setSteps] = useState<ProcessingStepState[]>(initialSteps());
  const [errorMessage, setErrorMessage] = useState("");

  const recordedRef = useRef<RecordedAnswer | null>(null);

  // Derived synchronously from the URL — no state/effect needed, and it
  // avoids a "loading" flash while resolving the question.
  const questionText = useMemo<string | null>(() => {
    const custom = searchParams.get("custom");
    if (custom && custom.trim().length > 0) return custom;

    const questionId = searchParams.get("questionId");
    const found = QUESTION_BANK.find((q) => q.id === questionId);
    return found ? found.text : null;
  }, [searchParams]);

  function setStepStatus(index: number, status: ProcessingStepState["status"]) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status } : s)));
  }

  function markActiveStepAsError() {
    setSteps((prev) =>
      prev.map((s) => (s.status === "active" ? { ...s, status: "error" } : s))
    );
  }

  async function runPipeline(answer: RecordedAnswer, question: string) {
    setPhase("processing");
    setSteps(initialSteps());
    setErrorMessage("");

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setErrorMessage("No OpenAI API key found. Please set one up in Settings.");
      setPhase("error");
      return;
    }

    try {
      setStepStatus(0, "active");
      const transcript = await transcribeRecording(apiKey, answer.blob);
      setStepStatus(0, "done");

      setStepStatus(1, "active");
      const fillerStats = detectFillerWords(transcript.words, answer.durationSec);
      const paceStats = calculatePace(transcript.words, answer.durationSec);
      setStepStatus(1, "done");

      setStepStatus(2, "active");
      const vocabularyStats = scanVocabulary(transcript.words);
      setStepStatus(2, "done");

      setStepStatus(3, "active");
      const aiAnalysis = await analyzeAnswer(apiKey, question, transcript.text, vocabularyStats);
      setStepStatus(3, "done");

      setStepStatus(4, "active");
      const scorecard = composeScorecard({
        question,
        transcript,
        fillerStats,
        paceStats,
        vocabularyStats,
        eyeContactStats: answer.eyeContactStats,
        aiAnalysis,
      });

      const session: Session = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        question: { text: question },
        durationSec: answer.durationSec,
        videoBlob: answer.saveVideo ? answer.blob : undefined,
        transcript,
        fillerStats,
        paceStats,
        vocabularyStats,
        eyeContactStats: answer.eyeContactStats,
        aiAnalysis,
        scorecard,
      };
      await saveSession(session);
      setStepStatus(4, "done");

      router.push(`/report?id=${session.id}`);
    } catch (error) {
      markActiveStepAsError();
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while processing your answer."
      );
      setPhase("error");
    }
  }

  function handleRecorded(answer: RecordedAnswer) {
    recordedRef.current = answer;
    if (questionText) {
      void runPipeline(answer, questionText);
    }
  }

  function handleRetry() {
    if (recordedRef.current && questionText) {
      void runPipeline(recordedRef.current, questionText);
    }
  }

  if (questionText === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-700 dark:text-zinc-300">No question was selected.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium underline">
          Pick a question
        </Link>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div className="flex flex-1 flex-col">
        <p className="mx-auto mt-6 max-w-2xl px-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {questionText}
        </p>
        <RecordingStage
          initialSaveVideo={getSaveVideoByDefault()}
          onRecorded={handleRecorded}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <ProcessingSteps steps={steps} />
      {phase === "error" && (
        <div className="w-full space-y-3 rounded-lg bg-red-50 p-4 text-center dark:bg-red-950">
          <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={null}>
      <RecordPageContent />
    </Suspense>
  );
}
