// Persist and retrieve the current in-browser transcription session id
// We use sessionStorage so it survives navigation within the same tab

const KEY = "dicta_browser_session_id";

export function getCurrentBrowserSessionId(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch (e) {
    console.warn("getCurrentBrowserSessionId failed:", e);
    return null;
  }
}

export function setCurrentBrowserSessionId(id: string): void {
  try {
    sessionStorage.setItem(KEY, id);
  } catch (e) {
    console.warn("setCurrentBrowserSessionId failed:", e);
  }
}

export function clearCurrentBrowserSessionId(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch (e) {
    console.warn("clearCurrentBrowserSessionId failed:", e);
  }
}
