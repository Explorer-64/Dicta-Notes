// Simple Cache Storage helper for Safari-compatible audio blobs (mp3)
// Keyed by a stable string; values are stored as Response with proper headers

const CACHE_NAME = 'audio-compat-v1';

function hasCache(): boolean {
  try {
    return typeof caches !== 'undefined' && !!caches;
  } catch {
    return false;
  }
}

export async function putCompatBlob(cacheKey: string, blob: Blob): Promise<void> {
  try {
    if (!hasCache()) return; // No-op if Cache Storage not supported
    const cache = await caches.open(CACHE_NAME);
    const req = new Request(cacheKey);
    const res = new Response(blob, { headers: { 'Content-Type': blob.type || 'application/octet-stream' } });
    await cache.put(req, res);
  } catch (e) {
    console.warn('AudioCompatCache.put failed', e);
  }
}

export async function getCompatBlob(cacheKey: string): Promise<Blob | null> {
  try {
    if (!hasCache()) return null;
    const cache = await caches.open(CACHE_NAME);
    const req = new Request(cacheKey);
    const match = await cache.match(req);
    if (!match) return null;
    return await match.blob();
  } catch (e) {
    console.warn('AudioCompatCache.get failed', e);
    return null;
  }
}

export async function hashBlobSHA256(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
