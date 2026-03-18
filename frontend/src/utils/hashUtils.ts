/**
 * Utility functions for hashing content
 * Used for translation cache management
 */

/**
 * Generate SHA-256 hash of content
 * @param content - The content to hash
 * @returns A hex string hash of the content
 */
export async function sha256(content: string): Promise<string> {
  // Use the Web Crypto API for hashing
  const msgBuffer = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert bytes to hex string
  const hashHex = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return hashHex;
}
