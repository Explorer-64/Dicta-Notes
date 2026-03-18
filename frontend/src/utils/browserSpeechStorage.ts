/**
 * Browser Speech Storage
 * Handles localStorage persistence for browser-based speech recognition (internal meetings)
 * Separate from Firestore storage used for Gemini Live shared meetings
 */

export interface BrowserSpeechSegment {
  id: string;
  text: string;
  speaker?: string;
  speakerName?: string;
  timestamp: number;
  confidence?: number;
  isFinal: boolean;
}

const STORAGE_PREFIX = 'browser_speech_';

/**
 * Save browser speech data to localStorage for a specific session
 */
export function saveBrowserSpeechData(sessionId: string, segments: BrowserSpeechSegment[]): void {
  try {
    const key = `${STORAGE_PREFIX}${sessionId}`;
    const data = {
      segments,
      lastUpdated: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Saved ${segments.length} browser speech segments for session ${sessionId}`);
  } catch (error) {
    console.error('Failed to save browser speech data:', error);
  }
}

/**
 * Load browser speech data from localStorage for a specific session
 */
export function loadBrowserSpeechData(sessionId: string): BrowserSpeechSegment[] {
  try {
    const key = `${STORAGE_PREFIX}${sessionId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      console.log(`📁 No browser speech data found for session ${sessionId}`);
      return [];
    }
    
    const data = JSON.parse(stored);
    const segments = data.segments || [];
    
    console.log(`📂 Loaded ${segments.length} browser speech segments for session ${sessionId}`);
    return segments;
  } catch (error) {
    console.error('Failed to load browser speech data:', error);
    return [];
  }
}

/**
 * Clear browser speech data for a specific session
 */
export function clearBrowserSpeechData(sessionId: string): void {
  try {
    const key = `${STORAGE_PREFIX}${sessionId}`;
    localStorage.removeItem(key);
    console.log(`🗑️ Cleared browser speech data for session ${sessionId}`);
  } catch (error) {
    console.error('Failed to clear browser speech data:', error);
  }
}

/**
 * Clear all browser speech data (useful for cleanup)
 */
export function clearAllBrowserSpeechData(): void {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared all browser speech data (${keys.length} sessions)`);
  } catch (error) {
    console.error('Failed to clear all browser speech data:', error);
  }
}

/**
 * Get list of all stored browser speech session IDs
 */
export function getStoredBrowserSpeechSessions(): string[] {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
    return keys.map(key => key.replace(STORAGE_PREFIX, ''));
  } catch (error) {
    console.error('Failed to get stored browser speech sessions:', error);
    return [];
  }
}

/**
 * Get storage size information for browser speech data
 */
export function getBrowserSpeechStorageInfo(): { sessionCount: number; estimatedSizeKB: number } {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
    let totalSize = 0;
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    });
    
    return {
      sessionCount: keys.length,
      estimatedSizeKB: Math.round(totalSize / 1024)
    };
  } catch (error) {
    console.error('Failed to get browser speech storage info:', error);
    return { sessionCount: 0, estimatedSizeKB: 0 };
  }
}
