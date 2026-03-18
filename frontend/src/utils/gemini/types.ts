/**
 * Type definitions for Gemini Live API hook
 */

export interface TranscriptionSegment {
  id: string;
  text: string;
  speaker?: string;
  timestamp: number;
  language?: string;
  isComplete: boolean;
  translation?: string; // Add translation field
}

export interface GeminiLiveAPIState {
  // Recording state - completely independent of connection
  isRecording: boolean;
  recordingTime: number;
  recordingStartTime: number | null;
  
  // Connection state - separate from recording
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'offline';
  
  // Data state
  error: string | null;
  segments: TranscriptionSegment[];
  currentSegment: string;
  
  // Offline state
  isOffline: boolean;
  hasPendingSegments: boolean;
}

export interface UseGeminiLiveAPIReturn extends GeminiLiveAPIState {
  startRecording: (isResuming?: boolean, dynamicAudioStream?: MediaStream) => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscription: () => void;
  updateSpeakerName: (segmentId: string, newSpeaker: string) => void;
}
