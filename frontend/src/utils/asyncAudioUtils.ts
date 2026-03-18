
/**
 * Async audio utilities to prevent main thread blocking
 */

/**
 * Convert ArrayBuffer to base64 string using FileReader (Async)
 * This prevents main thread blocking for large buffers.
 * @param buffer - ArrayBuffer containing PCM data
 * @returns Promise<string> - base64 encoded string
 */
export function arrayBufferToBase64Async(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:application/octet-stream;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
