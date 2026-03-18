
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AudioSourceType } from './audioSourceTypes';
import { detectBrowserCapabilities, getCapabilityWarning } from './browserCapabilities';
import { recordingTimer } from './RecordingTimerService';

/**
 * Audio recorder states
 */
export enum AudioRecorderState {
  Idle = 'idle',
  Recording = 'recording',
  Stopped = 'stopped',
  Error = 'error'
}

/**
 * Hook for managing audio recording with MediaRecorder and enhanced audio capture
 */
export function useAudioRecorder() {
  const [recorderState, setRecorderState] = useState<AudioRecorderState>(AudioRecorderState.Idle);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentAudioSource, setCurrentAudioSource] = useState<AudioSourceType>(AudioSourceType.MICROPHONE);
  const [isCapturingSystemAudio, setIsCapturingSystemAudio] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const enhancedCaptureRef = useRef<any>(null);

  // Subscribe to singleton timer updates
  useEffect(() => {
    const unsubscribe = recordingTimer.subscribe((state) => {
      setRecordingTime(state.currentTime);
    });
    
    return unsubscribe;
  }, []);

  const startRecording = useCallback(async (preferredSource?: AudioSourceType) => {
    try {
      setErrorMessage(null);
      setAudioBlob(null);
      audioChunksRef.current = [];
      setRecordingTime(0);
      
      // Try enhanced audio capture first
      const result = await initializeEnhancedMediaRecorder(
        mediaRecorderRef,
        audioChunksRef,
        setErrorMessage,
        preferredSource
      );
      
      if (!result.success || !mediaRecorderRef.current) {
        setRecorderState(AudioRecorderState.Error);
        return;
      }
      
      // Update state based on capture result
      setCurrentAudioSource(result.sourceType);
      setIsCapturingSystemAudio(result.sourceType === AudioSourceType.SYSTEM_AUDIO);
      
      if (result.displayInfo?.isScreenShare) {
        console.log('🎯 Successfully capturing meeting audio via screen share!');
      }
      
      if (result.displayInfo?.isScreenShare) {
        console.log('🎯 Successfully capturing meeting audio via screen share!');
      }
      
      // Set up event handlers
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: result.mimeType });
        setAudioBlob(audioBlob);
        setRecorderState(AudioRecorderState.Stopped);
        recordingTimer.stop();
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setRecorderState(AudioRecorderState.Recording);
      
      // Start singleton timer
      recordingTimer.start();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setErrorMessage(`Error starting recording: ${error}`);
      setRecorderState(AudioRecorderState.Error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recorderState === AudioRecorderState.Recording) {
      mediaRecorderRef.current.stop();
      
      // Stop enhanced audio capture
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsCapturingSystemAudio(false);
      setCurrentAudioSource(AudioSourceType.MICROPHONE);
      
      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [recorderState]);

  // Get browser capabilities for UI hints
  const getBrowserCapabilities = useCallback(async () => {
    const capabilities = await detectBrowserCapabilities();
    const warning = getCapabilityWarning(capabilities);
    return { capabilities, warning };
  }, []);
  
  return {
    recorderState,
    audioBlob,
    recordingTime,
    errorMessage,
    currentAudioSource,
    isCapturingSystemAudio,
    startRecording,
    stopRecording,
    getBrowserCapabilities
  };
}

/**
 * Media recorder initialization utilities
 */

export async function initializeMediaRecorder(
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  audioChunksRef: React.MutableRefObject<Blob[]>,
  setErrorMessage: (message: string | null) => void
): Promise<boolean> {
  try {
    // Get microphone access (legacy fallback)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Define potential MIME types
    const potentialTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
    ];
    
    // Filter to find supported types
    const supportedTypes = potentialTypes.filter(type => MediaRecorder.isTypeSupported(type));
    console.log('Supported recording MIME types:', supportedTypes);
    
    // Set MediaRecorder options
    const options: MediaRecorderOptions = {};
    
    if (supportedTypes.length > 0) {
      options.mimeType = supportedTypes[0];
      console.log(`Using supported MIME type: ${options.mimeType}`);
    }
    
    mediaRecorderRef.current = new MediaRecorder(stream, options);
    audioChunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (event: { data: Blob }) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorderRef.current.onstop = () => {
      // When recording stops, we keep the audio chunks for processing
    };
    
    return true;
  } catch (error) {
    console.error('Error accessing microphone:', error);
    setErrorMessage(`Error accessing microphone: ${error}`);
    return false;
  }
}

/**
 * Enhanced version that supports both microphone and system audio capture
 */
export async function initializeEnhancedMediaRecorder(
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  audioChunksRef: React.MutableRefObject<Blob[]>,
  setErrorMessage: (message: string | null) => void,
  preferredSource?: AudioSourceType
): Promise<{ success: boolean; sourceType: AudioSourceType; displayInfo?: any; mimeType?: string }> {
  try {
    let stream: MediaStream;
    let sourceType = AudioSourceType.MICROPHONE;
    let displayInfo = null;
    
    // Try to capture system audio if requested or supported
    if (preferredSource === AudioSourceType.SYSTEM_AUDIO) {
      try {
        console.log('🔊 Attempting to capture system audio via screen share...');
        
        // Request screen share with audio
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true, // Required for screen share
          audio: true  // Request system audio
        });
        
        const audioTracks = displayStream.getAudioTracks();
        const videoTracks = displayStream.getVideoTracks();
        
        if (audioTracks.length === 0) {
          // No audio captured, clean up video and fall back
          videoTracks.forEach(track => track.stop());
          throw new Error('No audio captured from screen share');
        }
        
        console.log(`✅ Captured ${audioTracks.length} audio track(s) for meeting audio`);
        
        // Create audio-only stream
        stream = new MediaStream();
        audioTracks.forEach(track => stream.addTrack(track));
        
        // Stop video tracks since we only need audio
        videoTracks.forEach(track => track.stop());
        
        sourceType = AudioSourceType.SYSTEM_AUDIO;
        displayInfo = { isScreenShare: true };
        
      } catch (error) {
        console.warn('⚠️ System audio capture failed, falling back to microphone:', error);
        setErrorMessage(`Meeting audio capture failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using microphone instead.`);
        
        // Fall back to microphone
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } else {
      // Default microphone capture
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    
    // Define potential MIME types
    const potentialTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
    ];
    
    const supportedTypes = potentialTypes.filter(type => MediaRecorder.isTypeSupported(type));
    console.log('Supported recording MIME types:', supportedTypes);
    
    const options: MediaRecorderOptions = {};
    let selectedMimeType = 'audio/webm'; // Default fallback
    
    if (supportedTypes.length > 0) {
      selectedMimeType = supportedTypes[0];
      options.mimeType = selectedMimeType;
      console.log(`Using MIME type: ${selectedMimeType}`);
    } else {
      console.warn('No supported MIME types found, using browser default');
    }
    
    mediaRecorderRef.current = new MediaRecorder(stream, options);
    audioChunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (event: { data: Blob }) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    return { success: true, sourceType, displayInfo, mimeType: selectedMimeType };
  } catch (error) {
    console.error('Enhanced media recorder initialization failed:', error);
    setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize audio capture');
    return { success: false, sourceType: AudioSourceType.MICROPHONE };
  }
}

/**
 * Initialize MediaRecorder with a provided stream (for AudioCaptain integration)
 * This allows external stream providers (like AudioCaptain) to provide audio streams
 */
export async function initializeMediaRecorderWithStream(
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  audioChunksRef: React.MutableRefObject<Blob[]>,
  setErrorMessage: (message: string | null) => void,
  audioStream: MediaStream
): Promise<{ success: boolean; mimeType: string }> {
  try {
    console.log('🎯 Initializing MediaRecorder with provided stream:', {
      tracks: audioStream.getTracks().length,
      audioTracks: audioStream.getAudioTracks().length
    });

    // Define potential MIME types
    const potentialTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
    ];
    
    const supportedTypes = potentialTypes.filter(type => MediaRecorder.isTypeSupported(type));
    console.log('🎯 Supported recording MIME types:', supportedTypes);
    
    const options: MediaRecorderOptions = {};
    let selectedMimeType = 'audio/webm'; // Default fallback
    
    if (supportedTypes.length > 0) {
      selectedMimeType = supportedTypes[0];
      options.mimeType = selectedMimeType;
      console.log(`🎯 Using MIME type: ${selectedMimeType}`);
    } else {
      console.warn('🎯 No supported MIME types found, using browser default');
    }
    
    // Create MediaRecorder with provided stream
    mediaRecorderRef.current = new MediaRecorder(audioStream, options);
    audioChunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (event: { data: Blob }) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
        console.log('🎯 MediaRecorder chunk received:', event.data.size, 'bytes');
      }
    };
    
    console.log('✅ MediaRecorder initialized successfully with provided stream');
    return { success: true, mimeType: selectedMimeType };
    
  } catch (error) {
    console.error('❌ Failed to initialize MediaRecorder with provided stream:', error);
    setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize audio recording');
    return { success: false, mimeType: 'audio/webm' };
  }
}
