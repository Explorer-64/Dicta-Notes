import { useState, useCallback, useRef } from 'react';
import { mergeBuffers, bufferToWav } from './audioUtils';

/**
 * Hook for buffering audio chunks during Google STT recording
 * and stitching them together for Traditional Processing at end of session.
 * 
 * This eliminates the need for stream cloning - Google STT gets direct stream,
 * Traditional gets stitched original chunks.
 */
export function useAudioChunkBuffer() {
  const chunksRef = useRef<Blob[]>([]);
  const [chunkCount, setChunkCount] = useState(0);

  /**
   * Add a chunk to the buffer
   */
  const addChunk = useCallback((audioBlob: Blob) => {
    chunksRef.current.push(audioBlob);
    setChunkCount(prev => prev + 1);
    console.log(`📦 Buffer: Added chunk #${chunksRef.current.length}, size: ${audioBlob.size} bytes`);
  }, []);

  /**
   * Stitch all buffered chunks into a single audio blob
   * for Traditional Processing
   */
  const stitchChunks = useCallback(async (): Promise<Blob | null> => {
    if (chunksRef.current.length === 0) {
      console.warn('⚠️ Buffer: No chunks to stitch');
      return null;
    }

    console.log(`🔗 Buffer: Stitching ${chunksRef.current.length} chunks...`);
    
    try {
      // Convert all blobs to ArrayBuffers
      const arrayBuffers = await Promise.all(
        chunksRef.current.map(blob => blob.arrayBuffer())
      );

      // Extract raw PCM data from each chunk (skip 44-byte WAV header)
      const pcmBuffers = arrayBuffers.map(buffer => {
        const pcmData = new Float32Array(buffer.slice(44));
        return pcmData;
      });

      // Merge all PCM buffers
      const mergedPCM = mergeBuffers(pcmBuffers);
      
      // Convert merged PCM back to WAV
      const stitchedBlob = bufferToWav(mergedPCM, 16000); // 16kHz sample rate
      
      console.log(`✅ Buffer: Stitched ${chunksRef.current.length} chunks into ${stitchedBlob.size} bytes`);
      return stitchedBlob;
    } catch (error) {
      console.error('❌ Buffer: Failed to stitch chunks:', error);
      return null;
    }
  }, []);

  /**
   * Clear the buffer (call after sending to Traditional Processing)
   */
  const clearBuffer = useCallback(() => {
    const count = chunksRef.current.length;
    chunksRef.current = [];
    setChunkCount(0);
    console.log(`🗑️ Buffer: Cleared ${count} chunks`);
  }, []);

  /**
   * Get buffer stats
   */
  const getStats = useCallback(() => {
    const totalSize = chunksRef.current.reduce((sum, blob) => sum + blob.size, 0);
    return {
      chunkCount: chunksRef.current.length,
      totalSize,
      averageChunkSize: chunksRef.current.length > 0 ? totalSize / chunksRef.current.length : 0,
    };
  }, []);

  return {
    addChunk,
    stitchChunks,
    clearBuffer,
    chunkCount,
    getStats,
  };
}
