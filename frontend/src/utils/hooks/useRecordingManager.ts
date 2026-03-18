import { useEffect, useState, useCallback, useRef } from 'react';
import { useRecordingState, useRecordingRefs } from '../recording/recordingState';
import { useCustomVAD } from '../vad/useCustomVAD';
import { blobToBase64 } from '../transcriptionUtils';
import { useRecordingTimer, RecordingTimerService } from '../recording/RecordingTimerService';
import { saveTranscriptionState } from '../transcriptionStorageUtils';
import { useWakeLock } from '../wakeLock';
import { useSessionStore } from 'utils/stores/sessionStore';
import brain from "brain";
import { TranscriptionRequest, TranscriptionResponse } from "types";
import { TranscriptSegment } from 'utils/types';
import { toast } from 'sonner';
import { dispatchTranscription } from '../apiDispatcher';
import { initializeSpeechRecognition, cleanupSpeechRecognition } from '../recording/speechRecognitionUtils';
import { trackSpeakerChange } from '../speakerTimelineUtils';
import { saveBrowserSpeechData, loadBrowserSpeechData, clearBrowserSpeechData } from '../browserSpeechStorage';
import { AudioSourceType } from '../recording/audioSourceTypes';
import { SpeakerChangeEvent } from '../speakerTimelineUtils';
import { initializeEnhancedMediaRecorder, initializeMediaRecorderWithStream } from '../recording/mediaRecorderUtils';
import { v4 as uuidv4 } from 'uuid';
import { SessionManager } from '../SessionManager';
import { loadVADModule } from '../lazyVAD';
import { useAudioSourceManager } from './useAudioSourceManager';
import { useCurrentUser } from 'app';
import { recordingTimer } from '../recording/RecordingTimerService';
import { mode, Mode } from 'app';
import { clearLocalBackup } from '../transcriptionHelpers';
import { saveAudioBlob, deleteAudioBlob } from '../recording/audioIndexedDB';

// Add new interface for session saved modal data
interface SessionSavedData {
  sessionId: string;
  sessionTitle: string;
}

export interface UseRecordingManagerProps {
  meetingTitle: string;
  meetingPurpose?: string;
  participants?: string[];
  onTranscriptUpdate?: (transcript: string) => void;
  onParticipantsUpdate?: (participants: string[]) => void;
  speakerTimeline?: any[];
  clientName?: string;
  projectName?: string;
  tags?: string[];
  languagePreference?: string; // Add language preference for fire-and-forget session saving
  externalSessionId?: string | null;
  preferredAudioSource?: AudioSourceType;
  enableGeminiLive?: boolean; // Add for exclusive mode control
  enableVAD?: boolean; // Add VAD feature flag
  vadStream?: MediaStream; // NEW: External VAD stream from Audio Captain
  architecture?: 'v1' | 'v2'; // Add architecture selector
}

export function useRecordingManager({
  meetingTitle,
  meetingPurpose = '',
  participants = [],
  onTranscriptUpdate,
  onParticipantsUpdate,
  speakerTimeline = [],
  clientName,
  projectName,
  tags = [],
  languagePreference, // Add language preference parameter
  externalSessionId,
  preferredAudioSource,
  enableGeminiLive = false,
  enableVAD = false,
  vadStream,
  architecture = 'v1' // NEW: Default to v1 for backward compatibility
}: UseRecordingManagerProps) {
  const { state, setState } = useRecordingState();
  const refs = useRecordingRefs();
  const [preservedOverrideStream, setPreservedOverrideStream] = useState<MediaStream | null>(null);
  const wakeLock = useWakeLock();
  
  // Create refs for state to ensure callbacks have fresh values
  const isRecordingRef = useRef(state.isRecording);
  const isPausedRef = useRef(state.isPaused);

  // Update refs whenever state changes
  useEffect(() => {
    isRecordingRef.current = state.isRecording;
  }, [state.isRecording]);

  useEffect(() => {
    isPausedRef.current = state.isPaused;
  }, [state.isPaused]);

  const { user } = useCurrentUser(); // Get user object internally
  const { sessionId, setSessionId } = useSessionStore(); // Use the session store

  // Memoize initializeAudioSource from useAudioSourceManager if not already (it is in the hook)
  const { actualMimeType, initializeAudioSource } = useAudioSourceManager({
    mediaRecorderRef: refs.mediaRecorderRef,
    audioChunksRef: refs.audioChunksRef,
    setErrorMessage: setState.setErrorMessage,
  });

  // Effect to sync external session ID with the store
  useEffect(() => {
    if (externalSessionId && externalSessionId !== sessionId) {
      setSessionId(externalSessionId);
    }
  }, [externalSessionId, setSessionId, sessionId]);

  // Enhanced Voice Activity Detection (VAD) state
  const [vadState, setVadState] = useState({
    isActive: false,
    error: null as string | null,
    instance: null as any | null
  });

  // NEW: Add session saved modal state
  const [sessionSavedData, setSessionSavedData] = useState<SessionSavedData | null>(null);

  // Remove duplicate timer subscription to prevent re-renders
  // recordingTimer is already used by UI components that need to display time

  // Create refs for resume/pause to handle circular dependencies in callbacks
  const pauseRecordingRef = useRef<() => Promise<void>>();
  const resumeRecordingRef = useRef<() => Promise<void>>();

  // VAD Enhancement Effects
  useEffect(() => {
    if (!enableVAD) return;
    
    // Initialize VAD when enabled
    let mounted = true;
    
    const initializeVAD = async () => {
      try {
        console.log('🎤 Initializing VAD enhancement...');
        
        // Load VAD module with lazy loading
        const { MicVAD } = await loadVADModule();
        
        if (!mounted) {
          console.log('Component unmounted during VAD loading');
          return;
        }
        
        // Create VAD instance with safe configuration
        const vadInstance = await MicVAD.new({
          // NEW: Use external VAD stream from Audio Captain if provided
          ...(vadStream && { stream: vadStream }),
          workletURL: "/vad.worklet.bundle.min.js",
          modelURL: "/silero_vad.onnx",
          ortConfig: (model) => {
            // Correctly configure WASM paths for ONNX Runtime
            model.wasm = {
              wasmPaths: "/",
            };
          },
          // Enhanced speech detection for better boundaries
          onSpeechStart: () => {
            if (mounted && state.isRecording && !state.isPaused) {
              console.log('🎤 VAD: Speech Start Detected', vadStream ? '(using Audio Captain stream)' : '(using own mic)');
            }
          },
          onSpeechEnd: (audio: Float32Array) => {
            if (mounted && state.isRecording && !state.isPaused) {
              const audioLength = audio ? audio.length : 'N/A';
              console.log(`🔇 VAD: Speech End Detected. Audio data length: ${audioLength}`, vadStream ? '(using Audio Captain stream)' : '(using own mic)');
              if (!audio || audio.length === 0) {
                console.warn('VAD: Speech ended but no audio data was received. This might indicate an issue with microphone levels or VAD sensitivity.');
              }
            }
          },
          onVADMisfire: () => {
            if (mounted) {
              console.log('⚠️ VAD: Misfire detected (noise/false positive). If this happens often, the environment might be too noisy.');
            }
          },
        });
        
        if (mounted) {
          setVadState({
            isActive: false,
            isAvailable: true,
            instance: vadInstance,
            error: null
          });
          console.log('✅ VAD enhancement initialized successfully');
        } else {
          // Component unmounted, cleanup immediately
          await vadInstance.pause();
        }
        
      } catch (error) {
        console.error('❌ VAD enhancement failed to initialize:', error);
        if (mounted) {
          setVadState({
            isActive: false,
            isAvailable: false,
            instance: null,
            error: error instanceof Error ? error.message : 'VAD initialization failed'
          });
        }
      }
    };
    
    initializeVAD();
    
    // Cleanup function
    return () => {
      mounted = false;
      setVadState(prev => {
        if (prev.instance && typeof prev.instance.pause === 'function') {
          console.log('🧹 Cleaning up VAD enhancement...');
          const pauseResult = prev.instance.pause();
          if (pauseResult && typeof pauseResult.catch === 'function') {
            pauseResult.catch((e: any) => console.warn('VAD cleanup warning:', e));
          }
        }
        return {
          isActive: false,
          isAvailable: false,
          instance: null,
          error: null
        };
      });
    };
  }, [enableVAD]); // Only re-run when VAD enable flag changes

  // Pause function - memoized
  const pauseRecording = useCallback(async () => {
    console.log('🔍 PAUSE: pauseRecording method called');
    if (!state.isRecording || state.isPaused) {
      return;
    }
    
    try {
      refs.recognitionRef.current?.stop();
      
      if (refs.mediaRecorderRef.current?.state === 'recording') {
        refs.mediaRecorderRef.current.pause();
      }
      
      // Only pause timer if running
      if (recordingTimer.isRunning()) {
        recordingTimer.pause();
      }
      
      setState.setIsPaused(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';

      // Process current segment if online
      if (refs.audioChunksRef.current.length > 0 && navigator.onLine) {
        // Note: processCurrentSegment logic would be implemented here
      }
      
      console.log('✅ PAUSE: pauseRecording completed');
    } catch (error) {
      console.error('❌ PAUSE: Error pausing recording:', error);
      setState.setErrorMessage(`Error pausing recording: ${error}`);
    }
  }, [state.isRecording, state.isPaused, refs, setState]);

  // Update ref
  useEffect(() => {
    pauseRecordingRef.current = pauseRecording;
  }, [pauseRecording]);

  // Resume function - memoized
  const resumeRecording = useCallback(async () => {
    console.log('🔍 RESUME: resumeRecording method called');
    
    if (!state.isRecording || !state.isPaused) {
      return;
    }
    
    try {
      setState.setOfflineMode(!navigator.onLine);
      
      // FIXED: If recognition ref is null, reinitialize it ONLY when Gemini Live is disabled
      if (!refs.recognitionRef.current && !enableGeminiLive) {
        const speechInitSuccess = initializeSpeechRecognition(refs.recognitionRef, {
          activeSpeakerIndex: state.activeSpeakerIndex,
          participants,
          recordingTime: recordingTimer.getDuration(),
          sessionId: state.sessionId,
          isRecording: state.isRecording,
          isPaused: state.isPaused,
          onTranscriptUpdate,
          setBrowserSegments: setState.setBrowserSegments,
          setInterimSegment: setState.setInterimSegment,
          setTranscript: setState.setTranscript,
          setInterimText: setState.setInterimText,
          setErrorMessage: setState.setErrorMessage,
          transcriptRef: refs.transcriptRef,
          browserSegments: state.browserSegments,
          // ✅ NEW: Pass pause/resume callbacks for error recovery via refs
          onPauseRecording: async () => pauseRecordingRef.current?.(),
          onResumeRecording: async () => resumeRecordingRef.current?.(),
          getIsRecording: () => isRecordingRef.current,
          getIsPaused: () => isPausedRef.current
        });
        
        if (!speechInitSuccess) {
          console.error('❌ RESUME: Failed to reinitialize speech recognition');
          setState.setErrorMessage('Failed to reinitialize speech recognition during resume');
          return;
        }
      }
      
      // FIXED: Only start speech recognition when Gemini Live is disabled (matching startRecording logic)
      if (!enableGeminiLive && refs.recognitionRef.current) {
        try {
          refs.recognitionRef.current.start();
        } catch (recognitionError) {
          console.error('❌ RESUME: Speech recognition start failed:', recognitionError);
          throw recognitionError;
        }
      }
      
      // FIXED: Properly resume MediaRecorder for Traditional recording continuity
      if (refs.mediaRecorderRef.current) {
        if (refs.mediaRecorderRef.current.state === 'paused') {
          // Simply resume the paused recorder to maintain audio stream continuity
          try {
            refs.mediaRecorderRef.current.resume();
          } catch (mediaError) {
            console.error('❌ RESUME: MediaRecorder resume failed:', mediaError);
            throw mediaError;
          }
        } else if (refs.mediaRecorderRef.current.state === 'inactive') {
          // If recorder became inactive, we need to reinitialize
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Preserve existing audio chunks during reinit
          const existingChunks = [...refs.audioChunksRef.current];
          
          // FIXED: Use preserved override stream if available, otherwise fall back to regular initialization
          let success: boolean;
          if (preservedOverrideStream) {
            try {
              const result = await initializeMediaRecorderWithStream(
                refs.mediaRecorderRef,
                refs.audioChunksRef,
                setState.setErrorMessage,
                preservedOverrideStream
              );
              success = result.success;
            } catch (streamError) {
              console.error('❌ RESUME: AudioCaptain stream initialization failed:', streamError);
              success = false;
            }
          } else {
            try {
              success = await initializeEnhancedMediaRecorder(
                refs.mediaRecorderRef,
                refs.audioChunksRef,
                setState.setErrorMessage
              );
            } catch (standardError) {
              // Fallback if function name was wrong, try initializeEnhancedMediaRecorder
               const result = await initializeEnhancedMediaRecorder(
                refs.mediaRecorderRef,
                refs.audioChunksRef,
                setState.setErrorMessage
              );
              success = result.success;
            }
          }
          
          // Restore previously recorded chunks
          refs.audioChunksRef.current = existingChunks;
          
          if (success && refs.mediaRecorderRef.current) {
            try {
              refs.mediaRecorderRef.current.start(1000);
            } catch (startError) {
              console.error('❌ RESUME: MediaRecorder start failed:', startError);
              throw startError;
            }
          } else {
            throw new Error('Failed to reinitialize MediaRecorder');
          }
        }
      }
      
      if (!navigator.onLine) {
        toast.warning('Resumed in offline mode. Using browser transcription only.');
      }
      
      try {
        recordingTimer.resume();
      } catch (timerError) {
        console.error('❌ RESUME: Recording timer resume failed:', timerError);
        throw timerError;
      }
      
      setState.setIsPaused(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      console.log('✅ RESUME: Traditional recording resumed successfully');
    } catch (error) {
      console.error('❌ RESUME: Error resuming recording:', error);
      setState.setErrorMessage(`Error resuming recording: ${error}`);
      setState.setIsPaused(true);
    }
  }, [state.isRecording, state.isPaused, state.activeSpeakerIndex, state.sessionId, state.browserSegments, participants, enableGeminiLive, preservedOverrideStream, initializeAudioSource, onTranscriptUpdate, setState, refs]);

  // Update ref
  useEffect(() => {
    resumeRecordingRef.current = resumeRecording;
  }, [resumeRecording]);

  // Keep a ref so visibility-change handler always has the latest browserSegments
  const browserSegmentsRef = useRef(state.browserSegments);
  useEffect(() => {
    browserSegmentsRef.current = state.browserSegments;
  }, [state.browserSegments]);

  // Media Session API + background gap detection
  useEffect(() => {
    if (!state.isRecording) {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('stop', null);
      }
      return;
    }

    // Register as a media session so Android Chrome keeps recording when user switches apps
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meetingTitle || 'Recording in progress',
        artist: 'Dicta-Notes',
        album: 'Meeting Recording',
      });
      navigator.mediaSession.playbackState = state.isPaused ? 'paused' : 'playing';
      navigator.mediaSession.setActionHandler('pause', () => pauseRecordingRef.current?.());
      navigator.mediaSession.setActionHandler('play', () => resumeRecordingRef.current?.());
      navigator.mediaSession.setActionHandler('stop', () => pauseRecordingRef.current?.());
    }

    // Track gaps when user switches apps
    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        const gapSeconds = Math.round((Date.now() - hiddenAt) / 1000);
        hiddenAt = null;

        if (gapSeconds >= 3) {
          const mins = Math.floor(gapSeconds / 60);
          const secs = gapSeconds % 60;
          const gapLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

          const gapSegment: TranscriptSegment = {
            id: `gap-${Date.now()}`,
            timestamp: new Date(),
            text: `[App was in background for ${gapLabel} — audio during this time may be missing]`,
          };
          setState.setBrowserSegments([...browserSegmentsRef.current, gapSegment] as any);
          toast.warning(`Back from background — ${gapLabel} of audio may be missing.`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isRecording, state.isPaused, meetingTitle]);

  // Recording functions - memoized
  const startRecording = useCallback(async (overrideStream?: MediaStream, externalVadStream?: MediaStream) => {
    if (state.isRecording) return;
    
    try {
      console.log('🎤 Starting traditional recording');
      
      // Request wake lock to prevent screen sleep during recording
      await wakeLock.request();
      
      // NEW: Preserve override stream for pause/resume cycles
      if (overrideStream) {
        setPreservedOverrideStream(overrideStream);
      } else {
        setPreservedOverrideStream(null);
      }

      setState.setOfflineMode(!navigator.onLine);
      setState.setIsRecording(true);
      setState.setIsPaused(false);
      setState.setErrorMessage(null);
      
      const result = await initializeAudioSource(preferredAudioSource, overrideStream);
      
      if (!result.success) {
        console.error('Audio source initialization failed');
        setState.setErrorMessage('Failed to initialize audio source');
        return;
      }
      
      // Initialize speech recognition and media recorder
      const speechInitSuccess = enableGeminiLive 
        ? true // Skip browser speech recognition when Gemini Live is enabled
        : initializeSpeechRecognition(refs.recognitionRef, {
            activeSpeakerIndex: state.activeSpeakerIndex,
            participants,
            recordingTime: recordingTimer.getDuration(),
            sessionId: state.sessionId,
            isRecording: state.isRecording,
            isPaused: state.isPaused,
            onTranscriptUpdate,
            setBrowserSegments: setState.setBrowserSegments,
            setInterimSegment: setState.setInterimSegment,
            setTranscript: setState.setTranscript,
            setInterimText: setState.setInterimText,
            setErrorMessage: setState.setErrorMessage,
            transcriptRef: refs.transcriptRef,
            browserSegments: state.browserSegments,
            onPauseRecording: async () => pauseRecordingRef.current?.(),
            onResumeRecording: async () => resumeRecordingRef.current?.(),
            getIsRecording: () => isRecordingRef.current,
            getIsPaused: () => isPausedRef.current
          });
      
      if (!speechInitSuccess) {
        return;
      }
      
      try {
        // Start recognition and recording - ONLY start browser speech recognition when Gemini Live is disabled
        if (!enableGeminiLive && refs.recognitionRef.current) {
          refs.recognitionRef.current.start();
        }
        refs.mediaRecorderRef.current?.start(1000);
        
        // Only start timer if not already running (avoid race conditions/double starts)
        if (!recordingTimer.isRunning()) {
          recordingTimer.start();
        }
        
        setState.setIsRecording(true);
        setState.setIsPaused(false);
        
        // START VAD Enhancement if available - Non-blocking to prevent UI delay
        if (enableVAD && vadState.isAvailable && vadState.instance) {
          // Fire and forget VAD start - don't await it
          // Check if start method exists and handle both Promise and void returns
          const startResult = vadState.instance.start?.();
          if (startResult && typeof startResult.then === 'function') {
            // start() returns a Promise
            startResult
              .then(() => {
                setVadState(prev => ({ ...prev, isActive: true }));
                console.log('✅ VAD enhancement started (background)');
              })
              .catch((vadError: any) => {
                console.warn('⚠️ VAD enhancement failed to start, continuing with standard recording:', vadError);
              });
          } else {
            // start() doesn't return a Promise or doesn't exist - mark as active anyway
            setVadState(prev => ({ ...prev, isActive: true }));
            console.log('✅ VAD enhancement started (synchronous)');
          }
        }
        
        console.log('✅ Recording started successfully');
        
      } catch (error) {
        console.error('Error starting recording:', error);
        setState.setErrorMessage(`Error starting recording: ${error}`);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setState.setErrorMessage(`Error starting recording: ${error}`);
    }
  }, [state.isRecording, state.activeSpeakerIndex, state.sessionId, state.isPaused, state.browserSegments, participants, preferredAudioSource, enableGeminiLive, enableVAD, vadState, wakeLock, initializeAudioSource, onTranscriptUpdate, setState, refs]);

  const stopRecording = useCallback(async (isCancel = false) => {
    if (!state.isRecording) return;
    
    // Step 1: Capture final elapsed time when stop is clicked
    const finalElapsedTimeSeconds = recordingTimer.getDuration();
    console.log('⏱️ Final recording duration:', finalElapsedTimeSeconds, 'seconds');
    
    try {
      console.log('🛑 Stopping recording and releasing wake lock...');
      
      // Release wake lock first
      await wakeLock.release();
      console.log('🔓 Wake lock released successfully');
      
      if (refs.recognitionRef.current) {
        refs.recognitionRef.current.stop();
      }
      
      if (refs.mediaRecorderRef.current?.state !== 'inactive') {
        refs.mediaRecorderRef.current?.stop();
      }

      // STOP VAD enhancement if it was active
      if (vadState.isActive && vadState.instance) {
        try {
          console.log("🛑 Stopping VAD enhancement...");
          await vadState.instance.pause();
          setVadState((prev) => ({ ...prev, isActive: false }));
          console.log("✅ VAD enhancement stopped successfully");
        } catch (vadError) {
          console.warn("⚠️ VAD enhancement failed to stop cleanly:", vadError);
          // Still proceed with stopping recording
        }
      }

      setState.setIsRecording(false);
      setState.setIsPaused(false);
      setState.setIsProcessing(true);
      
      // Stop recording timer if running
      if (recordingTimer.isRunning()) {
        recordingTimer.stop();
      }
      
      // Create audio blob for playback
      if (refs.audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(refs.audioChunksRef.current, { type: actualMimeType });
        setState.setAudioPlaybackBlob(audioBlob);
        toast.success('Audio recording ready for playback');

        // Persist audio blob to IndexedDB before upload attempt
        const localAudioId = `recording_${Date.now()}`;
        try {
          await saveAudioBlob(localAudioId, audioBlob, meetingTitle);
          console.log('Audio blob saved to IndexedDB:', localAudioId);
        } catch (dbErr) {
          console.warn('Failed to save audio to IndexedDB:', dbErr);
        }
        
        // Check if we have audio data to process (more reliable than time check)
        const totalAudioSize = refs.audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
        const MIN_AUDIO_SIZE = 100; // 100 bytes minimum - reduced from 1KB to capture short phrases
        
        if (totalAudioSize < MIN_AUDIO_SIZE) {
          console.log(`No significant audio data (${totalAudioSize} bytes), skipping processing`);
          toast.info('No audio content detected - nothing to transcribe');
          return;
        }
        
        console.log(`Processing audio: ${totalAudioSize} bytes from ${refs.audioChunksRef.current.length} chunks`);
        console.log('🎵 Using detected MIME type for processing:', actualMimeType);
        
        // Note: Full processing logic would be implemented here
        console.log('Would process full recording with Gemini here');
        
        // Add automatic Gemini processing
        setState.setIsProcessing(true);
        
        try {
          // Set saving state to true
          useSessionStore.getState().setIsSaving(true);

          // Step 2: Add duration to existing tags array
          const tagsWithDuration = [...tags, `duration:${finalElapsedTimeSeconds}`];
          console.log('🏷️ Tags with duration:', tagsWithDuration);

          // CONSTRUCT THE NEW REQUEST
          const filename = `recording_${Date.now()}.webm`;
          const audioFile = new File([audioBlob], filename, { type: audioBlob.type || 'audio/webm' });

          const sessionDetails = {
            meetingTitle,
            meetingPurpose: meetingPurpose || '',
            participants: (participants || []).filter((p): p is string => typeof p === 'string'),
            clientName: clientName || null,
            projectName: projectName || null,
            tags: tagsWithDuration,
          };

          // Use the correct fire-and-forget endpoint
          // Only include language_preference if it has a value (omit null/undefined)
          const formData: Record<string, any> = {
            session_details_json: JSON.stringify(sessionDetails),
          };
          if (languagePreference) {
            formData.language_preference = languagePreference;
          }
          
          const response = await brain.upload_and_create_session(
            formData,
            {
              audio_file: audioFile,
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.session_id) {
              toast.success('Recording saved successfully!');
              // Clear local backup after successful save
              clearLocalBackup();
              // Remove persisted audio blob from IndexedDB
              deleteAudioBlob(localAudioId).catch(() => {});
              console.log('Cleared local backup after successful session save');
              // Trigger the session saved modal
              setSessionSavedData({
                sessionId: result.session_id,
                sessionTitle: meetingTitle
              });
            } else {
              toast.error('Failed to get session ID after saving.');
            }
          } else {
            console.error('Failed to save recording:', response.status);
            toast.error('Failed to save recording.');
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          toast.error('Error processing recording');
        } finally {
          setState.setIsProcessing(false);
          // Set saving state to false
          useSessionStore.getState().setIsSaving(false);
        }
      } else {
        console.warn('No audio chunks available for playback');
        toast.error('No audio recorded');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setState.setErrorMessage(`Error stopping recording: ${error}`);
    }
  }, [
    meetingTitle,
    meetingPurpose,
    participants,
    onTranscriptUpdate,
    onParticipantsUpdate,
    speakerTimeline,
    clientName,
    projectName,
    tags,
    languagePreference,
    sessionId,
    setSessionId,
    user?.uid,
  ]);

  const cancelRecording = useCallback(() => {
  }, []);

  // Memoized setRecordingTime
  const setRecordingTime = useCallback((time: number) => {
    // Special case: Allow resetting to 0
    if (time === 0) {
      console.log('🔄 Resetting recording timer to 0 via setRecordingTime(0)');
      recordingTimer.reset();
      return;
    }

    // We can't easily set the time of the running service arbitrarily without complex logic
    // So we log a warning if attempted while running
    if (recordingTimer.isRunning()) {
      console.warn('Attempted to set recording time while timer is running - ignored');
    } else {
      // If stopped, we could potentially set the resumeTime or finalDuration, 
      // but for now we treat the service as the source of truth.
      console.log('setRecordingTime called but ignored - using RecordingTimerService as source of truth');
    }
  }, []);

  // Save current state
  const saveCurrentState = () => {
    if (state.browserSegments.length === 0 && !state.transcript) return;
    
    saveTranscriptionState({
      meetingTitle,
      meetingPurpose,
      participants,
      transcript: state.transcript,
      geminiTranscript: state.geminiTranscript,
      browserSegments: state.browserSegments,
      isRecording: false,
      isPaused: false,
      recordingTime: state.recordingTime,
      sessionId: state.sessionId
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refs.recognitionRef.current) {
        try {
          refs.recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping on unmount
        }
      }
      
      if (refs.mediaRecorderRef.current?.state !== 'inactive') {
        try {
          refs.mediaRecorderRef.current?.stop();
        } catch (e) {
          // Ignore errors when stopping on unmount
        }
      }
      
      saveCurrentState();
    };
  }, []);

  return {
    // State
    ...state,
    sessionId,
    actualMimeType,
    
    // Actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    setSessionId,
    createSessionIfNeeded: (options) => sessionManager.createSessionIfNeeded(options),
    saveCurrentState,
    
    // State setters (for component-specific needs)
    setOfflineMode: setState.setOfflineMode,
    setErrorMessage: setState.setErrorMessage,
    setTranscript: setState.setTranscript,
    setGeminiTranscript: setState.setGeminiTranscript,
    setBrowserSegments: setState.setBrowserSegments,
    setInterimSegment: setState.setInterimSegment,
    setIsProcessing: setState.setIsProcessing,
    setAudioPlaybackBlob: setState.setAudioPlaybackBlob,
    setActiveSpeakerIndex: setState.setActiveSpeakerIndex,
    setSpeakerTimeline: setState.setSpeakerTimeline,
    
    // NEW: Session saved modal state
    sessionSavedData,
    setSessionSavedData,

    // Expose recording time getter from timer service
    get recordingTime() {
        return recordingTimer.getDuration();
    },

    // Compatibility wrapper for setting recording time
    // NOTE: This is now a no-op for the internal timer state as we use the service directly
    // But we expose it to satisfy the interface if needed by consumers
    setRecordingTime,

    // Expose refs for use in components (fixes transcriptRef error)
    refs
  };
}
