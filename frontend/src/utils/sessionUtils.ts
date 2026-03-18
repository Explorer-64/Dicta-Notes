
import { TranscriptionResponse } from "brain/data-contracts";
import { SessionManager } from "./SessionManager";
import { toast } from "sonner";
import { clearLocalBackup } from "./transcriptionHelpers";

/**
 * Finalize a transcription session by saving it
 * @param transcript Full transcript text
 * @param options Session options and metadata
 */
export async function finalizeTranscriptionSession(
  transcript: string,
  options: {
    meetingTitle: string;
    recordingTime: number;
    companyId?: string;
    meetingPurpose?: string;
    isRecordingEnabled?: boolean;
    isStorageEnabled?: boolean;
    sessionId?: string;
    segments?: any[];
    additionalMetadata?: Record<string, any>;
  }
): Promise<string | null> {
  try {
    // Backend now handles session saving automatically via fire-and-forget architecture
    // This function is no longer needed as transcribe_audio saves sessions directly
    console.log('Session finalization handled by backend fire-and-forget architecture');
    
    // Clear any local backup since session is saved by backend
    if (options.sessionId) {
      clearLocalBackup();
      return options.sessionId;
    }
    
    return null;
  } catch (error) {
    console.error('Error finalizing session:', error);
    toast.error(`Error saving session: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Handle result from transcript processing
 * @param result Result from transcription API
 * @param options Session options
 */
export async function handleTranscriptionResult(
  result: TranscriptionResponse,
  options: {
    setTranscript?: (text: string) => void;
    setErrorMessage?: (error: string | null) => void;
    setGeminiSegments?: (segments: any[]) => void;
    setSessionId?: (id: string | null) => void;
    onTranscriptUpdate?: (text: string) => void;
    meetingTitle: string;
    recordingTime: number;
    companyId?: string | null;
    meetingPurpose?: string;
    sessionId?: string | null;
    isRecordingEnabled?: boolean;
    isStorageEnabled?: boolean;
  }
): Promise<void> {
  try {
    // Update UI with transcript
    if (options.setTranscript && result.full_text) {
      options.setTranscript(result.full_text);
      
      // Call external update handler if provided
      if (options.onTranscriptUpdate) {
        options.onTranscriptUpdate(result.full_text);
      }
    }
    
    // Update segments if available
    if (options.setGeminiSegments && result.segments) {
      options.setGeminiSegments(result.segments);
    }
    
    // Save session
    const savedSessionId = await finalizeTranscriptionSession(
      result.full_text,
      {
        meetingTitle: options.meetingTitle,
        recordingTime: options.recordingTime,
        companyId: options.companyId,
        meetingPurpose: options.meetingPurpose,
        sessionId: options.sessionId,
        isRecordingEnabled: options.isRecordingEnabled,
        isStorageEnabled: options.isStorageEnabled,
        segments: result.segments
      }
    );
    
    if (options.setSessionId && savedSessionId) {
      options.setSessionId(savedSessionId);
    }
  } catch (error) {
    console.error('Error handling transcription result:', error);
    if (options.setErrorMessage) {
      options.setErrorMessage(`Error processing transcription: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
