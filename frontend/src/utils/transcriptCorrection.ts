import { TranscriptionSegment } from '../brain/data-contracts';

/**
 * Utility functions for transcript correction and quality improvement
 * Helps reconcile browser Speech API results with Gemini corrections
 */

/**
 * Improves transcript quality by applying Gemini corrections to browser transcription
 * Uses Levenshtein distance to identify similar phrases for correction
 */
export const improveTranscriptQuality = (
  browserText: string,
  geminiText: string,
  previousCorrections: Map<string, string> = new Map()
): { correctedText: string, corrections: Map<string, string> } => {
  if (!browserText || !geminiText) {
    return { correctedText: browserText || geminiText || '', corrections: previousCorrections };
  }
  
  // Split into sentences for better correction matching
  const browserSentences = browserText.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  const geminiSentences = geminiText.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  
  // Initialize corrections map from previous corrections
  const corrections = new Map(previousCorrections);
  
  // Apply corrections at the sentence or phrase level
  browserSentences.forEach(browserSentence => {
    // Skip very short snippets
    if (browserSentence.length < 4) return;
    
    // Look for similar sentences in Gemini text
    const bestMatchingSentence = findBestMatch(browserSentence, geminiSentences);
    
    // If we found a good match that differs from the browser text, store correction
    if (bestMatchingSentence && 
        bestMatchingSentence !== browserSentence && 
        calculateSimilarity(browserSentence, bestMatchingSentence) > 0.6) {
      corrections.set(browserSentence, bestMatchingSentence);
    }
  });
  
  // Apply all collected corrections to the original text
  let correctedText = browserText;
  corrections.forEach((correction, original) => {
    // Use regex to replace only complete phrases, not partial matches
    const safeOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${safeOriginal}\\b`, 'g');
    correctedText = correctedText.replace(pattern, correction);
  });
  
  return { correctedText, corrections };
};

/**
 * Find the best matching sentence from a list of candidates
 * @param target The sentence to find a match for
 * @param candidates List of possible matches
 * @returns The best matching sentence or null
 */
const findBestMatch = (target: string, candidates: string[]): string | null => {
  if (!candidates.length) return null;
  
  let bestMatch = null;
  let highestSimilarity = 0;
  
  candidates.forEach(candidate => {
    const similarity = calculateSimilarity(target, candidate);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = candidate;
    }
  });
  
  return bestMatch;
};

/**
 * Calculate string similarity using Levenshtein distance
 * @returns Similarity score between 0 and 1
 */
const calculateSimilarity = (a: string, b: string): number => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  
  // Convert to lowercase for comparison
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  
  // Calculate Levenshtein distance
  const track = Array(s2.length + 1).fill(null).map(() => 
    Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  // Calculate similarity ratio
  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - distance / maxLength;
};

/**
 * Identifies potential corrections in text for visual highlighting
 * @param text Original text
 * @returns Text with HTML markup for highlighting corrections
 */
export const markPotentialCorrections = (text: string): string => {
  if (!text) return '';
  
  return text
    .split(' ')
    .map((word, i) => {
      // Skip punctuation-only tokens
      if (word.match(/^[.,;:!?()\[\]{}"']+$/)) return word;
      
      // Identify potential corrections
      const isTechnicalTerm = word.length >= 8;
      const isCamelCase = word.match(/^[a-z]+[A-Z][a-z]+/);
      const isPascalCase = word.match(/^[A-Z][a-z]+[A-Z][a-z]+/);
      const isProperNoun = i > 0 && word.match(/^[A-Z][a-z]+/);
      
      if (isTechnicalTerm || isCamelCase || isPascalCase || isProperNoun) {
        return `<span class="px-0.5 bg-green-100 text-green-800 rounded">${word}</span>`;
      }
      
      return word;
    })
    .join(' ');
};

/**
 * Reconciles browser and Gemini transcriptions for hybrid display
 * showing processed segments with speaker identification and current speech
 */
export const reconcileHybridTranscription = (
  browserText: string,
  geminiSegments: TranscriptionSegment[], 
  recordingTime: number,
  currentSpeaker: string = "Current Speaker"
): string => {
  if (geminiSegments.length === 0) {
    if (!browserText || !browserText.trim()) return '';
    
    // Format current browser text if no Gemini segments available
    const timestamp = formatTimestamp(recordingTime);
    return `${timestamp} ${currentSpeaker} (BROWSER): ${browserText.trim()}`;
  }
  
  // Build the processed part from Gemini segments
  let reconciled = '';
  
  // Sort segments by start time for chronological order
  const sortedSegments = [...geminiSegments].sort((a, b) => a.start_time - b.start_time);
  
  // Group segments by speaker to combine consecutive segments from the same speaker
  let currentSpeakerId = '';
  let currentSegmentText = '';
  let currentStartTime = 0;
  
  // Process each segment
  sortedSegments.forEach((segment, index) => {
    // Get speaker name with fallback
    const speakerName = segment.speaker?.name || `Speaker ${segment.speaker?.id?.replace('speaker_', '') || index + 1}`;
    const speakerId = segment.speaker?.id || `speaker_${index + 1}`;
    
    // Format timestamp
    const timestamp = formatTimestamp(segment.start_time);
    
    // Check if this is a new speaker or first segment
    if (speakerId !== currentSpeakerId || index === 0) {
      // If we have accumulated text from previous speaker, add it first
      if (currentSegmentText.length > 0) {
        const prevTimestamp = formatTimestamp(currentStartTime);
        const prevSpeakerName = sortedSegments.find(s => s.speaker?.id === currentSpeakerId)?.speaker?.name || 'Speaker';
        reconciled += `${prevTimestamp} ${prevSpeakerName} (GEMINI): ${currentSegmentText}\n\n`;
      }
      
      // Start new speaker segment
      currentSpeakerId = speakerId;
      currentSegmentText = segment.text;
      currentStartTime = segment.start_time;
    } else {
      // Continue with same speaker, append text
      currentSegmentText += " " + segment.text;
    }
    
    // Add the last segment if it's the final one
    if (index === sortedSegments.length - 1) {
      reconciled += `${timestamp} ${speakerName} (GEMINI): ${currentSegmentText}\n\n`;
    }
  });
  
  // Add any unprocessed browser transcript if available and we're still recording
  if (browserText && browserText.trim().length > 0) {
    const liveTimestamp = formatTimestamp(recordingTime);
    reconciled += `${liveTimestamp} ${currentSpeaker} (BROWSER): ${browserText.trim()}`;
  }
  
  return reconciled;
};

// Helper function to format timestamps
const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `[${mins}:${secs}]`;
};