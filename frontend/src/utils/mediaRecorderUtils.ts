/**
 * Types and utilities for working with MediaRecorder API
 */

// Convert blob to base64 string
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Create a standardized filename for downloads
export function createFilename(prefix: string): string {
  const date = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${date}.txt`;
}

// Download text content as a file
export function downloadTextFile(content: string, filename: string): void {
  const element = document.createElement('a');
  const file = new Blob([content], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Format time in HH:MM:SS format
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Initialize media recorder for audio capture
export async function initMediaRecorder(
  onDataAvailable?: (data: Blob) => void,
  onStop?: () => void,
  onError?: (error: Error) => void,
  options?: { mimeType?: string, timeslice?: number }
): Promise<MediaRecorder | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Try to use specified mime type or fallback to browser default
    let mimeType = options?.mimeType || 'audio/webm';
    if (MediaRecorder.isTypeSupported(mimeType) === false) {
      // Fallback to other common types
      for (const type of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
    }
    
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    
    if (onDataAvailable) {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          onDataAvailable(event.data);
        }
      };
    }
    
    if (onStop) {
      mediaRecorder.onstop = onStop;
    }
    
    if (onError) {
      mediaRecorder.onerror = (event) => {
        // MediaRecorder error events don't have a direct error property
        onError(new Error(`MediaRecorder error occurred`));
      };
    }
    
    return mediaRecorder;
  } catch (error) {
    console.error('Error accessing microphone:', error);
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
    return null;
  }
}

// Create an audio blob from chunks
export function createAudioBlob(chunks: Blob[], mimeType: string = 'audio/webm'): Blob {
  return new Blob(chunks, { type: mimeType });
}

// Get supported audio mime types
export function getSupportedAudioTypes(): string[] {
  const types = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/ogg',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ];
  
  return types.filter(type => MediaRecorder.isTypeSupported(type));
}

// Detect if audio is mostly silent
export async function detectSilence(audioBlob: Blob, options?: {
  threshold?: number,  // Silence threshold (0-1, default 0.05)
  duration?: number    // Duration to consider (seconds, default 1)
}): Promise<boolean> {
  const threshold = options?.threshold ?? 0.05;
  const duration = options?.duration ?? 1;
  
  return new Promise((resolve, reject) => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Create audio element and load blob
      const audioElement = new Audio();
      audioElement.src = URL.createObjectURL(audioBlob);
      
      // Create analyzer
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      
      // Connect audio element to analyzer
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyzer);
      analyzer.connect(audioContext.destination);
      
      // Track silent frames
      let silentFrames = 0;
      let totalFrames = 0;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Listen for audio data
      audioElement.addEventListener('play', () => {
        const interval = setInterval(() => {
          // Check if audio is still playing
          if (audioElement.paused || audioElement.ended) {
            clearInterval(interval);
            
            // Determine if mostly silent
            const silenceRatio = silentFrames / totalFrames;
            resolve(silenceRatio > 0.9); // Consider silent if 90% of frames are silent
            return;
          }
          
          // Get audio data
          analyzer.getByteFrequencyData(dataArray);
          
          // Calculate audio level
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength / 255; // Normalize to 0-1
          
          // Check if frame is silent
          if (average < threshold) {
            silentFrames++;
          }
          totalFrames++;
        }, 100); // Check every 100ms
      });
      
      // Set timeout to limit analysis duration
      setTimeout(() => {
        if (!audioElement.paused) {
          audioElement.pause();
        }
      }, duration * 1000);
      
      // Start playing
      audioElement.play().catch(err => {
        console.error('Error playing audio for silence detection:', err);
        resolve(false); // Assume not silent on error
      });
    } catch (err) {
      console.error('Error in silence detection:', err);
      reject(err);
    }
  });
}
