/**
 * Helper functions for handling audio data
 */

/**
 * Convert Blob to Base64
 * @param blob The blob to convert
 * @returns A promise that resolves to the base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Create an audio blob from chunks
 * @param chunks The audio chunks
 * @param mimeType The MIME type of the audio
 * @returns A Blob containing the audio data
 */
export function createAudioBlobFromChunks(chunks: Blob[], mimeType: string = 'audio/webm'): Blob {
  return new Blob(chunks, { type: mimeType });
}

export function mergeBuffers(buffers: Float32Array[]): Float32Array {
  const totalLength = buffers.reduce((acc, val) => acc + val.length, 0);
  const result = new Float32Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

export function bufferToWav(buffer: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * bytesPerSample;
  const waveHeaderSize = 44;
  const totalSize = waveHeaderSize + dataSize;

  const wavBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(wavBuffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, totalSize - 8, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // "fmt " sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true); // Audio format (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // "data" sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  // Write PCM data
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

/**
 * Extract raw PCM data from a WAV blob by stripping the 44-byte header
 * This prevents audio format mismatches that cause Gemini transcription hallucinations
 * @param wavBlob - WAV blob with header
 * @returns Promise<ArrayBuffer> - Raw PCM data without WAV header
 */
export async function extractPCMFromWAV(wavBlob: Blob): Promise<ArrayBuffer> {
  const arrayBuffer = await wavBlob.arrayBuffer();
  
  // WAV files have a 44-byte header, skip it to get raw PCM data
  const WAV_HEADER_SIZE = 44;
  
  if (arrayBuffer.byteLength <= WAV_HEADER_SIZE) {
    console.warn('⚠️ WAV blob too small, may not contain valid audio data');
    return arrayBuffer; // Return as-is if smaller than header
  }
  
  // Extract only the PCM data (everything after the 44-byte header)
  const pcmData = arrayBuffer.slice(WAV_HEADER_SIZE);
  
  console.log(`🔧 Stripped WAV header: ${arrayBuffer.byteLength} bytes → ${pcmData.byteLength} bytes PCM`);
  
  return pcmData;
}

/**
 * Convert ArrayBuffer to base64 string
 * @param buffer - ArrayBuffer containing PCM data
 * @returns base64 encoded string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
