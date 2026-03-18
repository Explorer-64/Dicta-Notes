import { useEffect, useRef, useState, useCallback } from 'react';
import { useCustomVAD } from 'utils/useCustomVAD';
import brain from 'brain';

interface UseCustomVADWithLanguageDetectionProps {
  onSpeechEnd: (audioBlob: Blob, detectedLanguage?: string | null) => void;
  onSpeechStart?: () => void;
  isRecording: boolean;
  audioStream?: MediaStream | null; // VAD stream for speech detection
  languageDetectionStream?: MediaStream | null; // Separate stream for language detection
  silenceThreshold?: number;
  volumeThreshold?: number;
  minDuration?: number;
  // NEW: Control overlap for API compatibility
  disableOverlap?: boolean;
}

/**
 * Custom hook that combines CustomVAD with language detection capabilities
 * SIMPLIFIED: Stable hook structure to prevent React hook order violations
 */
export function useCustomVADWithLanguageDetection({
  onSpeechEnd,
  onSpeechStart,
  isRecording,
  audioStream,
  languageDetectionStream,
  silenceThreshold = 350,
  volumeThreshold = 0.02,
  minDuration = 500,
  disableOverlap = false // NEW: Pass through overlap control
}: UseCustomVADWithLanguageDetectionProps) {
  // Simple, stable state - no conditional hooks
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // Simple refs - always declared in same order
  const languageDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Simple VAD callback that passes detected language
  const handleSpeechEnd = useCallback((audioBlob: Blob) => {
    console.log(`🎵 VAD Speech ended - using detected language: ${detectedLanguage}`);
    onSpeechEnd(audioBlob, detectedLanguage);
  }, [onSpeechEnd, detectedLanguage]);
  
  // Use existing CustomVAD hook (proven stable)
  const vadResult = useCustomVAD({
    onSpeechEnd: handleSpeechEnd,
    onSpeechStart,
    isRecording,
    externalStream: audioStream, // FIX: Use correct parameter name
    silenceThreshold,
    volumeThreshold,
    minDuration,
    disableOverlap // NEW: Pass through overlap control to VAD
  });
  
  // Simple language detection effect - no complex parallel processing
  useEffect(() => {
    if (!languageDetectionStream || !isRecording) {
      // Clear any existing detection
      if (languageDetectionTimeoutRef.current) {
        clearTimeout(languageDetectionTimeoutRef.current);
        languageDetectionTimeoutRef.current = null;
      }
      setIsDetecting(false);
      return;
    }

    // Simple delayed language detection - once per recording session
    languageDetectionTimeoutRef.current = setTimeout(async () => {
      try {
        setIsDetecting(true);
        console.log('🌍 Starting simple language detection...');
        
        // Implement language detection using MicVADTest pattern
        const mediaRecorder = new MediaRecorder(languageDetectionStream, {
          mimeType: 'audio/webm'
        });
        
        const audioChunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          try {
            if (audioChunks.length === 0) {
              console.log('🌍 No audio chunks for language detection');
              setDetectedLanguage(null);
              return;
            }
            
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            console.log(`🌍 Calling detect_language API with ${audioBlob.size} bytes`);
            
            // Create File object for API call (same as MicVADTest)
            const audioFile = new File([audioBlob], 'language-sample.webm', { type: 'audio/webm' });
            
            // Call language detection API
            const response = await brain.detect_language({ audio_file: audioFile });
            
            if (response.ok) {
              const result = await response.text();
              const cleanedResult = result.trim();
              
              if (cleanedResult) {
                console.log(`🌍 Language detected: ${cleanedResult}`);
                setDetectedLanguage(cleanedResult);
              } else {
                console.log('🌍 No language detected from API');
                setDetectedLanguage(null);
              }
            } else {
              console.warn('🌍 Language detection API failed:', response.status);
              setDetectedLanguage(null);
            }
          } catch (error) {
            console.error('🌍 Language detection processing error:', error);
            setDetectedLanguage(null);
          }
        };
        
        // Record 3-second sample for language detection
        console.log('🌍 Starting 3-second audio sample for language detection');
        mediaRecorder.start();
        
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            console.log('🌍 Stopping language detection recording');
            mediaRecorder.stop();
          }
        }, 3000);
        
        console.log('🌍 Language detection setup completed');
      } catch (error) {
        console.error('🌍 Language detection error:', error);
        setDetectedLanguage(null);
      } finally {
        setIsDetecting(false);
      }
    }, 2000); // Simple 2-second delay

    // Cleanup on unmount or deps change
    return () => {
      if (languageDetectionTimeoutRef.current) {
        clearTimeout(languageDetectionTimeoutRef.current);
        languageDetectionTimeoutRef.current = null;
      }
    };
  }, [languageDetectionStream, isRecording]);
  
  // Return stable interface - same as original VAD plus language info
  return {
    ...vadResult,
    detectedLanguage,
    isDetectingLanguage: isDetecting
  };
}

export default useCustomVADWithLanguageDetection;
