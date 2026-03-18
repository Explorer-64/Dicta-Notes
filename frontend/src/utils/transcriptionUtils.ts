
// Helper functions for audio transcription

/**
 * Update transcript with updated speaker names
 * This function is more flexible to handle different speaker name formats,
 * including those detected by Gemini from speaker introductions
 */
export const updateTranscriptWithSpeakerNames = (transcript: string, speakerNames: string[]): string => {
  if (!transcript || !speakerNames.length) return transcript;
  
  let updatedTranscript = transcript;
  
  // Create patterns to match different speaker formats
  // This will match both "Speaker X:" and names that Gemini might have detected
  // from introductions like "John Smith:"
  const speakerRegex = /^([^:]+):/gm;
  
  // Find all unique speaker labels in the transcript
  const matches = [...transcript.matchAll(speakerRegex)];
  const uniqueSpeakers = [...new Set(matches.map(match => match[1]))].filter(name => name.trim() !== '');
  
  // For speakers that match the pattern "Speaker X", replace them with provided names
  // Leave other speaker names (likely detected by Gemini) as is
  uniqueSpeakers.forEach((speakerLabel) => {
    const speakerNumMatch = speakerLabel.match(/^Speaker (\d+)$/);
    
    if (speakerNumMatch) {
      // This is a generic "Speaker X" label
      const speakerNum = parseInt(speakerNumMatch[1], 10) - 1;
      
      if (speakerNum >= 0 && speakerNum < speakerNames.length) {
        // Replace with the corresponding name from speakerNames
        const regex = new RegExp(`^${speakerLabel}:`, 'gm');
        updatedTranscript = updatedTranscript.replace(regex, `${speakerNames[speakerNum]}:`);
      }
    }
  });
  
  return updatedTranscript;
};

/**
 * Check if speech recognition is available in the browser
 */
export const isSpeechRecognitionAvailable = (): boolean => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

/**
 * Get SpeechRecognition constructor
 */
export const getSpeechRecognition = (): any => {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
};

/**
 * Convert blob to base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Format seconds to MM:SS display
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Generate a sanitized filename from text
 */
export const createFilename = (title: string): string => {
  return `${title.replace(/\s+/g, '_')}_transcript_${new Date().toISOString().slice(0, 10)}.txt`;
};

/**
 * Download text as a file
 */
export const downloadTextFile = (text: string, filename: string): void => {
  const element = document.createElement('a');
  const file = new Blob([text], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// Add these definitions for TypeScript with DOM
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Detect if audio is mostly silent
export const detectSilence = async (audioBlob: Blob, silenceThreshold = 0.05, minAudioLevel = 0.05): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create context and audio element
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioBlob);

    // Create analyzer
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Connect the audio to the analyzer
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);

    // Track metrics
    let totalSamples = 0;
    let silentSamples = 0;
    let validSamples = false; // Flag to indicate we have some valid audio samples

    // Sample the audio levels
    const checkLevel = () => {
      if (audio.ended) {
        // If we never got valid samples, assume it's silent
        if (!validSamples) {
          resolve(true);
          return;
        }

        // Calculate the proportion of silent samples
        const silenceRatio = silentSamples / totalSamples;
        console.log(`Silence analysis: ${silentSamples}/${totalSamples} samples silent (${(silenceRatio * 100).toFixed(1)}%)`);
        resolve(silenceRatio > silenceThreshold);
        return;
      }

      // Get current audio data
      analyzer.getByteFrequencyData(dataArray);
      totalSamples++;

      // Calculate average level (0-255)
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedLevel = average / 255; // Convert to 0-1 range
      
      // Check if sample is below threshold
      if (normalizedLevel < minAudioLevel) {
        silentSamples++;
      } else {
        validSamples = true; // We have at least one valid audio sample
      }

      // Continue sampling
      requestAnimationFrame(checkLevel);
    };

    // Start playing (muted) and analyzing
    audio.muted = true;
    audio.addEventListener('canplaythrough', () => {
      audio.play().then(() => {
        checkLevel();
      }).catch(err => {
        console.error('Error playing audio for silence detection:', err);
        resolve(false); // Assume not silent on error
      });
    });
    
    // Handle errors
    audio.addEventListener('error', () => {
      console.error('Error loading audio for silence detection');
      resolve(false); // Assume not silent on error
    });
  });
};
export const base64ToBlob = (base64: string, contentType: string = ''): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

/**
 * Check if camera is available in the browser
 */
export const isCameraAvailable = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error checking for camera:', error);
    return false;
  }
};

export const formatUnixTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
