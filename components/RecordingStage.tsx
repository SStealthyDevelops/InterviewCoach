"use client";

import { useEffect, useRef, useState } from "react";
import { Countdown } from "./Countdown";
import { CostEstimateBanner } from "./CostEstimateBanner";
import { EyeContactTracker } from "@/lib/analysis/eyeContactTracker";
import { RECORDING_CAP_SEC, RECORDING_WARNING_SEC } from "@/lib/config/models";
import type { EyeContactStats } from "@/lib/types";

export interface RecordedAnswer {
  blob: Blob;
  durationSec: number;
  eyeContactStats: EyeContactStats;
  saveVideo: boolean;
}

// Recordings shorter than this are too short to produce a meaningful
// transcript/analysis (and can trip up the transcription API outright).
const MIN_RECORDING_SEC = 2;

const CANDIDATE_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return undefined;
  }
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

type Stage = "requesting" | "denied" | "ready" | "countdown" | "recording" | "unsupported";

export function RecordingStage({
  initialSaveVideo,
  onRecorded,
}: {
  initialSaveVideo: boolean;
  onRecorded: (answer: RecordedAnswer) => void;
}) {
  const [stage, setStage] = useState<Stage>("requesting");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [permissionError, setPermissionError] = useState("");
  const [recorderError, setRecorderError] = useState("");
  const [tooShortWarning, setTooShortWarning] = useState("");
  const [saveVideo, setSaveVideo] = useState(initialSaveVideo);
  const saveVideoRef = useRef(initialSaveVideo);
  saveVideoRef.current = saveVideo;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const eyeTrackerRef = useRef<EyeContactTracker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Request camera/mic on mount, release on unmount.
  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStage("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setPermissionError(
            "Camera and microphone access was denied. Allow access in your browser's site settings and reload this page to practice."
          );
          setStage("denied");
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleStartClick() {
    setStage("countdown");
  }

  async function handleCountdownComplete() {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;

    let recorder: MediaRecorder;
    try {
      const mimeType = pickSupportedMimeType();
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (error) {
      console.warn("MediaRecorder is not supported in this browser:", error);
      setRecorderError(
        "This browser can't record video. Try the latest Chrome, Firefox, or Edge."
      );
      setStage("unsupported");
      return;
    }

    setTooShortWarning("");
    setStage("recording");
    setElapsedSec(0);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorderRef.current = recorder;
    recorder.start();

    const tracker = new EyeContactTracker();
    eyeTrackerRef.current = tracker;
    void tracker.start(video);

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSec(elapsed);
      if (elapsed >= RECORDING_CAP_SEC) {
        stopRecording();
      }
    }, 250);
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recorder = recorderRef.current;
    if (!recorder) return;

    const durationSec = (Date.now() - startTimeRef.current) / 1000;

    recorder.onstop = () => {
      const eyeContactStats =
        eyeTrackerRef.current?.stop() ?? {
          facingCameraPct: -1,
          longestLookAwayStreakSec: 0,
          trend: "unavailable" as const,
        };

      if (durationSec < MIN_RECORDING_SEC) {
        // Too short to produce a meaningful transcript - let them try
        // again rather than sending a near-empty clip through the whole
        // pipeline (and the camera/mic stream is still live, so no need
        // to re-request permission).
        setTooShortWarning(
          `That recording was too short (under ${MIN_RECORDING_SEC}s). Try answering with at least a sentence or two.`
        );
        setStage("ready");
        return;
      }

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onRecorded({ blob, durationSec, eyeContactStats, saveVideo: saveVideoRef.current });
    };
    recorder.stop();
  }

  const remainingSec = Math.max(0, RECORDING_CAP_SEC - elapsedSec);
  const showWarning = stage === "recording" && elapsedSec >= RECORDING_WARNING_SEC;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        {stage === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Countdown onComplete={handleCountdownComplete} />
          </div>
        )}
        {stage === "recording" && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            {formatDuration(elapsedSec)} / {formatDuration(RECORDING_CAP_SEC)}
          </div>
        )}
      </div>

      {stage === "denied" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {permissionError}
        </p>
      )}

      {stage === "unsupported" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {recorderError}
        </p>
      )}

      {stage === "ready" && (
        <div className="w-full space-y-4">
          {tooShortWarning && (
            <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {tooShortWarning}
            </p>
          )}
          <CostEstimateBanner />
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={saveVideo}
              onChange={(e) => setSaveVideo(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
            />
            Save the video recording locally (otherwise only the transcript and scores
            are kept)
          </label>
          <button
            type="button"
            onClick={handleStartClick}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Start Recording
          </button>
        </div>
      )}

      {stage === "recording" && (
        <div className="w-full space-y-3">
          {showWarning && (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {remainingSec}s left before the recording auto-stops.
            </p>
          )}
          <button
            type="button"
            onClick={stopRecording}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Stop Recording
          </button>
        </div>
      )}
    </div>
  );
}

function formatDuration(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
