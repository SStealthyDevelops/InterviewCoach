// Small localStorage-backed settings: the OpenAI API key and a couple of
// user preferences. This is the only place the key is stored — never sent
// anywhere except directly to OpenAI (source spec §9).
//
// Each setting exposes a subscribe function alongside its getter so
// components can read it via useSyncExternalStore — the correct way to
// read a client-only external source (localStorage isn't available during
// static prerendering) without the hydration-mismatch or effect-setState
// issues a plain useState+useEffect mount check would introduce.

const API_KEY_STORAGE_KEY = "interview-coach:openai-api-key";
const SAVE_VIDEO_STORAGE_KEY = "interview-coach:save-video-by-default";

type Listener = () => void;
const apiKeyListeners = new Set<Listener>();
const saveVideoListeners = new Set<Listener>();

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getStoredApiKey(): string | null {
  if (!hasLocalStorage()) return null;
  return window.localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setStoredApiKey(apiKey: string): void {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  apiKeyListeners.forEach((listener) => listener());
}

export function clearStoredApiKey(): void {
  if (!hasLocalStorage()) return;
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
  apiKeyListeners.forEach((listener) => listener());
}

export function subscribeStoredApiKey(listener: Listener): () => void {
  apiKeyListeners.add(listener);
  return () => apiKeyListeners.delete(listener);
}

export function getSaveVideoByDefault(): boolean {
  if (!hasLocalStorage()) return false;
  return window.localStorage.getItem(SAVE_VIDEO_STORAGE_KEY) === "true";
}

export function setSaveVideoByDefault(value: boolean): void {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(SAVE_VIDEO_STORAGE_KEY, String(value));
  saveVideoListeners.forEach((listener) => listener());
}

export function subscribeSaveVideoByDefault(listener: Listener): () => void {
  saveVideoListeners.add(listener);
  return () => saveVideoListeners.delete(listener);
}

export function clearAllSettings(): void {
  clearStoredApiKey();
  setSaveVideoByDefault(false);
}
