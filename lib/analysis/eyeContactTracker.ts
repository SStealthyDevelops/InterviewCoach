import { EyeContactAggregator } from "./eyeContactAggregator";
import type { EyeContactStats } from "@/lib/types";

// Pinned to the installed @mediapipe/tasks-vision version so the WASM
// runtime matches the JS bindings bundled by this app.
const WASM_FILESET_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const SAMPLE_INTERVAL_MS = 400;
// Head yaw beyond this angle (degrees) counts as "not facing the camera".
// Note this is HEAD ORIENTATION, not gaze/iris direction: shifting only
// your eyes while keeping your head turned toward the camera will still
// read as "facing camera". True gaze tracking is out of scope for the
// local, on-device approach the product spec calls for (see spec §5.4) -
// this is the same head-pose proxy that spec explicitly chose over
// frame-sampled vision-model gaze estimation, for cost/latency reasons.
const FACING_YAW_THRESHOLD_DEG = 20;

// MediaPipe's WASM runtime logs routine backend initialization info (e.g.
// "Created TensorFlow Lite XNNPACK delegate for CPU") through console.error
// rather than console.info. It isn't a failure - it's printed once per
// model load - but Next's dev overlay treats any console.error as a crash.
// Filter just this known-benign pattern so it doesn't get reported as one.
const BENIGN_LOG_PATTERNS = [/xnnpack delegate/i, /created tensorflow lite/i];

async function withFilteredConsoleError<T>(fn: () => Promise<T>): Promise<T> {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const text = args.map(String).join(" ");
    if (BENIGN_LOG_PATTERNS.some((pattern) => pattern.test(text))) return;
    originalError(...args);
  };
  try {
    return await fn();
  } finally {
    console.error = originalError;
  }
}

/**
 * Runs on-device face-landmark detection (MediaPipe FaceLandmarker, WASM)
 * against a live video element to estimate eye contact, entirely locally —
 * raw video is never sent anywhere for this check (source spec §5.4).
 *
 * Not unit tested: it depends on a real camera feed, WebGL/WASM, and a
 * downloaded ML model, none of which are meaningfully fakeable in a unit
 * test. The stat-accumulation logic it delegates to (EyeContactAggregator)
 * is unit tested on its own. Verify this module manually per the README's
 * manual test checklist.
 */
export class EyeContactTracker {
  private aggregator = new EyeContactAggregator();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private faceLandmarker: FaceLandmarkerLike | null = null;
  private available = false;
  // Set as soon as stop() is called, even if start() is still awaiting the
  // model download - without this, start() resolving after stop() would
  // schedule an interval that never gets cleared (a leak that runs
  // indefinitely against a stopped video stream).
  private stopped = false;
  private lastSampledVideoTime = -1;

  async start(video: HTMLVideoElement): Promise<void> {
    try {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      await withFilteredConsoleError(async () => {
        const fileset = await FilesetResolver.forVisionTasks(WASM_FILESET_URL);
        this.faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL_URL,
            delegate: "GPU",
          },
          outputFacialTransformationMatrixes: true,
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1,
        });
      });
      this.available = true;
    } catch (error) {
      console.warn("Eye-contact tracking unavailable (face model failed to load):", error);
      this.available = false;
      return;
    }

    if (this.stopped) {
      // stop() already ran while we were still loading the model above -
      // tear straight back down instead of starting to sample.
      this.faceLandmarker?.close?.();
      this.faceLandmarker = null;
      return;
    }

    this.intervalId = setInterval(() => this.sample(video), SAMPLE_INTERVAL_MS);
  }

  private sample(video: HTMLVideoElement): void {
    if (!this.faceLandmarker || video.readyState < video.HAVE_CURRENT_DATA) return;

    // MediaPipe's VIDEO mode requires a strictly increasing timestamp per
    // call and can throw if the same decoded frame is processed twice (the
    // 400ms interval can occasionally fire before a new frame has
    // decoded). Skip re-processing a frame we've already sampled.
    if (video.currentTime === this.lastSampledVideoTime) return;
    this.lastSampledVideoTime = video.currentTime;

    try {
      const result = this.faceLandmarker.detectForVideo(video, performance.now());
      const yaw = extractYawDegrees(result);
      const facingCamera = yaw !== null && Math.abs(yaw) <= FACING_YAW_THRESHOLD_DEG;
      this.aggregator.addSample(facingCamera, performance.now() / 1000);
    } catch (error) {
      // A single bad frame shouldn't take down tracking for the rest of
      // the recording - log it and keep sampling on the next tick.
      console.warn("Eye-contact tracking: skipped a frame after an error:", error);
    }
  }

  stop(): EyeContactStats {
    this.stopped = true;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.faceLandmarker?.close?.();
    this.faceLandmarker = null;

    if (!this.available) {
      return { facingCameraPct: -1, longestLookAwayStreakSec: 0, trend: "unavailable" };
    }
    return this.aggregator.getStats();
  }
}

// Minimal shape of the parts of MediaPipe's FaceLandmarker/result we use,
// so this file doesn't need `@mediapipe/tasks-vision`'s types at module
// scope (it's imported dynamically above, browser-only).
interface FaceLandmarkerLike {
  detectForVideo: (video: HTMLVideoElement, timestampMs: number) => FaceLandmarkerResultLike;
  close?: () => void;
}
interface FaceLandmarkerResultLike {
  facialTransformationMatrixes?: { data: number[] }[];
}

function extractYawDegrees(result: FaceLandmarkerResultLike): number | null {
  const matrix = result.facialTransformationMatrixes?.[0]?.data;
  if (!matrix || matrix.length < 16) return null;

  // Column-major 4x4 transformation matrix (MediaPipe's documented
  // right-handed OpenGL convention for facialTransformationMatrixes): yaw
  // (rotation around Y) is recovered from the [0][2] / [2][2] components,
  // i.e. data[8] and data[10] in a flattened column-major array.
  const m02 = matrix[8];
  const m22 = matrix[10];
  const yawRad = Math.atan2(m02, m22);
  return (yawRad * 180) / Math.PI;
}
