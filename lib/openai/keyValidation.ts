import { createOpenAiClient } from "./client";

export type KeyValidationResult =
  | { valid: true }
  | { valid: false; reason: "invalid" | "rate-limited" | "network" | "unknown"; message: string };

/**
 * Validates an OpenAI API key with a trivial, cheap call (listing models)
 * during first-run setup, so the user finds out immediately if the key is
 * wrong rather than after recording an answer. Source spec §4 step 1, §12.
 */
export async function validateApiKey(apiKey: string): Promise<KeyValidationResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, reason: "invalid", message: "Enter an API key." };
  }

  const client = createOpenAiClient(apiKey.trim());

  try {
    await client.models.list();
    return { valid: true };
  } catch (error) {
    return { valid: false, ...describeError(error) };
  }
}

type ErrorReason = Exclude<KeyValidationResult, { valid: true }>["reason"];

function describeError(error: unknown): { reason: ErrorReason; message: string } {
  const status = (error as { status?: number } | undefined)?.status;

  if (status === 401) {
    return { reason: "invalid", message: "That API key was rejected by OpenAI. Double-check it and try again." };
  }
  if (status === 429) {
    return { reason: "rate-limited", message: "OpenAI rate-limited this request. Wait a moment and try again." };
  }
  if (status === undefined) {
    return { reason: "network", message: "Couldn't reach OpenAI. Check your internet connection and try again." };
  }
  return { reason: "unknown", message: `OpenAI returned an unexpected error (status ${status}).` };
}
