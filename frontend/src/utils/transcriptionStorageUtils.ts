import { TranscriptSegment } from "utils/persistentTranscriptionUtils";

/**
 * Interface for translation data that can be persisted
 */
export interface TranslationData {
  segmentId: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  showTranslation: boolean;
}

/**
 * Interface for persistent transcription state
 */
export interface TranscriptionState {
  meetingTitle: string;
  meetingPurpose: string;
  participants: string[];
  transcript: string;
  geminiTranscript: string;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  sessionId: string | null;
  // Translation persistence
  translations: TranslationData[];
  preferredTargetLanguage: string;
}

/**
 * Save the current transcription state to session storage
 * @param state The state to save
 */
export function saveTranscriptionState(state: TranscriptionState): void {
  try {
    // Don't save if recording is not started yet
    if (state.transcript.length === 0) {
      return;
    }
    
    // Store recording state properties separately as we need to reset them on return
    sessionStorage.setItem('dicta_transcription_state', JSON.stringify({
      meetingTitle: state.meetingTitle,
      meetingPurpose: state.meetingPurpose,
      participants: state.participants,
      transcript: state.transcript,
      geminiTranscript: state.geminiTranscript,
      recordingTime: state.recordingTime,
      sessionId: state.sessionId,
      // Translation persistence
      translations: state.translations || [],
      preferredTargetLanguage: state.preferredTargetLanguage || 'en',
      // Always save these as false to prevent auto-starting recording
      isRecording: false,
      isPaused: false,
    }));
  } catch (error) {
    console.error('Error saving transcription state:', error);
  }
}

/**
 * Load the transcription state from session storage
 * @returns The saved state or null if not found
 */
export function loadTranscriptionState(): TranscriptionState | null {
  try {
    const savedState = sessionStorage.getItem('dicta_transcription_state');
    if (!savedState) return null;
    
    return JSON.parse(savedState) as TranscriptionState;
  } catch (error) {
    console.error('Error loading transcription state:', error);
    return null;
  }
}

/**
 * Clear all transcription state from session storage
 */
export function clearTranscriptionState(): void {
  try {
    sessionStorage.removeItem('dicta_transcription_state');
  } catch (error) {
    console.error('Error clearing transcription state:', error);
  }
}
