import { createOpenAiClient } from "./client";
import { TRANSCRIPTION_MODEL } from "@/lib/config/models";
import type { Transcript } from "@/lib/types";

interface WhisperVerboseWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperVerboseJsonResponse {
  text: string;
  words?: WhisperVerboseWord[];
}

/**
 * Transcribes the recorded answer via OpenAI's Whisper endpoint with
 * word-level timestamps. The recorded webm blob (video+audio) is sent as-is
 * — the endpoint only needs the audio track. Source spec §4 step 2.
 */
export async function transcribeRecording(
  apiKey: string,
  recordingBlob: Blob
): Promise<Transcript> {
  const client = createOpenAiClient(apiKey);
  const file = new File([recordingBlob], "answer.webm", {
    type: recordingBlob.type || "video/webm",
  });

  const response = (await client.audio.transcriptions.create({
    file,
    model: TRANSCRIPTION_MODEL,
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  })) as WhisperVerboseJsonResponse;

  return {
    text: response.text,
    words: (response.words ?? []).map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    })),
  };
}
