// Lazy loading utility for WaveSurfer
// This prevents the heavy wavesurfer.js library from loading until needed

import type WaveSurfer from 'wavesurfer.js';

let waveSurferModule: typeof import('wavesurfer.js') | null = null;
let loadingPromise: Promise<typeof import('wavesurfer.js')> | null = null;

/**
 * Lazy load the WaveSurfer module only when needed
 * This prevents the audio visualization library from loading upfront
 */
export async function loadWaveSurferModule(): Promise<typeof import('wavesurfer.js')> {
  if (waveSurferModule) {
    return waveSurferModule;
  }
  
  if (loadingPromise) {
    return loadingPromise;
  }
  
  console.log('🌊 Lazy loading WaveSurfer module...');
  
  loadingPromise = import('wavesurfer.js').then((module) => {
    waveSurferModule = module;
    console.log('✅ WaveSurfer module loaded successfully');
    return module;
  }).catch((error) => {
    console.error('❌ Failed to load WaveSurfer module:', error);
    loadingPromise = null; // Reset so we can try again
    throw error;
  });
  
  return loadingPromise;
}

/**
 * Create a WaveSurfer instance with lazy loading
 */
export async function createWaveSurfer(options: Parameters<typeof WaveSurfer.create>[0]): Promise<WaveSurfer> {
  const WaveSurferModule = await loadWaveSurferModule();
  return WaveSurferModule.default.create(options);
}

/**
 * Check if WaveSurfer module is already loaded
 */
export function isWaveSurferLoaded(): boolean {
  return waveSurferModule !== null;
}

/**
 * Preload WaveSurfer module in the background (optional)
 */
export function preloadWaveSurfer(): void {
  if (!waveSurferModule && !loadingPromise) {
    loadWaveSurferModule().catch(() => {
      // Silently fail preload
    });
  }
}
