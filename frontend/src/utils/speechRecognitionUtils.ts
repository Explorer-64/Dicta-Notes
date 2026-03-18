// Type definitions for Web Speech API
export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    isFinal: boolean;
    [index: number]: { transcript: string };
    length: number;
  }[];
}

export interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

// Declare global types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Checks if the Web Speech API is available in the current browser
 */
export function isSpeechRecognitionAvailable(): boolean {
  // Add enhanced logging to debug the issue
  const hasSpeechRecognition = !!window.SpeechRecognition;
  const hasWebkitSpeechRecognition = !!window.webkitSpeechRecognition;
  
  console.log('SpeechRecognition available check:', { 
    SpeechRecognition: hasSpeechRecognition, 
    webkitSpeechRecognition: hasWebkitSpeechRecognition,
    userAgent: navigator.userAgent,
    mobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    android: /Android/i.test(navigator.userAgent)
  });
  
  return !!(hasSpeechRecognition || hasWebkitSpeechRecognition);
}

/**
 * Gets the appropriate SpeechRecognition constructor for the current browser
 */
export function getSpeechRecognition(): any {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  // Enhanced logging for mobile debugging
  const isAndroid = /Android/i.test(navigator.userAgent);
  const constructorName = SpeechRecognition ? (SpeechRecognition.name || 'unknown') : 'not available';
  
  console.log('Getting SpeechRecognition constructor:', {
    constructor: constructorName,
    isAndroid,
    userAgent: navigator.userAgent
  });
  
  if (!SpeechRecognition) {
    console.error('SpeechRecognition constructor not available on this device/browser');
  }
  
  return SpeechRecognition;
}

/**
 * Creates and configures a speech recognition instance
 * @param options Configuration options for speech recognition
 */
export function createSpeechRecognition(options: {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (event: SpeechRecognitionEvent) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}): SpeechRecognitionInstance | null {
  if (!isSpeechRecognitionAvailable()) {
    console.error("Speech recognition is not supported in this browser");
    return null;
  }
  
  try {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      console.error('SpeechRecognition constructor is not available');
      return null;
    }
    console.log('Creating new SpeechRecognition instance');
    const recognition = new SpeechRecognition();
    
    // Configure the recognition
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.lang ?? 'en-US';
    
    // Set up event handlers
    if (options.onResult) {
      recognition.onresult = options.onResult;
    }
    
    if (options.onError) {
      recognition.onerror = (event: { error: string }) => {
        options.onError?.(event.error);
      };
    }
    
    if (options.onEnd) {
      recognition.onend = options.onEnd;
    }
    
    return recognition;
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    return null;
  }
}

/**
 * Format a transcript segment with speaker identification
 * @param text The transcribed text
 * @param speaker The speaker name
 * @param timestamp Optional timestamp for the segment
 */
export function formatTranscriptSegment(text: string, speaker: string, timestamp?: string): string {
  if (!text.trim()) return "";
  
  // Add timestamp if provided
  const timestampPrefix = timestamp ? `[${timestamp}] ` : "";
  
  // Return formatted segment
  return `\n${speaker}: ${timestampPrefix}${text}\n`;
}

/**
 * Format interim transcript with speaker name
 */
export function formatInterimTranscript(text: string, speakerName: string): string {
  if (!text) return '';
  return `${speakerName} (typing...): ${text}`;
}

/**
 * Format final transcript segment with timestamp and speaker
 */
export function formatFinalTranscript(
  text: string, 
  speakerName: string, 
  timestamp: string
): string {
  if (!text) return '';
  return `\n${timestamp} ${speakerName}: ${text}\n\n`;
}

/**
 * Extract potential speaker names from transcript
 * @param transcript Full transcript text
 */
export function extractSpeakersFromTranscript(transcript: string): string[] {
  if (!transcript) return [];
  
  // This regex looks for speaker patterns like "Speaker 1:", "John:" at the start of lines
  const speakerPattern = /^([^:\n]+):/gm;
  const speakers = new Set<string>();
  
  let match;
  while ((match = speakerPattern.exec(transcript)) !== null) {
    speakers.add(match[1].trim());
  }
  
  return Array.from(speakers);
}

/**
 * Attempt to restart speech recognition after error
 * @param recognition Speech recognition instance
 * @param delay Delay in ms before attempting restart
 */
export function restartRecognitionAfterError(recognition: SpeechRecognitionInstance, delay = 1000): void {
  // Double the delay for Android devices which may need more time to reset
  const isAndroid = /Android/i.test(navigator.userAgent);
  const actualDelay = isAndroid ? delay * 2 : delay;
  
  console.log(`Attempting to restart speech recognition after error, delay: ${actualDelay}ms, isAndroid: ${isAndroid}`);
  
  setTimeout(() => {
    try {
      // Try to stop recognition first
      try {
        recognition.stop();
        console.log('Successfully stopped speech recognition before restart');
      } catch (stopError) {
        console.warn('Error stopping recognition before restart (may be normal):', stopError);
      }
      
      // Wait a bit longer before starting on Android
      setTimeout(() => {
        try {
          recognition.start();
          console.log('Successfully restarted speech recognition after error');
        } catch (startError) {
          console.error('Failed to restart speech recognition:', startError);
          
          // On serious errors, try one more time with a fresh recognition instance
          if (isAndroid) {
            console.log('Android device detected, attempting to create a fresh recognition instance');
            try {
              const SpeechRecognition = getSpeechRecognition();
              if (SpeechRecognition) {
                const newRecognition = new SpeechRecognition();
                // Copy over event handlers and properties
                newRecognition.continuous = recognition.continuous;
                newRecognition.interimResults = recognition.interimResults;
                newRecognition.lang = recognition.lang;
                newRecognition.onresult = recognition.onresult;
                newRecognition.onerror = recognition.onerror;
                newRecognition.onend = recognition.onend;
                
                // Try starting the new instance
                setTimeout(() => {
                  try {
                    newRecognition.start();
                    console.log('Started fresh recognition instance after error');
                    
                    // Replace the old instance (implementation depends on your architecture)
                    // This would need to be handled at a higher level
                  } catch (freshError) {
                    console.error('Failed to start fresh recognition instance:', freshError);
                  }
                }, actualDelay);
              }
            } catch (recreateError) {
              console.error('Failed to create fresh recognition instance:', recreateError);
            }
          }
        }
      }, isAndroid ? actualDelay : actualDelay / 2);
    } catch (error) {
      console.error('Unexpected error during recognition restart process:', error);
    }
  }, actualDelay);
}

/**
 * Initialize speech recognition with transcript processing for LiveTranscription component
 * @param options Configuration options including callbacks
 */
export function initSpeechRecognitionForTranscription(options: {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult: (result: { interimTranscript: string; finalTranscript: string | null }) => void;
  onError: (error: string) => void;
  recordingTime: number;
  activeSpeakerIndex: number;
  participants: string[];
  transcriptionMode: string;
}): SpeechRecognitionInstance | null {
  if (!isSpeechRecognitionAvailable()) {
    console.error("Speech recognition is not supported in your browser. Try Chrome or Edge.");
    return null;
  }
  
  try {
    return createSpeechRecognition({
      continuous: options.continuous ?? true,
      interimResults: options.interimResults ?? true,
      lang: options.lang ?? 'en-US',
      onResult: (event: any) => {
        // Get current speaker
        const currentSpeaker = options.participants.length > 0 ? 
          options.participants[options.activeSpeakerIndex < options.participants.length ? 
            options.activeSpeakerIndex : 0] : 
          "Speaker 1";
        
        let interimTranscript = '';
        let finalTranscript = null;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          
          if (result.isFinal) {
            // Format with timestamp and speaker for final result
            finalTranscript = formatFinalTranscript(
              transcriptText, 
              currentSpeaker, 
              formatTimestamp(options.recordingTime)
            );
          } else {
            interimTranscript += transcriptText;
          }
        }
        
        // Pass the processed result to callback
        options.onResult({
          interimTranscript,
          finalTranscript
        });
      },
      onError: options.onError
    });
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    return null;
  }
}

// Utility for formatting timestamps
function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
