import OpenAI from "openai";

/**
 * Creates a browser-side OpenAI client using the user's own key. There is
 * no server in this app (static export, source spec §1) — every call goes
 * straight from the browser to OpenAI under the user's key, which is why
 * dangerouslyAllowBrowser is intentional here, not a mistake.
 */
export function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}
