import { useState, useCallback } from 'react';

/**
 * Hook to coordinate dual recording systems:
 * - Traditional LiveTranscription (microphone-based)
 * - GeminiLivePanel (Gemini 2.5 Flash Live API)
 */
export function useDualRecordingCoordinator() {
  const [isTraditionalRecording, setIsTraditionalRecording] = useState(false);
  const [isGeminiRecording, setIsGeminiRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  
  // Overall recording state - true if either system is recording
  const isAnyRecording = isTraditionalRecording || isGeminiRecording;
  
  // Start both recording systems
  const startBothRecordings = useCallback(() => {
    setRecordingStartTime(new Date());
    console.log('🎯 Coordinator: Starting dual recording systems');
    return {
      startTraditional: () => setIsTraditionalRecording(true),
      startGemini: () => setIsGeminiRecording(true)
    };
  }, []);
  
  // Stop both recording systems
  const stopBothRecordings = useCallback(() => {
    console.log('🎯 Coordinator: Stopping dual recording systems');
    setIsTraditionalRecording(false);
    setIsGeminiRecording(false);
    setRecordingStartTime(null);
  }, []);
  
  // Individual system callbacks
  const handleTraditionalStart = useCallback(() => {
    setIsTraditionalRecording(true);
    console.log('🎯 Traditional recording started');
  }, []);
  
  const handleTraditionalStop = useCallback(() => {
    setIsTraditionalRecording(false);
    console.log('🎯 Traditional recording stopped');
  }, []);
  
  const handleGeminiStart = useCallback(() => {
    setIsGeminiRecording(true);
    console.log('🎯 Gemini Live recording started');
  }, []);
  
  const handleGeminiStop = useCallback(() => {
    setIsGeminiRecording(false);
    console.log('🎯 Gemini Live recording stopped');
  }, []);
  
  return {
    // State
    isTraditionalRecording,
    isGeminiRecording,
    isAnyRecording,
    recordingStartTime,
    
    // Coordination functions
    startBothRecordings,
    stopBothRecordings,
    
    // Individual system callbacks
    handleTraditionalStart,
    handleTraditionalStop,
    handleGeminiStart,
    handleGeminiStop
  };
}
