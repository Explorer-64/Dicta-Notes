import { useState, useRef, useCallback, useEffect } from "react";
import { mergeBuffers, bufferToWav } from "./audioUtils";

export interface UseCustomVADProps {
  onSpeechEnd: (audioBlob: Blob) => void;
  silenceThreshold?: number; // Duration in milliseconds
  volumeThreshold?: number; // Volume threshold 0-1
  minDuration?: number; // Minimum recording duration before allowing silence triggers (ms)
  maxDuration?: number; // Duration to trigger eager mode with shorter silence threshold (ms)
  eagerSilenceThreshold?: number; // Shorter silence threshold for eager mode after maxDuration (ms)
  externalStream?: MediaStream | null;
  isRecording?: boolean; // NEW: External recording state to control VAD processing
  // NEW: Disable overlap for Google STT compatibility
  disableOverlap?: boolean;
}

export interface UseCustomVADResult {
  startVAD: (streamToUse?: MediaStream) => Promise<void>;
  stopVAD: () => void;
  isSpeaking: boolean;
}

export function useCustomVAD({
  onSpeechEnd,
  silenceThreshold = 350, // 1 second of silence
  volumeThreshold = 0.004, // Fixed: Match TranscriptionTest working threshold (was 0.005)
  minDuration = 500, // Minimum 3 seconds before allowing silence triggers
  maxDuration = 8000, // NEW: Trigger eager mode after 8 seconds
  eagerSilenceThreshold = 150, // NEW: Shorter silence threshold for eager mode
  externalStream = null,
  isRecording = true, // NEW: External recording state
  disableOverlap = false, // NEW: Disable overlap for Google STT
}: UseCustomVADProps): UseCustomVADResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const overlapBufferRef = useRef<Float32Array[]>([]); // Add overlap buffer
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const recordingStartTimeRef = useRef<number | null>(null);
  const onSpeechEndRef = useRef(onSpeechEnd);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  const stopVAD = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsSpeaking(false);
    isRecordingRef.current = false;
    audioBufferRef.current = [];
    overlapBufferRef.current = []; // Clear overlap buffer when stopping VAD
  }, []);

  const processAudio = useCallback(
    (event: AudioProcessingEvent) => {
      // AGGRESSIVE DEBUG: Always log first few calls to confirm callback is executing
      if (Math.random() < 0.1) { // 10% chance for better visibility during testing
        console.log('🔊 VAD processAudio callback EXECUTING - isRecording:', isRecording, 'analyser:', !!analyserRef.current, 'context:', !!audioContextRef.current);
      }
      
      // CRITICAL FIX: Remove dependency on external isRecording state to prevent 90-second failure
      // Only check internal audio context and analyser availability
      if (!analyserRef.current || !audioContextRef.current) {
        // If audio setup is not ready, don't process audio
        if (Math.random() < 0.05) {
          console.log('🚫 VAD: Audio context/analyser not ready, skipping processing');
        }
        return;
      }

      const pcmData = event.inputBuffer.getChannelData(0);
      const newBuffer = new Float32Array(pcmData);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(dataArray);

      let sumSquares = 0.0;
      for (const amplitude of dataArray) {
        const normalized = amplitude / 128.0 - 1.0;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);

      const isCurrentlySpeaking = rms > volumeThreshold;

      // Add detailed logging every 20 cycles to avoid spam but ensure visibility
      if (Math.random() < 0.05) {
        console.log(`🔊 VAD Debug: RMS=${rms.toFixed(4)}, threshold=${volumeThreshold}, speaking=${isCurrentlySpeaking}, stateSpeaking=${isRecordingRef.current}, externalRecording=${isRecording}`);
      }

      if (isCurrentlySpeaking) {
        // Speech detected
        if (!isRecordingRef.current) {
          console.log('🎙️ VAD: Speech started');
          isRecordingRef.current = true;
          recordingStartTimeRef.current = Date.now(); // Track when recording started
          setIsSpeaking(true);
        }
        // Cancel any pending silence timer since we're speaking again
        if (silenceTimerRef.current) {
          console.log('🚫 VAD: Cancelled silence timer - speech resumed');
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        audioBufferRef.current.push(newBuffer);
      } else {
        // No current speech detected
        audioBufferRef.current.push(newBuffer); // Still collect audio during silence
        
        if (isRecordingRef.current && !silenceTimerRef.current) {
          // Check if we've been recording long enough to allow silence triggers
          const recordingDuration = recordingStartTimeRef.current ? Date.now() - recordingStartTimeRef.current : 0;
          const hasMinDuration = recordingDuration >= minDuration;
          
          if (!hasMinDuration) {
            console.log(`⏳ VAD: Only ${recordingDuration}ms recorded, need ${minDuration}ms minimum before allowing silence triggers`);
            return; // Don't start silence timer yet
          }
          
          // TWO-PHASE CHUNKING: Determine which silence threshold to use
          const isEagerMode = recordingDuration >= maxDuration;
          const activeSilenceThreshold = isEagerMode ? eagerSilenceThreshold : silenceThreshold;
          
          if (isEagerMode && Math.random() < 0.2) {
            console.log(`⚡ VAD: EAGER MODE activated at ${recordingDuration}ms - using ${eagerSilenceThreshold}ms threshold`);
          }
          
          // Start silence timer with dynamic threshold
          console.log(`🤫 VAD: Starting silence timer (${activeSilenceThreshold}ms) after ${recordingDuration}ms of recording`);
          silenceTimerRef.current = setTimeout(() => {
            console.log('⏰ VAD: Silence timer finished, processing audio...');
            console.log(`📊 VAD: Collected ${audioBufferRef.current.length} audio chunks`);
            
            if (audioBufferRef.current.length === 0) {
              console.warn('⚠️ VAD: No audio chunks collected!');
              return;
            }
            
            // Combine overlap from previous segment with current segment
            const allChunks = disableOverlap 
              ? [...audioBufferRef.current] // No overlap for Google STT
              : [...overlapBufferRef.current, ...audioBufferRef.current]; // Overlap for Gemini
            const mergedBuffer = mergeBuffers(allChunks);
            
            if (disableOverlap) {
              console.log('🚫 VAD: No overlap (Google STT mode), buffer length:', mergedBuffer.length, 'samples');
            } else {
              console.log('🔗 VAD: Merged buffer with overlap (Gemini mode), length:', mergedBuffer.length, 'samples');
            }
            
            // Save overlap for next segment only if overlap is enabled
            if (!disableOverlap) {
              // Calculate overlap for next segment (500ms)
              const overlapDurationMs = 500;
              const overlapSamples = Math.floor((overlapDurationMs / 1000) * audioContextRef.current!.sampleRate);
              const currentSegmentLength = audioBufferRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
              
              // Save overlap from end of current segment for next segment
              if (currentSegmentLength >= overlapSamples) {
                const startOverlapIndex = Math.max(0, audioBufferRef.current.length - Math.ceil(overlapSamples / 1024)); // Approximate chunk count
                overlapBufferRef.current = audioBufferRef.current.slice(startOverlapIndex);
                console.log(`🔄 VAD: Saved ${overlapBufferRef.current.length} chunks (${overlapDurationMs}ms) for next segment overlap`);
              } else {
                overlapBufferRef.current = [...audioBufferRef.current]; // Save all if segment is short
                console.log('🔄 VAD: Segment too short, saved entire segment for overlap');
              }
            } else {
              // Clear overlap buffer when overlap is disabled
              overlapBufferRef.current = [];
              console.log('🚫 VAD: Overlap disabled, no chunks saved for next segment');
            }
            
            // Audio quality validation for large segments
            if (audioBufferRef.current.length > 300) {
                console.warn('⚠️ LARGE SEGMENT DETECTED:');
                console.warn(`   Chunks: ${audioBufferRef.current.length}`);
                console.warn(`   Duration: ~${(mergedBuffer.length / audioContextRef.current!.sampleRate).toFixed(1)}s`);
                
                // Calculate silence ratio
                const silentSamples = mergedBuffer.filter(sample => Math.abs(sample) < 0.01).length;
                const silenceRatio = (silentSamples / mergedBuffer.length * 100).toFixed(1);
                console.warn(`   Silence ratio: ${silenceRatio}%`);
                
                // Check for audio clipping
                const clippedSamples = mergedBuffer.filter(sample => Math.abs(sample) > 0.95).length;
                const clipRatio = (clippedSamples / mergedBuffer.length * 100).toFixed(2);
                console.warn(`   Clipping ratio: ${clipRatio}%`);
                
                if (parseFloat(silenceRatio) > 80) {
                    console.error('🚨 SUSPECTED AUDIO CORRUPTION: >80% silence in large segment!');
                }
            }
            
            const wavBlob = bufferToWav(mergedBuffer, audioContextRef.current!.sampleRate);
            console.log('🎵 VAD: Created WAV blob, size:', wavBlob.size, 'bytes');
            
            if (wavBlob.size === 0) {
              console.warn('⚠️ VAD: Created empty WAV blob!');
              return;
            }
            
            onSpeechEndRef.current(wavBlob);
            audioBufferRef.current = [];
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
            // After a chunk is sent, we are no longer speaking until sound is detected again
            isRecordingRef.current = false;
            recordingStartTimeRef.current = null; // Reset recording start time
            setIsSpeaking(false);
            console.log('✅ VAD: Speech processing complete');
          }, activeSilenceThreshold);
        }
      }
    },
    [onSpeechEnd, silenceThreshold, volumeThreshold],
  );

  const startVAD = useCallback(async (streamToUse?: MediaStream) => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        stopVAD();
      }

      let stream: MediaStream;
      
      // Use provided stream, then external stream, then create our own
      if (streamToUse) {
        console.log('VAD: Using provided audio stream');
        stream = streamToUse;
        mediaStreamRef.current = null; // Don't manage external stream lifecycle
        
        // DIAGNOSTIC: Check audio track status
        const audioTracks = stream.getAudioTracks();
        console.log('🔍 VAD DIAGNOSTIC: Stream track analysis:', {
          trackCount: audioTracks.length,
          tracks: audioTracks.map(track => ({
            id: track.id,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
            kind: track.kind,
            label: track.label
          }))
        });
      } else if (externalStream) {
        console.log('VAD: Using external audio stream');
        stream = externalStream;
        mediaStreamRef.current = null; // Don't manage external stream lifecycle
      } else {
        console.log('VAD: Creating new audio stream');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream; // Only manage our own stream
      }

      // CRITICAL FIX: Force 16kHz sample rate for consistent Gemini processing
      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = context;
      
      console.log(`🎧 VAD: AudioContext created with sample rate: ${context.sampleRate}Hz`);

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const analyser = context.createAnalyser();
      analyser.fftSize = 512; // A bit more resolution
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(context.destination);

      processor.onaudioprocess = processAudio;

      console.log('VAD initialized successfully with 16kHz sample rate');
    } catch (error) {
      console.error('VAD Error:', error);
      throw error;
    }
  }, [processAudio, externalStream]);

  // CRITICAL FIX: Restart VAD when external stream becomes available
  useEffect(() => {
    // Prevent restart if stream is the same and VAD is already running
    if (externalStream && isRecording && mediaStreamRef.current?.id === externalStream.id) {
      console.log('🔄 VAD: Stream unchanged, preventing restart');
      return;
    }

    if (externalStream && isRecording) {
      console.log('🔄 VAD: External stream changed, restarting VAD with new stream');
      startVAD(externalStream).catch(error => {
        console.error('❌ VAD: Failed to restart with new external stream:', error);
      });
    } else if (!externalStream && !isRecording) {
      console.log('🛑 VAD: External stream removed or recording stopped, stopping VAD');
      stopVAD();
    }
  }, [externalStream, isRecording, startVAD, stopVAD]); // FIX: Added isRecording dependency

  // Listen for pitch change events to force chunking on speaker changes
  useEffect(() => {
    console.log('[CustomVAD] 🎵 Setting up pitchChange event listener', {
      isRecording,
      disableOverlap,
      hasOnSpeechEnd: !!onSpeechEnd
    });
    
    const handlePitchChange = (event: Event) => {
      console.log('[CustomVAD] 🎵🎵🎵 pitchChange event received!', {
        isRecordingRef: isRecordingRef.current,
        bufferLength: audioBufferRef.current.length,
        event
      });
      
      if (isRecordingRef.current && audioBufferRef.current.length > 0) {
        console.log('[CustomVAD] 🎵 Pitch change detected - forcing immediate chunk');
        
        // Cancel any pending silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        
        // Immediately process the current audio buffer
        const allChunks = disableOverlap 
          ? [...audioBufferRef.current]
          : [...overlapBufferRef.current, ...audioBufferRef.current];
        const mergedBuffer = mergeBuffers(allChunks);
        
        console.log(`🎵 CustomVAD: Pitch-triggered chunk, buffer length: ${mergedBuffer.length} samples`);
        
        if (audioContextRef.current) {
          // Save overlap for next segment if not disabled
          if (!disableOverlap) {
            const overlapDurationMs = 500;
            const overlapSamples = Math.floor((overlapDurationMs / 1000) * audioContextRef.current.sampleRate);
            const currentSegmentLength = audioBufferRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
            
            if (currentSegmentLength >= overlapSamples) {
              const startOverlapIndex = Math.max(0, audioBufferRef.current.length - Math.ceil(overlapSamples / 1024));
              overlapBufferRef.current = audioBufferRef.current.slice(startOverlapIndex);
            } else {
              overlapBufferRef.current = [...audioBufferRef.current];
            }
          } else {
            overlapBufferRef.current = [];
          }
          
          const wavBlob = bufferToWav(mergedBuffer, audioContextRef.current.sampleRate);
          console.log('🎵 CustomVAD: Created WAV blob from pitch change, size:', wavBlob.size, 'bytes');
          
          if (wavBlob.size > 0) {
            onSpeechEndRef.current(wavBlob);
          }
        }
        
        // Reset buffer and state
        audioBufferRef.current = [];
        recordingStartTimeRef.current = Date.now(); // Reset recording start time for next segment
        console.log('✅ CustomVAD: Pitch-triggered chunk processed');
      } else {
        console.log('[CustomVAD] ⏭️ Pitch change ignored - not recording or buffer empty');
      }
    };

    window.addEventListener('pitchChange', handlePitchChange);
    console.log('[CustomVAD] ✅ pitchChange listener attached to window');
    
    return () => {
      window.removeEventListener('pitchChange', handlePitchChange);
      console.log('[CustomVAD] 🗑️ pitchChange listener removed');
    };
  }, [isRecording, disableOverlap]);

  return { startVAD, stopVAD, isSpeaking };
};
