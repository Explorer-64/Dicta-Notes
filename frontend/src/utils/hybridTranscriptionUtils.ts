/**
 * hybridTranscriptionUtils.ts
 * 
 * DEPRECATED: This file is kept for reference only.
 * 
 * These utility functions are no longer used as we're now displaying
 * the raw output from Gemini without additional processing.
 */

// Maintain empty exports to avoid breaking imports elsewhere
export const formatInterimTranscript = (text: string, speaker: string): string => {
  return text; // No formatting, just return raw text
}

export const formatFinalTranscript = (text: string, speaker: string, timestamp: string): string => {
  return text; // No formatting, just return raw text
}

export const reconcileTranscriptions = (
  browserText: string,
  geminiSegments: any[],
  recordingTime: number,
  currentSpeaker: string = "Current Speaker"
): string => {
  // Simply return the input without modifications
  return browserText;
};
