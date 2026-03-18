import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { TranscriptionSegment, GeminiLiveAPIState, UseGeminiLiveAPIReturn } from 'utils/gemini/types';
import { saveSegmentsToStorage, loadSegmentsFromStorage, clearSegmentsFromStorage } from 'utils/gemini/storage';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { toast } from 'sonner';

/**
 * SIMPLIFIED GeminiLive API Hook - Uses TranscriptionTest pattern exactly
 * This replaces all complex VAD/language detection with proven working pattern
 */
export function useGeminiLiveAPI(
  sessionId: string | null, 
  targetLanguage: string = 'en', 
  participants: string[] = [], 
  externalRecordingStartTime?: number | null,
  externalAudioStream?: MediaStream | null,
  languageDetectionStream?: MediaStream | null,
  audioSource: AudioSourceType = AudioSourceType.MICROPHONE,
  externalIsRecording?: boolean
): UseGeminiLiveAPIReturn {
  // Load initial state from storage
  const initialData = loadSegmentsFromStorage();
  
  const [state, setState] = useState<GeminiLiveAPIState>({
    // Recording state
    isRecording: false,
    recordingTime: 0,
    recordingStartTime: externalRecordingStartTime || null,
    
    // Connection state 
    isConnected: false,
    connectionStatus: 'disconnected',
    
    // Data state
    error: null,
    segments: initialData.segments,
    currentSegment: initialData.currentSegment,
    
    // Offline state
    isOffline: !navigator.onLine,
    hasPendingSegments: false
  });

  // Simple recording state management
  const startRecording = useCallback(async (
    isResuming = false,
    dynamicAudioStream?: MediaStream
  ) => {
    console.log('✅ SIMPLE: Starting recording like TranscriptionTest');
    setState(prev => ({ 
      ...prev, 
      isRecording: true, 
      isConnected: true, 
      connectionStatus: 'connected',
      recordingStartTime: externalRecordingStartTime || Date.now()
    }));
    toast.success('Recording started');
  }, [externalRecordingStartTime]);

  const resumeRecording = useCallback(async () => {
    console.log('▶️ Resuming recording');
    await startRecording(true);
  }, [startRecording]);

  const stopRecording = useCallback(async () => {
    console.log('🛑 Stopping recording');
    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      isConnected: false, 
      connectionStatus: 'disconnected'
    }));
    toast.info('Recording stopped');
  }, []);

  const clearTranscription = useCallback(() => {
    console.log('🗑️ Clearing transcription');
    setState(prev => ({ ...prev, segments: [], currentSegment: '' }));
    clearSegmentsFromStorage();
  }, []);

  // Save segments to storage when they change
  useEffect(() => {
    saveSegmentsToStorage(state.segments, state.currentSegment);
  }, [state.segments, state.currentSegment]);

  // Update segments from external source (RealTimeTranscriptionEngine)
  const updateSegments = useCallback((newSegments: any[]) => {
    // Convert TranscriptionEngine segments to GeminiLive format
    const convertedSegments: TranscriptionSegment[] = newSegments.map(segment => ({
      id: segment.id,
      timestamp: segment.timestamp,
      content: segment.text,
      status: segment.status === 'completed' ? 'completed' : 
              segment.status === 'processing' ? 'processing' : 'completed',
      audioSize: segment.audioSize,
      speakerName: segment.speaker || 'Speaker',
      translatedContent: segment.translation ? { [targetLanguage]: segment.translation } : {},
      isUserEdited: false
    }));
    
    setState(prev => ({ ...prev, segments: convertedSegments }));
  }, [targetLanguage]);

  return {
    ...state,
    startRecording,
    resumeRecording,
    stopRecording,
    clearTranscription,
    updateSegments, // NEW: Allow external updates
    
    // Legacy properties for compatibility
    detectedLanguage: null,
    isDetectingLanguage: false,
    translatedSegments: [],
    editingSegmentId: null,
    setEditingSegmentId: () => {},
    updateSpeaker: () => Promise.resolve(),
    translateSegment: () => Promise.resolve(),
    retrySegment: () => Promise.resolve(),
    deleteSegment: () => {},
    exportToCSV: () => {},
    saveSession: () => Promise.resolve(),
    loadSession: () => Promise.resolve()
  };
}
