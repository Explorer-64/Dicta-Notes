import type { TranscriptionSegment, Speaker } from "types";
import { formatTime } from "utils/mediaRecorderUtils";
import { detectSilence, blobToBase64 } from "utils/mediaRecorderUtils";
import brain from "brain";
import { TranscriptionResponse } from "brain/data-contracts";

/**
 * Formats transcription data for display and processing
 */

// Convert raw transcript text to structured segments
export function parseTranscriptToSegments(transcript: string): TranscriptionSegment[] {
  if (!transcript) return [];
  
  const segments: TranscriptionSegment[] = [];
  // Pattern to match speaker and text
  const pattern = /([^:\n]+):\s*(.+?)(?=\n[^:\n]+:|$)/gs;
  
  let match;
  let segmentId = 0;
  while ((match = pattern.exec(transcript)) !== null) {
    const speakerName = match[1].trim();
    const text = match[2].trim();
    
    // Skip empty segments
    if (!text) continue;
    
    segmentId++;
    segments.push({
      id: `segment_${segmentId}`,
      speaker: `speaker_${segmentId}`,
      speaker_name: speakerName,
      text,
      start_time: 0, // Placeholder
      end_time: 0,   // Placeholder
    });
  }
  
  return segments;
}

// Extract unique speakers from segments
export function extractSpeakersFromSegments(segments: TranscriptionSegment[]): Speaker[] {
  if (!segments || segments.length === 0) return [];
  
  const speakersMap = new Map<string, Speaker>();
  
  segments.forEach(segment => {
    if (segment.speaker && !speakersMap.has(segment.speaker)) {
      speakersMap.set(segment.speaker, {
        id: segment.speaker,
        name: segment.speaker_name || 'Unknown Speaker'
      });
    }
  });
  
  return Array.from(speakersMap.values());
}

// Generate speaker colors for UI display
export function generateSpeakerColors(speakers: Speaker[]): Record<string, string> {
  if (!speakers || speakers.length === 0) return {};
  
  // Google-inspired color palette
  const colors = [
    '#4285F4', // Google Blue
    '#EA4335', // Google Red
    '#FBBC05', // Google Yellow
    '#34A853', // Google Green
    '#673AB7', // Purple
    '#FF9800', // Orange
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#009688', // Teal
    '#E91E63', // Pink
  ];
  
  const colorMap: Record<string, string> = {};
  
  speakers.forEach((speaker, index) => {
    colorMap[speaker.id] = colors[index % colors.length];
  });
  
  return colorMap;
}

// Combine interim and final transcription results
export function combineTranscriptionResults(
  finalTranscript: string,
  interimTranscript: string,
  currentSpeaker: string = 'You'
): string {
  let result = finalTranscript;
  
  // Add current speaker prefix if not present and there's content
  if (interimTranscript.trim() && !result.endsWith(`${currentSpeaker}:`)) {
    if (result && !result.endsWith('\n')) {
      result += '\n';
    }
    result += `${currentSpeaker}: `;
  }
  
  // Add interim results
  if (interimTranscript.trim()) {
    result += interimTranscript;
  }
  
  return result;
}

// Format transcript for different export formats
export function formatTranscriptForExport(
  transcript: string,
  segments: TranscriptionSegment[],
  speakers: Speaker[],
  format: 'text' | 'json' | 'html' = 'text'
): string {
  if (format === 'text') {
    return transcript;
  }
  
  if (format === 'json') {
    const speakerColors = generateSpeakerColors(speakers);
    return JSON.stringify({
      transcript,
      segments,
      speakers,
      speaker_colors: speakerColors
    }, null, 2);
  }
  
  if (format === 'html') {
    const speakerColors = generateSpeakerColors(speakers);
    let html = '<div class="transcript">';
    
    segments.forEach(segment => {
      const speakerColor = speakerColors[segment.speaker] || '#333333';
      const speakerName = segment.speaker_name || 'Unknown Speaker';
      
      html += `<div class="segment">`;
      html += `<span class="speaker" style="color: ${speakerColor}">${speakerName}:</span>`;
      html += `<span class="text">${segment.text}</span>`;
      html += `</div>`;
    });
    
    html += '</div>';
    return html;
  }
  
  return transcript;
}

// Process and fix common transcription errors
export function correctTranscriptionErrors(text: string): string {
  if (!text) return text;
  
  // Common corrections
  let corrected = text
    // Fix common punctuation issues
    .replace(/\s+\./g, '.') 
    .replace(/\s+,/g, ',')
    .replace(/\s+\?/g, '?')
    .replace(/\s+!/g, '!')
    .replace(/\s+:/g, ':')
    
    // Fix capitalization after periods
    .replace(/\.\s+([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`)
    
    // Fix common phrase misrecognitions
    .replace(/(?:could of|could have been)/gi, 'could have')
    .replace(/(?:should of|should have been)/gi, 'should have')
    .replace(/(?:would of|would have been)/gi, 'would have')
    
    // Common name corrections
    .replace(/(?:^|\s)ai(?:\s|$)/g, ' AI ');
  
  return corrected.trim();
}

// Detect and format speaker changes in realtime transcript
export function detectSpeakerChanges(transcript: string): string {
  if (!transcript) return transcript;
  
  // Pattern to detect text that might be a speaker change
  // Like "John:" or "Speaker 1:" at start of new line or after period
  const potentialSpeakerPattern = /(?:^|\. |\n)([A-Z][a-zA-Z]*(?: [A-Z][a-zA-Z]*){0,2})\s*(?=says|said|speaks|spoke|asked|saying|:\s)/g;
  
  return transcript.replace(potentialSpeakerPattern, (match, speakerName) => {
    // Format as proper speaker label
    // Replace "John says" -> "John:" or "John said" -> "John:"
    if (match.startsWith('.') || match.startsWith('\n')) {
      return `${match.charAt(0)}${speakerName}: `;
    }
    return `${speakerName}: `;
  });
}

/**
 * Check if recording is too short or mostly silent
 * @param recordingTime Duration of the recording in seconds
 * @param audioChunks Audio chunks from recording
 * @param options Optional settings like minimum duration
 */
export async function validateRecordingQuality(
  recordingTime: number,
  audioChunks: Blob[],
  options?: {
    minRecordingDuration?: number; // Minimum valid recording duration in seconds
    mimeType?: string; // Audio MIME type
  }
): Promise<{ isValid: boolean; reason?: string }> {
  const minDuration = options?.minRecordingDuration ?? 10; // Default 10 seconds
  const mimeType = options?.mimeType ?? 'audio/webm';
  
  // Check if recording is too short
  if (recordingTime < minDuration) {
    return { 
      isValid: false, 
      reason: `Recording too short (${recordingTime}s), minimum is ${minDuration}s` 
    };
  }
  
  // Check if audio is mostly silent
  try {
    if (audioChunks.length === 0) {
      return { isValid: false, reason: 'No audio data available' };
    }
    
    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const isSilent = await detectSilence(audioBlob);
    if (isSilent) {
      return { isValid: false, reason: 'Recording contains mostly silence' };
    }
  } catch (error) {
    console.error('Error checking for silence:', error);
    // Continue with processing if silence detection fails
  }
  
  return { isValid: true };
}

/**
 * Format a timestamp for transcript display
 * @param seconds Number of seconds
 */
export function formatTranscriptTimestamp(seconds: number): string {
  return `[${formatTime(seconds)}]`;
}

/**
 * Process speech recognition results for display
 * @param event Speech recognition event
 * @param options Processing options
 */
export function processSpeechRecognitionResult(event: any, options: {
  recordingTime: number;
  currentSpeaker: string;
  isFinal?: boolean;
}): { interimTranscript: string; finalTranscript: string | null } {
  const { recordingTime, currentSpeaker, isFinal = false } = options;
  let interimTranscript = '';
  let finalTranscript = null;
  
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const transcriptText = result[0].transcript;
    
    if (result.isFinal && isFinal) {
      // Format with timestamp and speaker for final result
      finalTranscript = `\n${formatTranscriptTimestamp(recordingTime)} ${currentSpeaker}: ${transcriptText.trim()}\n\n`;
    } else {
      interimTranscript += transcriptText;
    }
  }
  
  return { interimTranscript, finalTranscript };
}

/**
 * Update the interim display with current speaker
 * @param interimText The interim text to display
 * @param currentSpeaker The current active speaker
 */
export function updateInterimDisplay(interimText: string, currentSpeaker: string): string {
  if (!interimText || !interimText.trim()) return "";
  
  // Format with current speaker
  return `${currentSpeaker} (typing...): ${interimText.trim()}`;
}

/**
 * Process a full transcription after recording ends
 * @param audioChunks The audio data chunks
 * @param options Processing options
 */
export async function processFullTranscription(audioChunks: Blob[], options: {
  mimeType?: string;
  meetingTitle: string;
  participants: string[];
  recordingTime: number;
}): Promise<TranscriptionResponse> {
  if (audioChunks.length === 0) {
    throw new Error("No audio recorded.");
  }
  
  try {
    // Create audio blob from chunks
    const audioBlob = new Blob(audioChunks, { type: options.mimeType || 'audio/webm' });
    
    // Convert to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Send to API for processing
    const response = await brain.transcribe_audio({
      audio_data: base64Audio,
      filename: `meeting_${Date.now()}.webm`,
      content_type: options.mimeType || 'audio/webm',
      meeting_title: options.meetingTitle,
      participants: options.participants,
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error processing full transcription:', error);
    throw error;
  }
}



/**
 * Process recorded audio and get transcription
 * @param audioChunks Array of audio blobs from recording
 * @param options Additional options for processing
 */
export async function processRecordedAudio(
  audioChunks: Blob[],
  options?: {
    mimeType?: string;
    meetingTitle?: string;
    meetingPurpose?: string;
    participants?: string[];
    transcriptionMode?: 'browser' | 'gemini' | 'hybrid';
  }
): Promise<TranscriptionResponse | null> {
  if (audioChunks.length === 0) {
    throw new Error("No audio recorded.");
  }
  
  try {
    // Create audio blob from chunks
    const audioBlob = new Blob(audioChunks, { type: options?.mimeType || 'audio/webm' });
    
    // Convert to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Send to API for processing with Gemini
    const response = await brain.transcribe_audio({
      audio_data: base64Audio,
      filename: `meeting_${Date.now()}.webm`,
      content_type: options?.mimeType || 'audio/webm',
      meeting_title: options?.meetingTitle || 'Untitled Meeting',
      meeting_purpose: options?.meetingPurpose || '',
      participants: options?.participants || [],
      transcription_mode: options?.transcriptionMode || 'hybrid'
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error processing audio recording:', error);
    throw error;
  }
}
