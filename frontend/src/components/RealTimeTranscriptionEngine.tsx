import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptSegment } from 'utils/types';
import { toast } from 'sonner';
import { useCustomVAD } from 'utils/useCustomVAD';
import { audioSourceManager } from 'utils/audio/AudioSourceManager';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { extractPCMFromWAV, arrayBufferToBase64 } from 'utils/audioUtils';
import brain from 'brain';
// NEW: MicVAD helper to create instance
import { createMicVAD } from 'utils/lazyVAD';
import { initializeAudioBuffers, convertToPCMBase64 } from 'utils/gemini/audioProcessing';
// ADD: AudioCaptain integration from GeminiLive
import { audioCaptain } from 'utils/recording/audioCaptain';

interface RealTimeTranscriptionEngineProps {
  audioSource: AudioSourceType;
  targetLanguage?: string;
  onSegmentUpdate: (segments: TranscriptSegment[]) => void;
  onStatusChange: (status: string) => void;
  onEngineStateChange: (state: { isSpeaking: boolean; processingCount: number }) => void;
  onError: (error: string) => void;
  enableTranslation?: boolean;
  // NEW: Allow parent to provide sessionId to match backend writes
  sessionId?: string | null;
  // NEW: Allow parent to provide pre-captured stream to avoid duplicate permission dialogs
  preCapturedStream?: MediaStream | null;
  // NEW: Participant names for accurate speaker identification
  participants?: string[];
  // NEW: Use MicVAD (@ricky0123/vad-web) instead of custom analyser-based VAD
  useMicVAD?: boolean;
  // NEW: Disable 500ms overlap for Google STT compatibility
  disableOverlap?: boolean;
}

export interface RealTimeTranscriptionEngineRef {
  start: () => Promise<void>;
  stop: () => void;
  isActive: boolean;
  isSpeaking: boolean;
  processingCount: number;
}

const RealTimeTranscriptionEngine = React.forwardRef<
  RealTimeTranscriptionEngineRef,
  RealTimeTranscriptionEngineProps
>(({ 
  audioSource,
  targetLanguage = 'en',
  onSegmentUpdate,
  onStatusChange,
  onEngineStateChange,
  onError,
  enableTranslation = false,
  sessionId,
  preCapturedStream,
  participants,
  useMicVAD = false,
}, ref) => {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);

  // Use refs for state that callbacks need to access
  const isActiveRef = useRef(false);
  const currentStreamRef = useRef<MediaStream | null>(null);
  // Initialize sessionIdRef with default value if not provided
  const sessionIdRef = useRef<string>(sessionId || `gemini-live-${Date.now()}-${Math.random().toString(36).slice(2,6)}`);
  const segmentCounterRef = useRef<number>(0);

  // MicVAD instance/state
  const micVadRef = useRef<any | null>(null);
  const [isSpeakingMic, setIsSpeakingMic] = useState(false);

  // Keep internal sessionId in sync with prop
  useEffect(() => {
    if (sessionId) {
      sessionIdRef.current = sessionId;
      console.log('🔗 RealTimeTranscriptionEngine using sessionId:', sessionId);
    } else if (!sessionIdRef.current) {
      // If no sessionId provided initially, set default
      sessionIdRef.current = `gemini-live-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      console.log('🔗 Set default sessionId:', sessionIdRef.current);
    }
  }, [sessionId]);

  // Helper: send a prepared base64 PCM chunk to backend
  const sendBase64PcmChunk = useCallback(async (segmentId: string, base64Audio: string) => {
    try {
      const request = {
        audio_base64: base64Audio,
        session_id: sessionIdRef.current,
        target_language: targetLanguage,
        chunk_id: segmentId,
        participants: participants || undefined,
      };

      console.log('📤 Sending HTTP request to /transcribe-chunk (MicVAD path):', { 
        segmentId, 
        sessionId: sessionIdRef.current,
        pcmLength: base64Audio.length
      });

      const response = await brain.transcribe_chunk(request);
      const result = await response.json();

      console.log('📥 HTTP response:', result);

      // Update segment with result
      setSegments((prev) =>
        prev.map((segment) =>
          segment.id === segmentId
            ? {
                ...segment,
                text: result.transcription || '',
                speaker: result.speaker || undefined,
                translation: result.translation || undefined,
                status: 'completed' as const,
              }
            : segment
        )
      );
    } catch (error: any) {
      console.error('❌ Processing failed (MicVAD path):', error);
      setSegments((prev) =>
        prev.map((segment) => (segment.id === segmentId ? { ...segment, status: 'error' as const } : segment))
      );
      toast.error(`Processing failed for segment: ${error.message}`);
    } finally {
      setProcessingQueue((prev) => prev.filter((id) => id !== segmentId));
    }
  }, [participants, targetLanguage]);

  // Handle VAD speech end - simple callback that always processes (Custom VAD path expects WAV Blob)
  const handleSpeechEnd = useCallback(async (audioBlob: Blob) => {
    console.log('🎤 handleSpeechEnd called (CustomVAD path):', {
      isActive: isActiveRef.current,
      audioBlobSize: audioBlob.size,
    });

    const segmentId = `segment-${segmentCounterRef.current++}`;

    const newSegment: TranscriptSegment = {
      id: segmentId,
      timestamp: new Date(),
      text: '',
      status: 'processing',
      audioSize: audioBlob.size,
    };

    setSegments((prev) => [...prev, newSegment]);
    setProcessingQueue((prev) => [...prev, segmentId]);

    // Process in background
    processSegmentInBackground(segmentId, audioBlob);
  }, []);

  // Background processing function for WAV Blob (Custom VAD path)
  const processSegmentInBackground = async (segmentId: string, audioBlob: Blob) => {
    try {
      console.log(`🔧 Processing segment ${segmentId}: Converting WAV to raw PCM...`);
      const pcmBuffer = await extractPCMFromWAV(audioBlob);
      const base64Audio = arrayBufferToBase64(pcmBuffer);

      await sendBase64PcmChunk(segmentId, base64Audio);
    } catch (error: any) {
      console.error('❌ Processing failed:', error);
      setSegments((prev) =>
        prev.map((segment) => (segment.id === segmentId ? { ...segment, status: 'error' as const } : segment))
      );
      toast.error(`Processing failed for segment: ${error.message}`);
    }
  };

  // Custom VAD hook (legacy/analyser path)
  const { startVAD: startCustomVAD, stopVAD: stopCustomVAD, isSpeaking: _legacySpeaking } = useCustomVAD({
    onSpeechEnd: handleSpeechEnd,
  });

  // Start function (handles both Custom VAD and MicVAD paths)
  const start = useCallback(async () => {
    if (isActiveRef.current) return;
    isActiveRef.current = true;

    try {
      onStatusChange('initializing');

      // Reuse provided stream if any, else get new one via audioSourceManager
      let stream = preCapturedStream || currentStreamRef.current;
      if (!stream) {
        const result = await audioSourceManager.getAudioStream(audioSource);
        stream = result.stream;
      }
      currentStreamRef.current = stream;

      // If MicVAD is enabled, use it exclusively
      if (useMicVAD) {
        console.log('[MicVAD] Initializing @ricky0123/vad-web…');

        // Small input config for stability
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioCtx.destination);

        let currentSpeechBuffers: Float32Array[] = [];
        const pcmBuffers = initializeAudioBuffers(4096);

        console.log('[MicVAD] Creating MicVAD instance…');
        // Instance
        const vad = await createMicVAD({
          renewOnResume: true,
          onSpeechStart: () => {
            console.log('[MicVAD] onSpeechStart');
            setIsSpeakingMic(true);
            onStatusChange('recording');
            onEngineStateChange({ isSpeaking: true, processingCount: processingQueue.length });
            currentSpeechBuffers = [];
          },
          onSpeechEnd: async () => {
            console.log('[MicVAD] onSpeechEnd');
            try {
              const segmentId = `segment-${segmentCounterRef.current++}`;
              // Concatenate Float32 frames
              const totalLength = currentSpeechBuffers.reduce((acc, arr) => acc + arr.length, 0);
              
              // Add diagnostic logging
              console.log('[MicVAD] Speech end diagnostics:', {
                segmentId,
                totalBuffers: currentSpeechBuffers.length,
                totalSamples: totalLength,
                isActive: isActiveRef.current,
                sessionId: sessionIdRef.current
              });
              
              if (totalLength === 0) {
                console.warn('[MicVAD] No audio data collected for segment', segmentId);
                return;
              }
              
              const joined = new Float32Array(totalLength);
              let offset = 0;
              for (const buf of currentSpeechBuffers) {
                joined.set(buf, offset);
                offset += buf.length;
              }
              console.log('[MicVAD] Preparing PCM for upload', { frames: currentSpeechBuffers.length, samples: totalLength });

              const { base64Audio } = convertToPCMBase64(joined, pcmBuffers, 16000);

              const newSegment: TranscriptSegment = {
                id: segmentId,
                timestamp: new Date(),
                text: '',
                status: 'processing',
                audioSize: joined.length * 2,
              };
              setSegments((prev) => [...prev, newSegment]);
              setProcessingQueue((prev) => [...prev, segmentId]);

              console.log('[MicVAD] Sending chunk to /transcribe_chunk', { segmentId, bytes: newSegment.audioSize });
              await sendBase64PcmChunk(segmentId, base64Audio);
            } catch (e: any) {
              console.error('[MicVAD] onSpeechEnd error', e);
              console.error('[MicVAD] Error stack:', e.stack);
              onError(e.message || 'MicVAD processing error');
            } finally {
              setIsSpeakingMic(false);
              onEngineStateChange({ isSpeaking: false, processingCount: processingQueue.length });
              currentSpeechBuffers = [];
            }
          },
          startOnLoad: true,
          useNoiseSuppression: true,
          source: source,
        });

        console.log('[MicVAD] Started (16kHz). Collecting frames during speech.');
        micVadRef.current = { vad, audioCtx, processor };

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (!isActiveRef.current) return;
          const input = e.inputBuffer.getChannelData(0);
          // Always collect frames - let MicVAD handle speech detection internally
          // This prevents the 90-second failure where isSpeakingMic gets out of sync
          currentSpeechBuffers.push(new Float32Array(input));
        };

        onStatusChange('ready');
        return;
      }

      // Fallback: start legacy custom VAD
      await startCustomVAD(currentStreamRef.current!);
      onStatusChange('ready');
    } catch (err: any) {
      console.error('❌ Engine start failed:', err);
      onError(err?.message || 'Failed to start recording');
      isActiveRef.current = false;
    }
  }, [audioSource, onEngineStateChange, onError, onStatusChange, preCapturedStream, processingQueue.length, startCustomVAD, useMicVAD]);

  // Stop function
  const stop = useCallback(() => {
    if (!isActiveRef.current) return;
    isActiveRef.current = false;

    try {
      if (useMicVAD && micVadRef.current) {
        console.log('🛑 Stopping MicVAD…');
        try { micVadRef.current?.vad?.destroy?.(); } catch {}
        try { micVadRef.current?.processor?.disconnect?.(); } catch {}
        try { micVadRef.current?.audioCtx?.close?.(); } catch {}
        micVadRef.current = null;
      }

      stopCustomVAD();

      // Do not stop the incoming stream here (page may reuse it); parent controls lifecycle
      onEngineStateChange({ isSpeaking: false, processingCount: processingQueue.length });
      onStatusChange('idle');
    } catch (err: any) {
      console.error('❌ Engine stop failed:', err);
    }
  }, [onEngineStateChange, onStatusChange, processingQueue.length, stopCustomVAD, useMicVAD]);

  // Expose ref methods
  React.useImperativeHandle(ref, () => ({
    start,
    stop,
    get isActive() {
      return isActiveRef.current;
    },
    get isSpeaking() {
      return useMicVAD ? isSpeakingMic : false;
    },
    get processingCount() {
      return processingQueue.length;
    },
  }));

  // Propagate segments to parent when they change
  useEffect(() => {
    onSegmentUpdate(segments);
  }, [segments, onSegmentUpdate]);

  return null;
});

export default RealTimeTranscriptionEngine;
