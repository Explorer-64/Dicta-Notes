import { useEffect, useRef, useState, useCallback } from 'react';
import { useCustomVAD } from 'utils/useCustomVAD';
import brain from 'brain';

interface CustomVADWithLanguageDetectionProps {
  onSpeechEnd: (audioBlob: Blob, detectedLanguage?: string | null) => void;
  onSpeechStart?: () => void;
  isRecording: boolean;
  audioStream?: MediaStream | null;
}

/**
 * Component that combines CustomVAD with language detection capabilities
 * Designed specifically for GeminiLive to maintain CustomVAD while adding language detection
 */
export function CustomVADWithLanguageDetection({
  onSpeechEnd,
  onSpeechStart,
  isRecording,
  audioStream
}: CustomVADWithLanguageDetectionProps) {
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isLanguageDetectionActiveRef = useRef(false);
  
  // Language detection with 1.5 second sampling when speech activity detected
  const detectLanguageFromStream = useCallback(async () => {
    if (!audioStream || isLanguageDetectionActiveRef.current) return;
    
    console.log('🌍 Starting language detection sampling...');
    setIsDetectingLanguage(true);
    isLanguageDetectionActiveRef.current = true;
    
    try {
      // Record 1.5 seconds of audio for language detection
      const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
      const audioChunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      const detectionPromise = new Promise<string | null>((resolve) => {
        recorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Create proper File object for API call (brain.detect_language expects File, not base64)
            const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
            
            // Call language detection API with File object
            const response = await brain.detect_language({ audio_file: audioFile });
            
            if (response.ok) {
              const result = await response.text(); // API returns text, not JSON
              const cleanedResult = result.trim();
              
              if (cleanedResult) {
                console.log(`🌍 Language detected: ${cleanedResult}`);
                resolve(cleanedResult);
              } else {
                console.log('🌍 No language detected in sample');
                resolve(null);
              }
            } else {
              console.warn('🌍 Language detection API failed:', response.status);
              resolve(null);
            }
          } catch (error) {
            console.error('🌍 Language detection error:', error);
            resolve(null);
          }
        };
      });
      
      recorder.start();
      
      // Stop recording after 1.5 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 1500);
      
      const language = await detectionPromise;
      setDetectedLanguage(language);
      
    } catch (error) {
      console.error('🌍 Language detection setup error:', error);
    } finally {
      setIsDetectingLanguage(false);
      isLanguageDetectionActiveRef.current = false;
    }
  }, [audioStream]);
  
  // Trigger language detection on first speech activity
  const handleSpeechStart = useCallback(() => {
    onSpeechStart?.();
    
    // Only detect language once per session or when language is unknown
    if (!detectedLanguage && !isDetectingLanguage) {
      detectLanguageFromStream();
    }
  }, [detectLanguageFromStream, detectedLanguage, isDetectingLanguage, onSpeechStart]);
  
  // Pass detected language along with audio blob
  const handleSpeechEnd = useCallback((audioBlob: Blob) => {
    onSpeechEnd(audioBlob, detectedLanguage);
  }, [onSpeechEnd, detectedLanguage]);
  
  // Initialize CustomVAD with our callbacks
  const vadInstance = useCustomVAD({
    onSpeechStart: handleSpeechStart,
    onSpeechEnd: handleSpeechEnd,
    isRecording,
    audioStream,
    // Optimal settings from existing GeminiLive
    silenceThreshold: 350, // ms of silence before stopping
    volumeThreshold: 0.005, // Volume threshold for speech detection - lowered to capture quieter speech
  });
  
  // Cleanup audio context when component unmounts
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Expose VAD instance and language state for debugging
  return {
    vadInstance,
    detectedLanguage,
    isDetectingLanguage
  };
}

export default CustomVADWithLanguageDetection;
