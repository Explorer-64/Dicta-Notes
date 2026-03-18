import { useState, useCallback } from 'react';
import brain from 'brain';
import type { MicVADOnlyRequest } from 'types';

interface UseGoogleSTTTranscriptionProps {
  sessionId: string;
  onTranscription: (text: string, chunkId: string) => void;
  onError: (error: string) => void;
  targetLanguage?: string;
}

interface UseGoogleSTTTranscriptionResult {
  transcribeAudio: (audioBlob: Blob, chunkId: string) => Promise<void>;
  isProcessing: boolean;
}

/**
 * Hook for transcribing audio using Google STT with Gemini fallback.
 * Converts audio blob to base64 PCM and sends to micvad_only endpoint.
 * Falls back to transcribe_chunk (Gemini) if Google STT returns empty.
 */
export function useGoogleSTTTranscription({
  sessionId,
  onTranscription,
  onError,
  targetLanguage = 'en',
}: UseGoogleSTTTranscriptionProps): UseGoogleSTTTranscriptionResult {
  const [isProcessing, setIsProcessing] = useState(false);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob, chunkId: string) => {
      setIsProcessing(true);
      try {
        console.log(`[GoogleSTT] Processing chunk ${chunkId}, size: ${audioBlob.size} bytes`);

        // Convert blob to base64 PCM
        console.log(`[GoogleSTT] Converting audio blob to base64 PCM...`);
        const base64Audio = await blobToBase64PCM(audioBlob);
        console.log(`[GoogleSTT] Conversion complete, base64 length: ${base64Audio.length}`);

        // Try Google STT first (micvad_only endpoint)
        console.log(`[GoogleSTT] Sending to micvad_only endpoint...`);
        const startTime = Date.now();
        const response = await brain.micvad_only_transcribe_chunk({
          audio_base64: base64Audio,
          chunk_id: chunkId,
          session_id: sessionId,
          target_language: targetLanguage,
        });
        const elapsed = Date.now() - startTime;
        console.log(`[GoogleSTT] API response received after ${elapsed}ms`);

        const result = await response.json();
        console.log(`[GoogleSTT] Response:`, result);

        if (result.success && result.transcription) {
          console.log(`[GoogleSTT] ✓ Transcription received: "${result.transcription}"`);
          onTranscription(result.transcription, chunkId);
        } else {
          console.log(`[GoogleSTT] Empty result (silence or backend handled fallback)`);
        }
      } catch (error: any) {
        console.error(`[GoogleSTT] ❌ Error processing chunk ${chunkId}:`, error);
        onError(error.message || 'Google STT transcription failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [sessionId, targetLanguage, onTranscription, onError]
  );

  return { transcribeAudio, isProcessing };
}

/**
 * Convert WAV blob to base64-encoded PCM16 audio.
 * Strips WAV header and encodes raw PCM data.
 */
async function blobToBase64PCM(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  // WAV header is 44 bytes, skip it to get raw PCM data
  const pcmData = new Uint8Array(arrayBuffer.slice(44));

  // Convert to base64
  let binary = '';
  const len = pcmData.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(pcmData[i]);
  }
  return btoa(binary);
}
