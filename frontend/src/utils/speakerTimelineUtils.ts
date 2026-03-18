/**
 * Utilities for tracking speaker changes during recording
 * This helps improve Gemini's speaker identification accuracy
 */

/**
 * Represents a single speaker change event during recording
 */
export interface SpeakerChangeEvent {
  timestamp: number;  // Recording time in seconds
  speakerName: string; // Name of the speaker
  speakerId: string;   // ID of the speaker (e.g., "speaker_1")
}

/**
 * Track a new speaker change in the timeline
 * @param timeline Existing timeline of speaker changes
 * @param recordingTime Current recording time in seconds
 * @param speakerName Name of the active speaker
 * @param speakerIndex Index of the speaker in the participants array
 * @returns Updated timeline with the new speaker change
 */
export function trackSpeakerChange(
  timeline: SpeakerChangeEvent[],
  recordingTime: number,
  speakerName: string,
  speakerIndex: number
): SpeakerChangeEvent[] {
  // Create speaker ID in the format "speaker_1", "speaker_2", etc.
  const speakerId = `speaker_${speakerIndex + 1}`;
  
  // Create the new speaker change event
  const newEvent: SpeakerChangeEvent = {
    timestamp: recordingTime,
    speakerName,
    speakerId
  };
  
  // Add to the timeline
  return [...timeline, newEvent];
}

/**
 * Format the speaker timeline for Gemini API
 * This creates a string that can be added to the transcription prompt
 * to provide context on who was speaking when. The timeline is formatted
 * as a series of time markers with associated speaker information.
 * 
 * Example output:
 * ```
 * SPEAKER TIMELINE (reference points for voice matching):
 * [00:05] John Smith (ID: speaker_1) begins speaking
 * [01:20] Maria Garcia (ID: speaker_2) begins speaking
 * [03:45] John Smith (ID: speaker_1) begins speaking
 * ```
 * 
 * @param timeline The speaker timeline events
 * @returns Formatted string for Gemini prompt
 */
export function formatSpeakerTimelineForGemini(timeline: SpeakerChangeEvent[]): string {
  if (!timeline || timeline.length === 0) {
    return "";
  }
  
  // Sort by timestamp to ensure chronological order
  const sortedTimeline = [...timeline].sort((a, b) => a.timestamp - b.timestamp);
  
  // Format as text for Gemini
  let formattedTimeline = "\n\nSPEAKER TIMELINE (reference points for voice matching):\n";
  
  sortedTimeline.forEach((event) => {
    // Format timestamp as MM:SS
    const minutes = Math.floor(event.timestamp / 60);
    const seconds = Math.floor(event.timestamp % 60);
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    formattedTimeline += `[${formattedTime}] ${event.speakerName} (ID: ${event.speakerId}) begins speaking\n`;
  });
  
  return formattedTimeline;
}
