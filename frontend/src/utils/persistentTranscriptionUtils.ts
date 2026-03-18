/**
 * Utilities for persistent real-time transcription with speaker separation
 */

import { Speaker, TranscriptionSegment } from "brain/data-contracts";

/**
 * Interface for transcript segments with speaker info
 */
export interface TranscriptSegment {
  text: string;             // The actual transcript text
  speakerName: string;      // Name of the speaker (or number if anonymous)
  speakerId: string;        // Speaker identifier
  timestamp: number;        // Timestamp when this segment was captured
  isFinal: boolean;         // Whether this is a final (not interim) result
  segmentId: string;        // Unique ID for this segment
}

/**
 * Stores all transcript segments for the current session
 */
let transcriptSegments: TranscriptSegment[] = [];

/**
 * Clears all transcript segments
 */
export function clearTranscriptSegments(): void {
  transcriptSegments = [];
}

/**
 * Adds a new transcript segment
 * @param segment The segment to add
 */
export function addTranscriptSegment(segment: TranscriptSegment): void {
  transcriptSegments.push(segment);
}

/**
 * Gets all transcript segments
 */
export function getTranscriptSegments(): TranscriptSegment[] {
  return [...transcriptSegments];
}

/**
 * Generate a unique segment ID
 */
export function generateSegmentId(): string {
  return `segment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formats a transcript segment for display
 * @param segment The segment to format
 */
export function formatSegmentForDisplay(segment: TranscriptSegment): string {
  const timestamp = formatTimestamp(segment.timestamp);
  return `${timestamp} ${segment.speakerName}: ${segment.text}`;
}

/**
 * Format a timestamp (seconds) into MM:SS format
 * @param seconds Time in seconds
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
}

/**
 * Merge transcript segments into a single string
 * @param segments The segments to merge
 */
export function mergeSegmentsToText(segments: TranscriptSegment[]): string {
  if (segments.length === 0) return '';  
  return segments
    .filter(segment => segment.isFinal) // Only include final segments
    .map(segment => formatSegmentForDisplay(segment))
    .join('\n');
}

/**
 * Add interim text to merged transcript
 * @param mergedText The merged transcript
 * @param interimSegment The interim segment to add
 */
export function addInterimTextToTranscript(mergedText: string, interimSegment: TranscriptSegment | null): string {
  if (!interimSegment) return mergedText;
  const formattedInterim = formatSegmentForDisplay(interimSegment);
  return mergedText ? `${mergedText}\n${formattedInterim}` : formattedInterim;
}

/**
 * Create a speaker mapping legend for use with Gemini API
 * @param speakers Array of speaker names
 */
export function createSpeakerMapping(speakers: string[]): Record<string, string> {
  if (!speakers || speakers.length === 0) {
    // Default placeholder speakers if none provided
    return { 'speaker_1': 'Speaker 1', 'speaker_2': 'Speaker 2' };
  }
  // Create mapping of all provided speakers
  return speakers.reduce((mapping, speaker, index) => {
    mapping[`speaker_${index + 1}`] = speaker;
    return mapping;
  }, {} as Record<string, string>);
}

/**
 * Convert browser transcript segments to format expected by Gemini API
 * @param segments The browser transcript segments
 */
export function prepareBrowserSegmentsForGemini(
  segments: TranscriptSegment[]
): { text: string, speaker_mapping: Record<string, string> } {
  const speakerMap = segments.reduce((mapping, segment) => {
    if (!mapping[segment.speakerId]) {
      mapping[segment.speakerId] = segment.speakerName;
    }
    return mapping;
  }, {} as Record<string, string>);
  // Format text with speaker labels
  const formattedText = segments
    .filter(segment => segment.isFinal)
    .map(segment => `${segment.speakerName}: ${segment.text}`)
    .join('\n');
  return {
    text: formattedText,
    speaker_mapping: speakerMap
  };
}
