import { TranscriptSegment } from "utils/types";

// Utility for persisting browser transcription segments to localStorage
// Keys follow: dicta_browser_segments_<sessionId> or fallback to dicta_browser_segments_current

const KEY_PREFIX = "dicta_browser_segments_";

function getKey(sessionId?: string | null): string {
  return `${KEY_PREFIX}${sessionId && sessionId.trim().length > 0 ? sessionId : "current"}`;
}

function toPersisted(segments: TranscriptSegment[]) {
  // Convert Date -> ISO string safely
  return segments.map((s) => ({
    ...s,
    timestamp: s.timestamp instanceof Date ? s.timestamp.toISOString() : new Date(s.timestamp as unknown as string).toISOString(),
  }));
}

function fromPersisted(raw: any): TranscriptSegment[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => ({
    ...s,
    // Ensure Date object
    timestamp: new Date(s.timestamp),
  })) as TranscriptSegment[];
}

export function saveBrowserSegments(sessionId: string | null | undefined, segments: TranscriptSegment[]): void {
  try {
    const key = getKey(sessionId);
    const data = JSON.stringify(toPersisted(segments));
    localStorage.setItem(key, data);
  } catch (err) {
    console.warn("browserTranscriptStorage.save failed:", err);
  }
}

export function loadBrowserSegments(sessionId: string | null | undefined): TranscriptSegment[] {
  try {
    const key = getKey(sessionId);
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return fromPersisted(parsed);
  } catch (err) {
    console.warn("browserTranscriptStorage.load failed:", err);
    return [];
  }
}

export function clearBrowserSegments(sessionId: string | null | undefined): void {
  try {
    const key = getKey(sessionId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn("browserTranscriptStorage.clear failed:", err);
  }
}
