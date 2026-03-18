// Small helper to determine a sensible file extension for audio downloads
// Does not depend on any read-only modules

export function getFileExtensionFromContentTypeAndUrl(
  contentType?: string | null,
  audioUrl?: string | null,
  fallbackExt?: string | null,
): string {
  if (contentType) {
    const ct = contentType.toLowerCase();
    if (ct.includes("webm")) return "webm";
    if (ct.includes("wav")) return "wav";
    if (ct.includes("mpeg") || ct.includes("mp3")) return "mp3";
    if (ct.includes("ogg")) return "ogg";
    if (ct.includes("opus")) return "opus";
  }

  if (audioUrl && audioUrl.startsWith("http")) {
    try {
      const url = new URL(audioUrl);
      const path = url.pathname.toLowerCase();
      const m = path.match(/\.([a-z0-9]+)$/i);
      if (m) return m[1];
    } catch {}
  }

  if (fallbackExt) return fallbackExt;
  return "mp3";
}
