
// Language-Segment Matching Queue
// Solves timing mismatch between real-time language detection and 10s delayed audio processing

interface QueuedLanguageChange {
  timestamp: number;
  language: string;
  expiresAt: number;
  segmentId?: string;
}

class LanguageSegmentQueue {
  private queue: QueuedLanguageChange[] = [];
  private readonly LANGUAGE_HOLD_MS = 9500; // Hold language codes for exactly 9.5 seconds from detection
  
  /**
   * Add a language change detected at current time (t=0)
   */
  addLanguageChange(language: string): void {
    const timestamp = Date.now(); // This is t=0 for this detection
    const expiresAt = timestamp + this.LANGUAGE_HOLD_MS; // Available until t=9.5s
    console.log(`🎯 [LanguageQueue] Language detected at t=0, holding ${language} until t=9.5s`);
    
    this.queue.push({
      timestamp,
      language,
      expiresAt
    });
    
    // Clean up expired entries
    this.cleanup();
  }
  
  /**
   * Get the language that should be used for a segment being processed now
   */
  getLanguageForCurrentSegment(): string | null {
    const now = Date.now();
    
    // Find the most recent valid language change
    let applicableLanguage: string | null = null;
    
    for (const change of this.queue) {
      if (change.timestamp <= now && now <= change.expiresAt) {
        applicableLanguage = change.language;
      }
    }
    
    if (applicableLanguage) {
      console.log(`🎯 [LanguageQueue] Found valid language for segment: ${applicableLanguage}`);
    }
    
    return applicableLanguage;
  }
  
  /**
   * Get language for a specific segment with known start time
   */
  getLanguageForSegmentTime(segmentStartTime: number): string | null {
    // Find valid language for when this segment gets processed
    const segmentProcessTime = segmentStartTime + 10000; // 10s processing delay
    
    let applicableLanguage: string | null = null;
    
    for (const change of this.queue) {
      if (change.timestamp <= segmentProcessTime && segmentProcessTime <= change.expiresAt) {
        applicableLanguage = change.language;
      }
    }
    
    return applicableLanguage;
  }
  
  /**
   * Clean up expired language changes
   */
  private cleanup(): void {
    const now = Date.now();
    this.queue = this.queue.filter(change => change.expiresAt > now);
    
    if (this.queue.length > 10) {
      // Keep only the 10 most recent entries to prevent memory bloat
      this.queue = this.queue.slice(-10);
    }
  }
  
  /**
   * Clear all queued changes (useful for new sessions)
   */
  clear(): void {
    console.log(`🎯 [LanguageQueue] Clearing queue`);
    this.queue = [];
  }
  
  /**
   * Get current queue state for debugging
   */
  getQueueState() {
    return {
      queueLength: this.queue.length,
      queue: this.queue.map(change => ({
        timestamp: new Date(change.timestamp).toISOString(),
        language: change.language
      }))
    };
  }
}

// Export singleton instance
export const languageSegmentQueue = new LanguageSegmentQueue();
export type { QueuedLanguageChange };
