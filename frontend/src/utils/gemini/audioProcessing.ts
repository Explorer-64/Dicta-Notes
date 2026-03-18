/**
 * Audio processing utilities for Gemini Live API
 * Extracted from useGeminiLiveAPI.ts to reduce file size and improve maintainability
 */

// Types for audio buffer management
export interface AudioBuffers {
  pcmData: Int16Array;
  arrayBuffer: ArrayBuffer;
  dataView: DataView;
  uint8Array: Uint8Array;
}

// Audio source detection result
export interface AudioSourceInfo {
  isSystemAudio: boolean;
  sourceType: 'SYSTEM_AUDIO' | 'MICROPHONE';
  recommendedSampleRate: number;
}

// PCM conversion result
export interface PCMConversionResult {
  base64Audio: string;
  sampleRate: number;
  mimeType: string;
}

/**
 * Initialize reusable audio buffers for memory efficiency
 * Prevents memory leaks during continuous audio processing
 */
export function initializeAudioBuffers(bufferSize: number): AudioBuffers {
  const arrayBuffer = new ArrayBuffer(bufferSize * 2);
  return {
    pcmData: new Int16Array(bufferSize),
    arrayBuffer,
    dataView: new DataView(arrayBuffer),
    uint8Array: new Uint8Array(arrayBuffer)
  };
}

/**
 * Detect audio source type by examining track labels
 * System audio sources have different characteristics than microphones
 */
export function detectAudioSource(audioTracks: MediaStreamTrack[]): AudioSourceInfo {
  if (audioTracks.length === 0) {
    return {
      isSystemAudio: false,
      sourceType: 'MICROPHONE',
      recommendedSampleRate: 16000
    };
  }

  const track = audioTracks[0];
  const isSystemAudio = track.label.includes('monitor') || 
    track.label.includes('system') || 
    track.label.includes('desktop') ||
    track.label.includes('screen') ||
    track.label.includes('tab');

  return {
    isSystemAudio,
    sourceType: isSystemAudio ? 'SYSTEM_AUDIO' : 'MICROPHONE',
    recommendedSampleRate: isSystemAudio ? 0 : 16000 // 0 means use system default
  };
}

/**
 * Create AudioContext with appropriate sample rate based on audio source
 * System audio uses default sample rate, microphone uses 16kHz for optimal Gemini processing
 */
export function createOptimalAudioContext(sourceInfo: AudioSourceInfo): AudioContext {
  if (sourceInfo.isSystemAudio) {
    // Use system default sample rate for system audio
    return new AudioContext();
  } else {
    // Force 16kHz for microphone for optimal Gemini processing
    return new AudioContext({ sampleRate: 16000 });
  }
}

/**
 * Safely convert a Uint8Array to base64 without blowing the JS call stack.
 * Uses chunked processing to avoid passing too many arguments to fromCharCode.
 */
function uint8ToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000; // 32,768 bytes per chunk
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    // Using spread on large arrays causes a stack overflow; chunked apply is safe
    binary += String.fromCharCode.apply(null, Array.from(sub) as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Convert Float32Array audio data to PCM and then to base64
 * Handles proper negative sample conversion and creates Gemini-compatible format
 */
export function convertToPCMBase64(
  audioData: Float32Array, 
  audioBuffers: AudioBuffers, 
  sampleRate: number
): PCMConversionResult {
  // Convert float32 to int16 with proper negative sample handling
  const pcmData = audioBuffers.pcmData;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    pcmData[i] = sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767);
  }

  // Convert to base64 (chunked to prevent call stack overflow)
  const view = audioBuffers.dataView;
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(i * 2, pcmData[i], true);
  }
  const base64Audio = uint8ToBase64(audioBuffers.uint8Array);

  return {
    base64Audio,
    sampleRate: sampleRate || 16000,
    mimeType: `audio/pcm;rate=${sampleRate || 16000}`
  };
}

/**
 * Add health monitoring event listeners to audio tracks
 * Helps debug audio stream issues during recording
 */
export function addAudioTrackMonitoring(
  track: MediaStreamTrack, 
  context: string = 'audio'
): void {
  track.addEventListener('ended', () => {
    console.error(`❌ CRITICAL: ${context} audio track ended during recording!`);
  });
  
  track.addEventListener('mute', () => {
    console.warn(`🔇 WARNING: ${context} audio track muted!`);
  });
  
  track.addEventListener('unmute', () => {
    console.log(`🔊 ${context} audio track unmuted`);
  });
}

/**
 * Log detailed audio track information for debugging
 * Provides comprehensive track analysis for troubleshooting
 */
export function logAudioTrackDetails(track: MediaStreamTrack, context: string = 'DEBUG'): void {
  const sourceInfo = detectAudioSource([track]);
  
  console.log(`🔍 ${context}: Audio track constraints and capabilities:`, {
    label: track.label,
    kind: track.kind,
    enabled: track.enabled,
    readyState: track.readyState,
    muted: track.muted,
    constraints: track.getConstraints(),
    settings: track.getSettings(),
    capabilities: track.getCapabilities()
  });
  
  console.log(`🔍 ${context}: Audio source type detected:`, sourceInfo.sourceType);
}

/**
 * Get optimal microphone constraints based on intended use
 * Configured for optimal Gemini Live API performance
 */
export function getMicrophoneConstraints(): MediaStreamConstraints {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000
    }
  };
}

/**
 * Create a Gemini-compatible audio message from PCM data
 * Formats audio data for transmission to Gemini Live API
 */
export function createGeminiAudioMessage(pcmResult: PCMConversionResult) {
  return {
    realtimeInput: {
      mediaChunks: [
        {
          mimeType: pcmResult.mimeType,
          data: pcmResult.base64Audio
        }
      ]
    }
  };
}
