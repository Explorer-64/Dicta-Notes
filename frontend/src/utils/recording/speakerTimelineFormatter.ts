/**
 * Format speaker timeline data for Gemini processing
 */
export const formatSpeakerTimelineForGemini = (speakerTimeline: any[]): string => {
  if (!speakerTimeline || speakerTimeline.length === 0) {
    return '';
  }
  
  // Create a formatted timeline string for Gemini
  const timelineStr = speakerTimeline
    .map(entry => `${entry.timestamp}: ${entry.speaker}`)
    .join(', ');
    
  return ` [Speaker Timeline: ${timelineStr}]`;
};
