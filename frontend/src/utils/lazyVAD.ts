// Lazy loading utility for VAD (Voice Activity Detection)
// This prevents the heavy @ricky0123/vad-web library from loading until needed

import type { MicVAD } from '@ricky0123/vad-web';

let vadModule: typeof import('@ricky0123/vad-web') | null = null;
let loadingPromise: Promise<typeof import('@ricky0123/vad-web')> | null = null;

/**
 * Lazy load the VAD module only when needed
 * This prevents the 15-20MB VAD library from loading upfront
 */
export async function loadVADModule(): Promise<typeof import('@ricky0123/vad-web')> {
  if (vadModule) {
    return vadModule;
  }
  
  if (loadingPromise) {
    return loadingPromise;
  }
  
  console.log('🎤 Lazy loading VAD module...');
  
  loadingPromise = import('@ricky0123/vad-web').then((module) => {
    vadModule = module;
    console.log('✅ VAD module loaded successfully');
    return module;
  }).catch((error) => {
    console.error('❌ Failed to load VAD module:', error);
    loadingPromise = null; // Reset so we can try again
    throw error;
  });
  
  return loadingPromise;
}

/**
 * Create a MicVAD instance with lazy loading
 */
export async function createMicVAD(options: Parameters<typeof MicVAD.new>[0]): Promise<MicVAD> {
  const { MicVAD } = await loadVADModule();
  return await MicVAD.new(options);
}

/**
 * Check if VAD module is already loaded
 */
export function isVADLoaded(): boolean {
  return vadModule !== null;
}

/**
 * Preload VAD module in the background (optional)
 */
export function preloadVAD(): void {
  if (!vadModule && !loadingPromise) {
    loadVADModule().catch(() => {
      // Silently fail preload
    });
  }
}
