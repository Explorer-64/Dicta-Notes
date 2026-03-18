// Lightweight wrapper to load ffmpeg.wasm from a CDN and transcode audio to MP3
// We avoid adding npm deps by dynamically loading the UMD bundle from unpkg.
// API: ensureReady(); transcodeToMp3(blob, onProgress?) -> Promise<Blob>

let _isLoading = false;
let _isReady = false;
let _ffmpeg: any = null;

// CDN locations for the UMD bundle and core files
const FFMPEG_UMD_SRC = "https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js";
const FFMPEG_CORE_PATH = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already present, resolve
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
}

export async function ensureReady(): Promise<void> {
  if (_isReady) return;
  if (_isLoading) {
    // Wait until ready
    await new Promise<void>((res) => {
      const check = () => {
        if (_isReady) res(); else setTimeout(check, 50);
      };
      check();
    });
    return;
  }

  _isLoading = true;
  // Load UMD
  await loadScript(FFMPEG_UMD_SRC);
  const FFmpegNS: any = (window as any).FFmpeg;
  if (!FFmpegNS || !FFmpegNS.createFFmpeg || !FFmpegNS.fetchFile) {
    _isLoading = false;
    throw new Error("FFmpeg UMD not available on window.FFmpeg");
  }

  _ffmpeg = FFmpegNS.createFFmpeg({
    corePath: FFMPEG_CORE_PATH,
    log: false,
  });

  await _ffmpeg.load();
  _isReady = true;
  _isLoading = false;
}

export type ProgressCallback = (ratio: number) => void;

export async function transcodeToMp3(input: Blob, onProgress?: ProgressCallback): Promise<Blob> {
  await ensureReady();

  if (!_ffmpeg) throw new Error("FFmpeg not initialized");

  // Wire progress
  if (onProgress) {
    _ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
      try { onProgress(Math.max(0, Math.min(1, ratio || 0))); } catch {}
    });
  }

  // Write input file to FS
  const FFmpegNS: any = (window as any).FFmpeg;
  const data = await FFmpegNS.fetchFile(input);
  const inName = "input";
  const outName = "output.mp3";

  // Ensure clean FS
  try { _ffmpeg.FS('unlink', inName); } catch {}
  try { _ffmpeg.FS('unlink', outName); } catch {}

  _ffmpeg.FS('writeFile', inName, data);

  // Run conversion
  // -c:a libmp3lame is default for mp3 in ffmpeg.wasm builds; set bitrate modestly
  await _ffmpeg.run('-i', inName, '-vn', '-ar', '48000', '-ac', '2', '-b:a', '128k', outName);

  const outData = _ffmpeg.FS('readFile', outName);
  const blob = new Blob([outData.buffer], { type: 'audio/mpeg' });

  // Cleanup
  try { _ffmpeg.FS('unlink', inName); } catch {}
  try { _ffmpeg.FS('unlink', outName); } catch {}

  return blob;
}
