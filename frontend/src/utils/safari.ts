// Safari and iOS WebKit detection helpers

export function isSafariLike(): boolean {
  const ua = navigator.userAgent;
  const vendor = (navigator as any).vendor || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && /Apple Computer/.test(vendor) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS || isSafari;
}

export function needsSafariTranscode(contentType?: string | null, url?: string | null): boolean {
  // Safari does not support webm/opus or ogg in <audio>
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('webm') || ct.includes('ogg') || ct.includes('opus')) return true;
  if (url) {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      if (pathname.endsWith('.webm') || pathname.endsWith('.ogg') || pathname.endsWith('.opus')) return true;
    } catch {}
  }
  return false;
}
