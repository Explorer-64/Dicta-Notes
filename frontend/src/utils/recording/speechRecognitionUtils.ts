import { isMobileDevice, isAndroidDevice, isIOSDevice } from '../deviceDetection';
import { getSpeechRecognition } from '../transcriptionUtils';
import { generateSegmentId, TranscriptSegment, mergeSegmentsToText } from '../persistentTranscriptionUtils';
import { saveBrowserSpeechData } from '../browserSpeechStorage';
import { updateTranscriptWithSpeakerNames } from '../transcriptionHelpers';
import { toast } from 'sonner';
import { shouldDisableBrowserSpeech } from './browserSpeechConfig';

interface SpeechRecognitionOptions {
  activeSpeakerIndex: number;
  participants: string[];
  recordingTime: number;
  sessionId: string | null;
  isRecording: boolean;
  isPaused: boolean;
  onTranscriptUpdate?: (transcript: string) => void;
  setBrowserSegments: (segments: TranscriptSegment[] | ((prev: TranscriptSegment[]) => TranscriptSegment[])) => void;
  setInterimSegment: (segment: TranscriptSegment | null) => void;
  setTranscript: (text: string) => void;
  setInterimText: (text: string) => void;
  setErrorMessage: (message: string | null) => void;
  transcriptRef: React.MutableRefObject<string>;
  browserSegments: TranscriptSegment[];
  onPauseRecording?: () => Promise<void>;
  onResumeRecording?: () => Promise<void>;
  // NEW: Callbacks to get current state (not captured values)
  getIsRecording?: () => boolean;
  getIsPaused?: () => boolean;
}

export function initializeSpeechRecognition(
  recognitionRef: React.MutableRefObject<any>,
  options: SpeechRecognitionOptions
): boolean {
  // Check if browser speech is globally disabled (e.g., for System Audio mode)
  if (shouldDisableBrowserSpeech()) {
    console.log('🚫 Browser speech recognition is disabled - skipping initialization');
    return true; // Return true to not block recording
  }
  
  const isMobile = isMobileDevice();
  if (isMobile) {
    console.log('Mobile device detected, applying specialized configuration for Web Speech API');
    if (isAndroidDevice()) {
      console.log('Android device detected, applying Android-specific optimizations');
    } else if (isIOSDevice()) {
      console.log('iOS device detected, applying iOS-specific optimizations');
    }
  }
  
  try {
    const SpeechRecognition = getSpeechRecognition();
    
    if (!SpeechRecognition) {
      const errorMsg = 'Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.';
      console.error(errorMsg);
      options.setErrorMessage(errorMsg);
      toast.error(errorMsg);
      return false;
    }
    
    console.log('Initializing Speech Recognition...');
    recognitionRef.current = new SpeechRecognition();
    
    // Configure the recognition - mobile-friendly settings
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    if (isMobile) {
      recognitionRef.current.maxAlternatives = 1;
      console.log('Applied mobile-optimized speech recognition settings');
    }
    
    // Set up event handlers
    recognitionRef.current.onresult = (event: any) => {
      handleSpeechRecognitionResult(event, options);
    };
    
    recognitionRef.current.onerror = (event: { error: string }) => {
      handleSpeechRecognitionError(event, options, recognitionRef);
    };
    
    // Handle automatic stops (silence timeouts, etc.)
    recognitionRef.current.onend = () => {
      console.log('🔄 Speech recognition ended, checking if should restart...');
      
      // Only restart if we're still recording and not paused
      if (options.getIsRecording?.() && !options.getIsPaused?.()) {
        console.log('✅ Auto-restarting speech recognition');
        try {
          recognitionRef.current?.start();
        } catch (error) {
          // Ignore 'already started' errors
          if (error instanceof Error && !error.message.includes('already started')) {
            console.error('Error auto-restarting speech recognition:', error);
          }
        }
      } else {
        console.log('⏹️ Not restarting - recording stopped or paused');
      }
    };
    
    return true;
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    options.setErrorMessage(`Error initializing speech recognition: ${error}`);
    return false;
  }
}

function handleSpeechRecognitionResult(event: any, options: SpeechRecognitionOptions) {
  let currentFinalTranscriptFromEvent = '';
  let currentInterimTranscriptFromEvent = '';

  console.log(`SpeechRecognition result event: resultIndex=${event.resultIndex}, results length=${event.results.length}`);
  
  for (let i = event.resultIndex; i < event.results.length; ++i) {
    if (event.results[i].isFinal) {
      console.log(`Final result at index ${i}: "${event.results[i][0].transcript}"`);
      currentFinalTranscriptFromEvent += event.results[i][0].transcript + ' ';
    } else {
      console.log(`Interim result at index ${i}: "${event.results[i][0].transcript}"`);
      currentInterimTranscriptFromEvent += event.results[i][0].transcript;
    }
  }
  
  const speakerId = options.participants.length > 0 
    ? `speaker_${(options.activeSpeakerIndex % options.participants.length) + 1}`
    : `speaker_1`;

  if (currentFinalTranscriptFromEvent.trim()) {
    const newSegment: TranscriptSegment = {
      text: currentFinalTranscriptFromEvent.trim(),
      speakerName: 'Speaker',
      speakerId: speakerId,
      timestamp: options.recordingTime,
      isFinal: true,
      segmentId: generateSegmentId()
    };
    
    options.setBrowserSegments((prevSegments: TranscriptSegment[]) => [...prevSegments, newSegment]);
    options.setInterimSegment(null);
    // NEW: Notify UI that the interim line should be finalized/cleared immediately (V2 behavior)
    finalizeCurrentInterimLine();
    
    if (options.sessionId) {
      console.log(`BROWSER SEGMENT: Should be sent to backend for session ${options.sessionId}:`, newSegment.text);
      // TODO: Send to backend endpoint instead of direct Firestore save
    }
  }

  if (currentInterimTranscriptFromEvent.trim()) {
    const newInterimSegment: TranscriptSegment = {
      text: currentInterimTranscriptFromEvent.trim(),
      speakerName: 'Speaker',
      speakerId: speakerId,
      timestamp: options.recordingTime,
      isFinal: false,
      segmentId: 'interim_' + Date.now()
    };
    options.setInterimSegment(newInterimSegment);
  } else if (!currentFinalTranscriptFromEvent.trim()) {
    options.setInterimSegment(null);
  }
  
  // Construct display transcript
  const finalTranscript = mergeSegmentsToText(options.browserSegments);
  const interimTranscript = currentInterimTranscriptFromEvent;
  const displayText = (finalTranscript ? finalTranscript + ' ' : '') + interimTranscript;
  const finalDisplayText = updateTranscriptWithSpeakerNames(displayText, options.participants);
  
  options.setTranscript(finalDisplayText);
  options.transcriptRef.current = finalDisplayText;

  if (options.onTranscriptUpdate) {
    options.onTranscriptUpdate(finalDisplayText);
  }
  
  // Handle interim text display
  if (interimTranscript.trim()) {
    options.setInterimText(interimTranscript);
    updateInterimDisplay(interimTranscript);
  } else {
    options.setInterimText('');
    // Do NOT hide the interim display on silence; keep last interim text visible
    // Instead, mark the current line as finalized so the next talk appends a new line
    finalizeCurrentInterimLine();
    // hideInterimDisplay();
  }
}

function handleSpeechRecognitionError(
  event: { error: string },
  options: SpeechRecognitionOptions,
  recognitionRef: React.MutableRefObject<any>
) {
  console.error('Speech recognition error:', event.error);
  
  const isMobile = isMobileDevice();
  
  if (event.error === 'no-speech') {
    console.log('No speech detected, but continuing...');
    // ✅ NEW: Use pause/resume instead of stop/restart to preserve data
    if (isMobile && options.isRecording && !options.isPaused && options.onPauseRecording && options.onResumeRecording) {
      console.log('🔄 Auto-recovery: Using pause/resume pattern instead of restart');
      setTimeout(async () => {
        try {
          if (options.isRecording && !options.isPaused) {
            console.log('⏸️ Auto-pausing recording for no-speech recovery...');
            await options.onPauseRecording!();
            
            // Auto-resume after brief delay
            setTimeout(async () => {
              try {
                console.log('▶️ Auto-resuming recording after no-speech recovery...');
                await options.onResumeRecording!();
                toast.success('Recording auto-resumed after brief pause');
              } catch (resumeError) {
                console.error('Failed to auto-resume after no-speech error:', resumeError);
                toast.warning('Speech recognition paused. Audio still recording for later processing.');
              }
            }, 1000); // Slightly longer delay for recovery
          }
        } catch (pauseError) {
          console.error('Error pausing recording for recovery:', pauseError);
        }
      }, 500);
      return;
    }
  } else if (event.error === 'network') {
    toast.error('Network error with speech recognition. Try again.');
  } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
    options.setErrorMessage('Microphone permission denied. Please enable microphone access.');
  } else if (event.error === 'aborted') {
    console.log('Speech recognition aborted. This is normal when stopping.');
  } else {
    // ✅ NEW: Use pause/resume for general errors too
    if (isMobile && options.isRecording && !options.isPaused && options.onPauseRecording && options.onResumeRecording) {
      console.log(`🔄 Auto-recovery: Handling ${event.error} with pause/resume pattern`);
      setTimeout(async () => {
        try {
          console.log('⏸️ Auto-pausing recording for general error recovery...');
          await options.onPauseRecording!();
          
          // Auto-resume after longer delay for general errors
          setTimeout(async () => {
            try {
              console.log('▶️ Auto-resuming recording after general error recovery...');
              await options.onResumeRecording!();
              toast.info(`Recording auto-resumed after ${event.error} error`);
            } catch (resumeError) {
              console.error('Failed to auto-resume after general error:', resumeError);
              options.setErrorMessage(`Could not resume after error: ${resumeError}`);
            }
          }, 2000); // Longer delay for general errors
        } catch (pauseError) {
          console.error('Error while attempting pause/resume recovery:', pauseError);
          options.setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      }, 300);
    } else {
      options.setErrorMessage(`Speech recognition error: ${event.error}`);
    }
  }
}

function ensureInterimContainer(): HTMLElement {
  let container = document.getElementById('interim-transcript');
  if (!container) {
    container = document.createElement('div');
    container.id = 'interim-transcript';
    // Keep the same visual style as before
    container.className = '';
    const transcriptContainer = document.querySelector('.transcript-container');
    if (transcriptContainer) {
      transcriptContainer.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }
  container.style.display = 'block';
  return container as HTMLElement;
}

// Global callback for interim text updates (for React components to capture interim text)
let interimTextCallback: ((text: string) => void) | null = null;
let interimFinalizeCallback: (() => void) | null = null;
let interimClearCallback: (() => void) | null = null;

// Function to register a callback for interim text updates
export function setInterimTextCallback(callback: ((text: string) => void) | null) {
  interimTextCallback = callback;
}

// Function to register a callback for when interim text gets finalized
export function setInterimFinalizeCallback(callback: (() => void) | null) {
  interimFinalizeCallback = callback;
}

// Function to register a callback for when interim display is cleared
export function setInterimClearCallback(callback: (() => void) | null) {
  interimClearCallback = callback;
}

function updateInterimDisplay(interimTranscript: string) {
  const isMobile = isMobileDevice();
  const container = ensureInterimContainer();

  // Find current line, create if missing
  let currentLine = container.querySelector('.interim-line-current') as HTMLElement | null;
  if (!currentLine) {
    currentLine = document.createElement('div');
    currentLine.className = 'interim-line interim-line-current text-sm font-medium text-gray-500 italic';
    container.appendChild(currentLine);
  }

  currentLine.textContent = `Speaker: ${interimTranscript}`;

  // NEW: Call the callback if one is registered
  if (interimTextCallback) {
    interimTextCallback(interimTranscript);
  }

  if (isMobile) {
    currentLine.style.opacity = '0.99';
    setTimeout(() => {
      if (currentLine) currentLine.style.opacity = '1';
    }, 10);
  }
}

function finalizeCurrentInterimLine() {
  const container = document.getElementById('interim-transcript');
  if (!container) return;
  const currentLine = container.querySelector('.interim-line-current') as HTMLElement | null;
  if (currentLine) {
    currentLine.classList.remove('interim-line-current');
    
    // NEW: Call finalize callback
    if (interimFinalizeCallback) {
      interimFinalizeCallback();
    }
  }
}

function hideInterimDisplay() {
  const displayElement = document.getElementById('interim-transcript');
  if (displayElement) {
    displayElement.textContent = '';
    displayElement.style.display = 'none';
    
    // NEW: Call clear callback
    if (interimClearCallback) {
      interimClearCallback();
    }
  }
}

// New: public helper to clear interim UI from any page
export function clearInterimTranscriptUI() {
  const container = document.getElementById('interim-transcript');
  if (!container) return;
  container.innerHTML = '';
  container.style.display = 'none';
  
  // NEW: Call clear callback to notify React components
  if (interimClearCallback) {
    interimClearCallback();
  }
}
