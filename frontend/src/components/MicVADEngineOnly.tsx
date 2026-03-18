import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle, useMemo, memo } from 'react';
import { toast } from 'sonner';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { audioCaptain } from 'utils/recording/audioCaptain';
import { initializeAudioBuffers, convertToPCMBase64 } from 'utils/gemini/audioProcessing';
import { createMicVAD } from 'utils/lazyVAD';
import brain from 'brain';
import { useLanguageStore } from 'utils/languageStore';
import { useTranscriptionStore } from '../utils/transcriptionStore';
import type { RealTimeVADOptions } from '@ricky0123/vad-web';
import { createWavBlob } from 'utils/wavUtils';

// NEW: Runtime options to tune MicVAD behaviour (thresholds, padding, durations)
export interface MicVADRuntimeOptions {
  positiveSpeechThreshold?: number;
  negativeSpeechThreshold?: number;
  minSpeechFrames?: number;
  redemptionFrames?: number;
  preSpeechPadFrames?: number;
  frameSamples?: number;
}

interface MicVADSegment {
  id: string;
  timestamp: Date;
  text: string;
  speaker?: string;
  translation?: string;
  status: 'recording' | 'processing' | 'completed' | 'error';
  audioSize?: number;
}

// Props for MicVAD engine
interface MicVADEngineOnlyProps {
  audioSource: AudioSourceType;
  targetLanguage?: string; // Kept for backwards compatibility, but no longer drives re-renders
  phraseHints?: string[]; // For STT model prompting
  onSegmentUpdate: (segments: MicVADSegment[]) => void;
  onStatusChange: (status: string) => void;
  onEngineStateChange: (state: { isSpeaking: boolean; processingCount: number }) => void;
  onError: (error: string) => void;
  sessionId?: string | null;
  participants?: string[];
  // NEW: Runtime options to tune MicVAD behaviour (thresholds, padding, durations)
  vadOptions?: MicVADRuntimeOptions;
  // NEW: Route to bare-bones micvad_only API when true
  useMicVADOnlyAPI?: boolean;
  // NEW: Callback to receive live stream for language detection
  onLiveStreamReady?: (stream: MediaStream) => void;
}

// Define the shape of the public interface for the ref
export interface MicVADEngineOnlyRef {
  start: () => Promise<void>;
  stop: () => void;
  updateLanguageHint: (newLanguage: string) => void;
}

// NEW: Delay utility import
import { createTwoSecondDelayedStream } from 'utils/audioDelayProcessor';

// Create an inner component to allow wrapping with React.memo while keeping displayName
const MicVADEngineOnlyInner = forwardRef<MicVADEngineOnlyRef, MicVADEngineOnlyProps>(({ audioSource, targetLanguage, phraseHints, onSegmentUpdate, onStatusChange, onEngineStateChange, onError, sessionId, participants, vadOptions, useMicVADOnlyAPI, onLiveStreamReady, }, ref) => {
  const componentId = useRef(`micvad-${Date.now()}`);
  // Moved mount log to useEffect to avoid confusion with re-renders
  useEffect(() => {
    console.log(`[MicVAD-${componentId.current}] Component mounted (${useMicVADOnlyAPI ? 'official API' : 'websocket'} mode)`);
    console.log(`[MicVAD-${componentId.current}] Initial props:`, { 
      audioSource, 
      targetLanguage, 
      sessionId, 
      useMicVADOnlyAPI,
      phraseHints
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Debug prop changes by logging previous values (optional diagnostics only)
  const prevPropsRef = useRef<any>(null);
  useEffect(() => {
    const currentProps = { audioSource, sessionId, useMicVADOnlyAPI, participants, phraseHints };
    if (prevPropsRef.current) {
      const changes = Object.entries(currentProps).filter(
        ([key, value]) => prevPropsRef.current[key] !== value
      );
      if (changes.length > 0) {
        console.log(`[MicVAD-${componentId.current}] ⚠️ PROP CHANGES DETECTED:`, changes);
        changes.forEach(([key, newValue]) => {
          console.log(`  - ${key}:`, prevPropsRef.current[key], '→', newValue);
        });
      }
    }
    prevPropsRef.current = currentProps;
  }, [audioSource, sessionId, useMicVADOnlyAPI, participants, phraseHints]);
  
  // Component unmount logging
  useEffect(() => {
    return () => {
      console.log(`[MicVAD-${componentId.current}] 🔴 Component unmounting!`);
    };
  }, []);
  
  // Get user's preferred language for default transcription
  const { preferredLanguage } = useLanguageStore();
  
  // Compute initial language hint once on mount
  const browserLanguage = useMemo(() => navigator.language.split('-')[0], []);
  const initialTargetLanguage = useMemo(() => {
    return targetLanguage || preferredLanguage || browserLanguage || 'en';
  }, [targetLanguage, preferredLanguage, browserLanguage]);
  
  // Refs for stable access in callbacks
  const currentLanguageRef = useRef(initialTargetLanguage);

  // Helper function to map unsupported language variants to supported ones
  const mapToSupportedLanguage = (langCode: string): string => {
    const languageMapping: Record<string, string> = {
      // Spanish variants - map unsupported to supported
      'es-AR': 'es-ES', // Argentina -> Spain
      'es-CL': 'es-ES', // Chile -> Spain
      'es-CO': 'es-ES', // Colombia -> Spain
      'es-PE': 'es-ES', // Peru -> Spain
      'es-VE': 'es-ES', // Venezuela -> Spain
      'es-UY': 'es-ES', // Uruguay -> Spain
      'es-PY': 'es-ES', // Paraguay -> Spain
      'es-BO': 'es-ES', // Bolivia -> Spain
      'es-EC': 'es-ES', // Ecuador -> Spain
      'es-GT': 'es-ES', // Guatemala -> Spain
      'es-HN': 'es-ES', // Honduras -> Spain
      'es-NI': 'es-ES', // Nicaragua -> Spain
      'es-PA': 'es-ES', // Panama -> Spain
      'es-CR': 'es-ES', // Costa Rica -> Spain
      'es-SV': 'es-ES', // El Salvador -> Spain
      'es-DO': 'es-ES', // Dominican Republic -> Spain
      'es-CU': 'es-ES', // Cuba -> Spain
      'es-PR': 'es-ES', // Puerto Rico -> Spain
    };
    
    return languageMapping[langCode] || langCode;
  };

  const participantsRef = useRef(participants);
  const phraseHintsRef = useRef(phraseHints);

  // Keep refs updated with the latest props that are safe to update without remounting
  const prevParticipants = useRef(participants);
  const prevPhraseHints = useRef(phraseHints);
  useEffect(() => {
    if (prevParticipants.current !== participants) {
      console.log(`[MicVAD-${componentId.current}] 🔄 Prop change (participants):`, prevParticipants.current, '->', participants);
      participantsRef.current = participants;
      prevParticipants.current = participants;
    }
    if (prevPhraseHints.current !== phraseHints) {
      console.log(`[MicVAD-${componentId.current}] 🔄 Prop change (phraseHints):`, prevPhraseHints.current, '->', phraseHints);
      phraseHintsRef.current = phraseHints;
      prevPhraseHints.current = phraseHints;
    }
  }, [participants, phraseHints]);

  console.log(`[MicVAD] Initializing with target language: ${currentLanguageRef.current} (initial: ${initialTargetLanguage}, preferred: ${preferredLanguage})`);
  
  const [segments, setSegments] = useState<MicVADSegment[]>([]);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Refs for engine state
  const isActiveRef = useRef(false);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string>(sessionId || `micvad-${Date.now()}-${Math.random().toString(36).slice(2,6)}`);
  const segmentCounterRef = useRef<number>(0);
  const micVadRef = useRef<any | null>(null);
  // NEW: store delay cleanup
  const delayCleanupRef = useRef<null | (() => void)>(null);
  // NEW: Ref to hold small audio chunks for merging
  const heldChunkRef = useRef<Float32Array | null>(null);
  
  // Update sessionId ref when prop changes
  useEffect(() => {
    if (sessionId) {
      sessionIdRef.current = sessionId;
      console.log('[MicVAD] Using sessionId:', sessionId);
    }
  }, [sessionId]);
  
  // Update parent with segments
  useEffect(() => {
    onSegmentUpdate(segments);
  }, [segments]); // Remove onSegmentUpdate from dependencies
  
  // Update parent with engine state
  useEffect(() => {
    onEngineStateChange({ isSpeaking, processingCount: processingQueue.length });
  }, [isSpeaking, processingQueue.length]); // Remove onEngineStateChange from dependencies
  
  // Add the transcription store
  const { addSegment, updateSegment } = useTranscriptionStore();

  // Listen for pitch-based segmentation events
  useEffect(() => {
    const handlePitchChange = (_event: CustomEvent) => {
      console.log('[MicVAD] Pitch change detected - forcing immediate segment end for speaker change');
      // Force the VAD to end current speech segment when pitch changes significantly
      if (micVadRef.current?.vad && isSpeaking) {
        console.log('[MicVAD] 🎵 Forcing immediate VAD restart due to pitch change');
        // Pause and immediately restart VAD to force segment boundary
        micVadRef.current.vad.pause();
        if (!micVadRef.current.vad.destroyed) {
          micVadRef.current.vad.start();
        }
      }
    };

     window.addEventListener('pitchChange', handlePitchChange as EventListener as any);
    
    return () => {
      window.removeEventListener('pitchChange', handlePitchChange as EventListener as any);
    };
  }, [isSpeaking]); // Depend on isSpeaking so we only trigger when actually recording

  // Send PCM audio chunk to backend
  const sendBase64PcmChunk = useCallback(async (segmentId: string, base64Audio: string) => {
    try {
      console.log('[MicVAD] 📤 Sending chunk to backend', { segmentId, audioLength: base64Audio.length, useMicVADOnlyAPI });
      
      const endpoint = useMicVADOnlyAPI ? brain.micvad_only_transcribe_chunk : brain.transcribe_chunk;
      
      const response = await endpoint({
        chunk_id: segmentId,
        audio_base64: base64Audio,
        target_language: currentLanguageRef.current,
        session_id: sessionIdRef.current, // Use the sessionId from the ref, not the prop
        participants: participantsRef.current || undefined,
        phrase_hints: phraseHintsRef.current || undefined, // Pass phrase hints
      });

      console.log(`[MicVAD] 📥 ${useMicVADOnlyAPI ? 'micvad_only' : 'transcribe_chunk'} response:`, response);
      
      const responseData = await response.json();
      console.log(`[MicVAD] 📥 Response data:`, responseData);
      
      const { success, transcription, message } = responseData;
      
      if (!success) {
        throw new Error(message || 'Transcription failed');
      }

      // Show transcription result in logs
      console.log(`[MicVAD] ✅ Transcription result: "${transcription || 'No transcription'}"`);

      // Update both local state AND persistent store
      setSegments((prev) =>
        prev.map((segment) =>
          segment.id === segmentId
            ? {
                ...segment,
                text: transcription || 'No transcription',
                speaker: undefined,
                translation: undefined,
                status: 'completed' as const,
              }
            : segment
        )
      );
      
      // Update the transcription store with completed segment
      updateSegment(segmentId, {
        text: transcription || 'No transcription',
        language: currentLanguageRef.current
      });
      
    } catch (error: any) {
      console.error('[MicVAD] Processing failed:', error);
      setSegments((prev) =>
        prev.map((segment) => (segment.id === segmentId ? { ...segment, status: 'error' as const } : segment))
      );
      
      // Update the transcription store with error status
      updateSegment(segmentId, {
        text: `Error: ${error.message}`,
        language: 'error'
      });
      
      toast.error(`MicVAD processing failed: ${error.message}`);
    } finally {
      setProcessingQueue((prev) => prev.filter((id) => id !== segmentId));
    }
  }, [useMicVADOnlyAPI, addSegment, updateSegment]); // Add dependencies
  
  // Start MicVAD engine
  const start = useCallback(async () => {
    if (isActiveRef.current) {
      console.log('[MicVAD] Already active, ignoring start');
      return;
    }
    
    console.log('[MicVAD] Starting engine...');
    isActiveRef.current = true;
    
    try {
      onStatusChange('Initializing MicVAD...');
      
      // STEP 2: Create dual audio streams using audioCaptain
      console.log('[MicVAD] Setting audio source:', audioSource);
      audioCaptain.setAudioSource(audioSource);
      
      console.log('[MicVAD] Capturing audio via audioCaptain...');
      const originalStream = await audioCaptain.captureAudio();
      
      console.log('[MicVAD] Creating stream clones...');
      const sttStream = await audioCaptain.createStreamCopy('micvad-stt', 'MicVAD STT Stream');
      const geminiStream = await audioCaptain.createStreamCopy('micvad-gemini', 'MicVAD Gemini Stream');
      
      console.log('[MicVAD] ✅ Stream 1 (STT):', {
        id: sttStream.id,
        tracks: sttStream.getAudioTracks().length,
        active: sttStream.active
      });
      
      console.log('[MicVAD] ✅ Stream 2 (Gemini - ready for language detection):', {
        id: geminiStream.id, 
        tracks: geminiStream.getAudioTracks().length,
        active: geminiStream.active
      });
      
      // NEW: Send live stream to parent for language detection
      if (onLiveStreamReady) {
        console.log('[MicVAD] 🎙️ Providing live stream for language detection');
        onLiveStreamReady(geminiStream);
      }
      
      // NEW: apply 2s DelayNode to STT path only
      console.log('[MicVAD] Applying language-aware DelayNode to STT path...');
      const { delayedStream, cleanup } = createTwoSecondDelayedStream(sttStream, true); // Enable language detection waiting
      delayCleanupRef.current = cleanup;
      
      // Use delayed STT stream for current VAD processing (Stream 1)
      const stream = delayedStream;
      currentStreamRef.current = stream;
      
      // Log track details for debugging
      const track = stream.getAudioTracks?.()?.[0];
      if (track) {
        console.log('[MicVAD] Track details:', {
          label: track.label,
          settings: track.getSettings?.(),
          constraints: track.getConstraints?.(),
          readyState: track.readyState,
        });
      }
      
      console.log('[MicVAD] Initializing @ricky0123/vad-web...');
      
      // Create audio context at 16kHz for consistency for microphone; system audio often uses device rate but we still feed frames
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioCtx.destination);
      
      let currentSpeechBuffers: Float32Array[] = [];
      // We'll allocate PCM buffers sized to each segment right before conversion
      
      // Add timeout to force chunking before Google's 1-minute limit
      let speechStartTime: number | null = null;
      let maxSegmentTimer: NodeJS.Timeout | null = null;
      const MAX_SEGMENT_DURATION_MS = 50000; // 50 seconds to stay under Google's 1-minute limit
      
      console.log('[MicVAD] Creating MicVAD instance...');
      
      // Create MicVAD instance with explicit worklet/model URLs and ORT wasm paths
      const vad = await createMicVAD({
        
        // Provide the actual MediaStream to the VAD so its internal worklet can analyze it
        stream,
        modelURL: '/silero_vad.onnx',
        // Enforce minimum speech duration ≈300 ms (about 10 frames at ~32 ms per frame)
        minSpeechFrames: 10,
        // NEW: Add 120ms of audio padding to the end of speech to prevent clipping
        postSpeechPadMs: 120,
        ortConfig: (model: any) => {
          // Ensure ONNXRuntime can find wasm
          model.wasm = { wasmPaths: '/' };
        },
        onSpeechStart: () => {
          console.log('%c[MicVAD] VAD Event: onSpeechStart', 'color: #8A2BE2; font-weight: bold;');
          setIsSpeaking(true);
          onStatusChange('Recording speech...');
          currentSpeechBuffers = []; // Clear buffers at the start of new speech
          
          // Track speech start time and set maximum duration timer
          speechStartTime = Date.now();
          if (maxSegmentTimer) {
            clearTimeout(maxSegmentTimer);
          }
          maxSegmentTimer = setTimeout(() => {
            console.log('[MicVAD] Auto-chunking: 50-second limit reached, forcing segment end');
            micVadRef.current?.vad?.pause?.();
            setTimeout(() => {
              if (micVadRef.current && !micVadRef.current.destroyed) {
                micVadRef.current?.vad?.start?.();
              }
            }, 100);
          }, MAX_SEGMENT_DURATION_MS);
        },
        onSpeechEnd: async (audioFromVad?: Float32Array) => {
          console.log('%c[MicVAD] VAD Event: onSpeechEnd', 'color: #8A2BE2; font-weight: bold;');
          setIsSpeaking(false); // Set speaking to false immediately
          onStatusChange('Processing...');
          
          // Clear the max segment timer since speech has ended naturally
          if (maxSegmentTimer) {
            clearTimeout(maxSegmentTimer);
            maxSegmentTimer = null;
          }

          try {
            // Determine which audio buffer to use: prefer the buffer provided by vad-web if present
            let audioToProcess: Float32Array;
            if (audioFromVad && audioFromVad.length > 0) {
              audioToProcess = audioFromVad;
            } else {
              // Fallback: concatenate collected frames
              const totalLength = currentSpeechBuffers.reduce((acc, arr) => acc + arr.length, 0);
              audioToProcess = new Float32Array(totalLength);
              let offset = 0;
              for (const buf of currentSpeechBuffers) {
                audioToProcess.set(buf, offset);
                offset += buf.length;
              }
            }

            // --- Micro-Chunk Merging Logic ---
            const minChunkSamples = 16 * 250; // 250ms at 16kHz

            // Create a downloadable link for the raw audio chunk for debugging
            const wavBlob = createWavBlob(audioToProcess, 16000);
            const wavUrl = URL.createObjectURL(wavBlob);
            console.log(`[MicVAD] 🎤 Raw audio chunk captured (${audioToProcess.length} samples). Click to listen:`, wavUrl);

            // If the current chunk is too small, hold it and wait for the next one.
            if (audioToProcess.length < minChunkSamples) {
              console.log(`[MicVAD] Chunk too small, holding for merge.`);
              // If there's already a held chunk, append this new small one to it.
              if (heldChunkRef.current) {
                const combined = new Float32Array(heldChunkRef.current.length + audioToProcess.length);
                combined.set(heldChunkRef.current);
                combined.set(audioToProcess, heldChunkRef.current.length);
                heldChunkRef.current = combined;
              } else {
                heldChunkRef.current = audioToProcess;
              }
              // Stop processing for this tiny chunk.
              return; 
            }

            // If we are here, the chunk is large enough. Check if there's a small chunk to merge.
            if (heldChunkRef.current) {
              console.log(`[MicVAD] Merging held chunk (${heldChunkRef.current.length} samples) with current chunk.`);
              const combined = new Float32Array(heldChunkRef.current.length + audioToProcess.length);
              combined.set(heldChunkRef.current);
              combined.set(audioToProcess, heldChunkRef.current.length);
              audioToProcess = combined;
              heldChunkRef.current = null; // Clear the held chunk
            }
            // --- End of Micro-Chunk Merging Logic ---


            const segmentId = `micvad-segment-${componentId.current.slice(-8)}-${Date.now()}-${segmentCounterRef.current++}`;
            console.log(`[MicVAD] Processing segment ${segmentId}`);
            
            // Allocate PCM buffers sized to the segment length to avoid truncation
            const pcmBuffers = initializeAudioBuffers(audioToProcess.length);
            const { base64Audio } = convertToPCMBase64(audioToProcess, pcmBuffers, 16000);
            
            // Create new segment (UI)
            const newSegment: MicVADSegment = {
              id: segmentId,
              timestamp: new Date(),
              text: '',
              status: 'processing',
              audioSize: audioToProcess.length * 2,
            };
            
            // Add to local state for immediate UI feedback
            setSegments((prev) => [...prev, newSegment]);
            setProcessingQueue((prev) => [...prev, segmentId]);
            
            // Add to persistent transcription store
            addSegment({
              id: segmentId,
              text: '',
              timestamp: Date.now(),
              speaker: 'Processing...',
              language: currentLanguageRef.current
            });
            
            console.log('[MicVAD] Sending chunk', { segmentId, bytes: newSegment.audioSize });
            // Send chunk asynchronously without blocking VAD for new speech detection
            sendBase64PcmChunk(segmentId, base64Audio).catch((error) => {
              console.error('[MicVAD] Background transcription failed:', error);
            });
            
          } catch (e: any) {
            console.error('[MicVAD] onSpeechEnd processing failed:', e);
            onError(e.message || 'MicVAD processing error');
          } finally {
            // This now happens immediately, allowing VAD to detect new speech
            console.log('[MicVAD] onSpeechEnd complete, VAD ready for next utterance.');
            onStatusChange('Ready');
            currentSpeechBuffers = []; // Ensure buffers are clean for the next round
          }
        },
        startOnLoad: true,
        useNoiseSuppression: true,
        // Important: pass the AudioNode as source for frame collection in our UI, but VAD reads from stream internally
        source: source,
      });
      
      console.log('[MicVAD] MicVAD instance created. Starting VAD...');
      try {
        // Explicitly start the VAD processing to ensure callbacks fire
        await (vad as any).start?.();
      } catch (e) {
        console.warn('[MicVAD] vad.start() not available or failed, continuing (startOnLoad may handle)', e);
      }
      
      console.log('[MicVAD] Started successfully (16kHz). Collecting frames during speech.');
      micVadRef.current = { vad, audioCtx, processor };
      
      // Collect audio frames during speech for fallback
      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!isActiveRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        
        if (isSpeaking) {
          currentSpeechBuffers.push(new Float32Array(input));
        }
      };
      
      onStatusChange('Ready - speak to test MicVAD');
      
      // Cleanup function
      return () => {
        console.log('[MicVAD] Cleaning up VAD instance...');
        
        // Clear any pending timers
        if (maxSegmentTimer) {
          clearTimeout(maxSegmentTimer);
          maxSegmentTimer = null;
        }
        
        // Stop audio processing
        if (processor) {
          processor.disconnect();
        }
        if (source) {
          source.disconnect();
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close().catch(console.error);
        }
        
        // Cleanup VAD
        if (vad && !vad.destroy) {
          try {
            vad.destroy();
          } catch (error) {
            console.error('[MicVAD] Error destroying VAD:', error);
          }
        }
        
        micVadRef.current = null;
      };
      
    } catch (err: any) {
      console.error('[MicVAD] Engine start failed:', err);
      onError(err?.message || 'Failed to start MicVAD');
      isActiveRef.current = false;
    }
  }, [audioSource, onStatusChange, onError, sendBase64PcmChunk, isSpeaking]);
  
  // Stop MicVAD engine
  const stop = useCallback(() => {
    console.log('[MicVAD] Stopping engine...');
    
    // Immediately set inactive to prevent new operations
    isActiveRef.current = false;
    
    try {
      // Stop VAD if running
      if (micVadRef.current) {
        console.log('[MicVAD] Destroying VAD instance...');
        try { 
          micVadRef.current?.vad?.destroy?.(); 
          console.log('[MicVAD] ✅ VAD destroyed');
        } catch (e) { 
          console.log('[MicVAD] VAD destroy error:', e); 
        }
        try { 
          micVadRef.current?.processor?.disconnect?.(); 
          console.log('[MicVAD] ✅ Processor disconnected');
        } catch (e) { 
          console.log('[MicVAD] Processor disconnect error:', e); 
        }
        try { 
          micVadRef.current?.audioCtx?.close?.(); 
          console.log('[MicVAD] ✅ AudioContext closed');
        } catch (e) { 
          console.log('[MicVAD] AudioContext close error:', e); 
        }
        micVadRef.current = null;
      } else {
        console.log('[MicVAD] No VAD instance to destroy');
      }
      
      // Clean up audio streams via audioCaptain - force cleanup regardless of state
      console.log('[MicVAD] Cleaning up audio streams via audioCaptain...');
      try {
        audioCaptain.stopAllCapture();
        console.log('[MicVAD] ✅ audioCaptain stopped');
      } catch (e) {
        console.log('[MicVAD] audioCaptain stop error:', e);
      }
      
      // Clear stream ref
      if (currentStreamRef.current) {
        try {
          // Stop all tracks in the stream
          currentStreamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('[MicVAD] ✅ Track stopped:', track.label);
          });
        } catch (e) {
          console.log('[MicVAD] Track stop error:', e);
        }
        currentStreamRef.current = null;
      }
      
      // Reset buffers and counters
      segmentCounterRef.current = 0;
      
      // Update status
      onStatusChange('Stopped');
      console.log('[MicVAD] ✅ Engine stopped successfully');
      
    } catch (err) {
      console.error('[MicVAD] ❌ Error during stop:', err);
      // Even if stop fails, ensure we reset state
      isActiveRef.current = false;
      micVadRef.current = null;
      currentStreamRef.current = null;
      onStatusChange('Stopped (with errors)');
    }
  }, [onStatusChange]);
  
  // Expose public methods via ref
  useImperativeHandle(ref, () => ({
    start: async () => {
      await start(); 
    },
    stop,
    updateLanguageHint: (newLanguage: string) => {
      const mapped = mapToSupportedLanguage(newLanguage);
      if (mapped && currentLanguageRef.current !== mapped) {
        console.log(`[MicVAD] Switching language hint from ${currentLanguageRef.current} to ${mapped}`);
        currentLanguageRef.current = mapped;
      }
    },
  }));

  // Cleanup on unmount
  useEffect(() => {
    // Add cleanup on mount to prevent leftover state
    if (isActiveRef.current) {
      console.log('[MicVAD] Component mounting with active state, cleaning up...');
      isActiveRef.current = false;
      micVadRef.current = null;
      currentStreamRef.current = null;
    }
    
    return () => {
      if (isActiveRef.current) {
        console.log('[MicVAD] Component unmounting, cleaning up...');
        stop();
      }
    };
  }, [stop]);
  
  // This component renders nothing - it's headless
  return null;
});

MicVADEngineOnlyInner.displayName = 'MicVADEngineOnly';

// Custom props comparison to avoid re-renders on language changes and other unstable props
function arePropsEqual(prev: MicVADEngineOnlyProps, next: MicVADEngineOnlyProps) {
  // Ignore targetLanguage changes to prevent unnecessary renders
  const audioSourceEqual = prev.audioSource === next.audioSource;
  const sessionIdEqual = prev.sessionId === next.sessionId;
  const modeEqual = prev.useMicVADOnlyAPI === next.useMicVADOnlyAPI;

  const participantsEqual = (prev.participants?.length || 0) === (next.participants?.length || 0)
    && (prev.participants || []).every((p, i) => p === (next.participants || [])[i]);
  const phraseHintsEqual = (prev.phraseHints?.length || 0) === (next.phraseHints?.length || 0)
    && (prev.phraseHints || []).every((p, i) => p === (next.phraseHints || [])[i]);

  // Also ensure callback identities are stable
  const callbacksEqual = prev.onSegmentUpdate === next.onSegmentUpdate
    && prev.onStatusChange === next.onStatusChange
    && prev.onEngineStateChange === next.onEngineStateChange
    && prev.onError === next.onError
    && prev.onLiveStreamReady === next.onLiveStreamReady;

  return audioSourceEqual && sessionIdEqual && modeEqual && participantsEqual && phraseHintsEqual && callbacksEqual;
}

const MicVADEngineOnly = memo(MicVADEngineOnlyInner, arePropsEqual);

export default MicVADEngineOnly;
