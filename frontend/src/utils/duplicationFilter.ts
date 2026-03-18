/**
 * Lightweight duplication detection for real-time transcription
 * Prevents common repetition patterns in Gemini Live stream
 */

interface DuplicationConfig {
  /** Minimum similarity threshold (0-1) to consider as duplicate */
  similarityThreshold: number;
  /** Look-back window size (number of recent segments to check) */
  windowSize: number;
  /** Minimum text length to apply filtering */
  minTextLength: number;
}

// Default configuration - tuned for real-time speech
const DEFAULT_CONFIG: DuplicationConfig = {
  similarityThreshold: 0.8,
  windowSize: 3,
  minTextLength: 10
};

/**
 * Simple text similarity using normalized word overlap
 * Fast enough for real-time processing
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().trim().split(/\s+/);
  const words2 = text2.toLowerCase().trim().split(/\s+/);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Check if new text is likely a duplicate of recent segments
 */
export function isDuplicateText(
  newText: string,
  recentTexts: string[],
  config: Partial<DuplicationConfig> = {}
): boolean {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Skip short texts
  if (newText.trim().length < cfg.minTextLength) {
    return false;
  }
  
  // Check against recent segments within window
  const checkWindow = recentTexts.slice(-cfg.windowSize);
  
  for (const recentText of checkWindow) {
    const similarity = calculateSimilarity(newText, recentText);
    if (similarity >= cfg.similarityThreshold) {
      console.log(`🚫 Duplicate detected: ${similarity.toFixed(2)} similarity with recent text`);
      return true;
    }
  }
  
  return false;
}

/**
 * Maintain a rolling buffer of recent texts for duplication checking
 */
export class DuplicationBuffer {
  private buffer: string[] = [];
  private maxSize: number;
  
  constructor(maxSize: number = 5) {
    this.maxSize = maxSize;
  }
  
  /**
   * Add new text and check if it's a duplicate
   * Returns true if text should be kept (not duplicate)
   */
  checkAndAdd(text: string, config?: Partial<DuplicationConfig>): boolean {
    const isUnique = !isDuplicateText(text, this.buffer, config);
    
    if (isUnique) {
      // Add to buffer and maintain size
      this.buffer.push(text);
      if (this.buffer.length > this.maxSize) {
        this.buffer.shift();
      }
    }
    
    return isUnique;
  }
  
  clear(): void {
    this.buffer = [];
  }
  
  getBuffer(): readonly string[] {
    return this.buffer;
  }
}
