import { isSafariLike, needsSafariTranscode } from "utils/safari";
import { ensureReady, transcodeToMp3 } from "utils/TranscodeService";
import { getCompatBlob, putCompatBlob, hashBlobSHA256 } from "utils/AudioCompatCache";
import { auth, API_URL } from "app";

export interface ApplyFallbackOptions {
  sessionId: string;
  audioRef: HTMLAudioElement | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  contentType: string | null;
  sourceExt: string | null;
  onProgress?: (pct: number) => void;
  setConverting?: (v: boolean) => void;
  onSuccess?: (mp3Url: string) => void;
}

export async function applySafariMp3Fallback(opts: ApplyFallbackOptions): Promise<boolean> {
  const { sessionId, audioRef, audioBlob, audioUrl, contentType, sourceExt, onProgress, setConverting, onSuccess } = opts;

  try {
    if (!isSafariLike()) return false;

    const urlForDetect = audioUrl;
    const extFromKey = sourceExt;
    const needs = needsSafariTranscode(contentType, urlForDetect || (extFromKey ? `https://x/${sessionId}.${extFromKey}` : null));
    if (!needs) return false;

    // Obtain a source blob
    let srcBlob: Blob | null = audioBlob;
    if (!srcBlob && audioRef?.src) {
      try {
        const res = await fetch(audioRef.src);
        if (res.ok) srcBlob = await res.blob();
        else throw new Error(`Fetch failed: ${res.status}`);
      } catch (e) {
        console.warn('Direct fetch failed, trying backend proxy for Safari transcode', e);
        try {
          const token = await auth.getAuthToken();
          const res = await fetch(`${API_URL}/downloads/audio`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            credentials: 'include',
            body: JSON.stringify({ url: audioRef!.src }),
          });
          if (res.ok) srcBlob = await res.blob();
        } catch (proxyErr) {
          console.warn('Proxy fetch also failed, skipping Safari transcode', proxyErr);
          return false;
        }
      }
    }

    if (!srcBlob) return false;

    setConverting?.(true);
    onProgress?.(0);

    // Cache key is sessionId + hash of original
    const hash = await hashBlobSHA256(srcBlob);
    const cacheKey = `safari-mp3:${sessionId}:${hash}`;

    // Try cache
    const cached = await getCompatBlob(cacheKey);
    if (cached) {
      const mp3Url = URL.createObjectURL(cached);
      if (audioRef) audioRef.src = mp3Url;
      onSuccess?.(mp3Url);
      return true;
    }

    // Transcode
    await ensureReady();
    const mp3Blob = await transcodeToMp3(srcBlob, (r) => onProgress?.(Math.round((r || 0) * 100)));
    await putCompatBlob(cacheKey, mp3Blob);
    const mp3Url = URL.createObjectURL(mp3Blob);
    if (audioRef) audioRef.src = mp3Url;
    onSuccess?.(mp3Url);
    return true;
  } catch (e) {
    console.warn('Safari MP3 fallback failed:', e);
    return false;
  } finally {
    setConverting?.(false);
  }
}
