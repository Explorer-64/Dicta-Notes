/**
 * Storage utilities for Gemini Live API transcription segments
 */

import type { TranscriptionSegment } from './types';

// Storage keys for persistence
const STORAGE_KEY_SEGMENTS = 'dicta_gemini_segments';
const STORAGE_KEY_CURRENT = 'dicta_gemini_current_segment';

/**
 * Save segments to sessionStorage for persistence across navigation
 */
export function saveSegmentsToStorage(segments: TranscriptionSegment[], currentSegment: string): void {
  try {
    if (segments.length > 0 || currentSegment.trim()) {
      sessionStorage.setItem(STORAGE_KEY_SEGMENTS, JSON.stringify(segments));
      sessionStorage.setItem(STORAGE_KEY_CURRENT, currentSegment);
    }
  } catch (error) {
    console.error('Error saving Gemini segments to storage:', error);
  }
}

/**
 * Load segments from sessionStorage
 */
export function loadSegmentsFromStorage(): { segments: TranscriptionSegment[], currentSegment: string } {
  try {
    const savedSegments = sessionStorage.getItem(STORAGE_KEY_SEGMENTS);
    const savedCurrent = sessionStorage.getItem(STORAGE_KEY_CURRENT);
    
    return {
      segments: savedSegments ? JSON.parse(savedSegments) : [],
      currentSegment: savedCurrent || ''
    };
  } catch (error) {
    console.error('Error loading Gemini segments from storage:', error);
    return { segments: [], currentSegment: '' };
  }
}

/**
 * Clear segments from sessionStorage
 */
export function clearSegmentsFromStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_SEGMENTS);
    sessionStorage.removeItem(STORAGE_KEY_CURRENT);
  } catch (error) {
    console.error('Error clearing Gemini segments from storage:', error);
  }
}
