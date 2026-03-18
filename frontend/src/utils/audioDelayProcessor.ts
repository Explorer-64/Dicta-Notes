/**
 * Audio Delay Processor Utility
 * 
 * Creates a delayed MediaStream using Web Audio API DelayNode.
 * Sits between AudioCaptain and MicVAD to introduce 2-3 second latency.
 */

export interface DelayProcessorOptions {
  delaySeconds: number;
  maxDelaySeconds?: number;
}

export interface DelayProcessor {
  delayedStream: MediaStream;
  cleanup: () => void;
  /** Ensure the underlying AudioContext is running */
  ensureResumed?: () => Promise<boolean>;
  /** Dynamically update delay time (seconds) */
  setDelay?: (seconds: number) => void;
}

/**
 * Best-effort resume helper for AudioContext
 */
async function ensureContextResumed(audioContext: AudioContext, timeoutMs = 800): Promise<boolean> {
  try {
    // Attempt immediate resume
    if (audioContext.state !== 'running') {
      await audioContext.resume().catch(() => undefined);
    }
  } catch {}

  if (audioContext.state === 'running') return true;

  return await new Promise<boolean>((resolve) => {
    const start = performance.now();
    const onStateChange = async () => {
      console.log('[AudioDelay] AudioContext state changed:', audioContext.state);
      if (audioContext.state === 'running') {
        audioContext.removeEventListener?.('statechange', onStateChange as any);
        resolve(true);
      }
    };

    audioContext.addEventListener?.('statechange', onStateChange as any);

    const tick = async () => {
      if (audioContext.state === 'running') {
        audioContext.removeEventListener?.('statechange', onStateChange as any);
        resolve(true);
        return;
      }
      if (performance.now() - start > timeoutMs) {
        audioContext.removeEventListener?.('statechange', onStateChange as any);
        resolve(false);
        return;
      }
      try {
        await audioContext.resume().catch(() => undefined);
      } catch {}
      setTimeout(tick, 120);
    };

    tick();
  });
}

/**
 * Creates a delayed MediaStream from an input MediaStream
 * @param inputStream - Original MediaStream from AudioCaptain
 * @param options - Delay configuration
 * @returns Object with delayed stream and cleanup function
 */
export function createDelayedStream(
  inputStream: MediaStream, 
  options: DelayProcessorOptions
): DelayProcessor {
  const { delaySeconds, maxDelaySeconds = 3.5 } = options;
  
  // Validate delay time
  if (delaySeconds > maxDelaySeconds) {
    throw new Error(`Delay time ${delaySeconds}s exceeds maximum ${maxDelaySeconds}s`);
  }
  
  // Create Web Audio context and nodes
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(inputStream);
  const delay = audioContext.createDelay(maxDelaySeconds);
  const destination = audioContext.createMediaStreamDestination();
  
  // Configure delay time
  delay.delayTime.value = delaySeconds;
  
  // Connect audio graph: input → delay → output
  source.connect(delay);
  delay.connect(destination);

  // Try to ensure the context is running
  ensureContextResumed(audioContext).then((ok) => {
    console.log('[AudioDelay] Base delayed stream resume:', ok ? 'running' : 'not running');
  });
  
  // Cleanup function to properly dispose resources
  const cleanup = () => {
    try {
      source.disconnect();
      delay.disconnect();
      audioContext.close();
    } catch (error) {
      console.warn('Error during audio delay processor cleanup:', error);
    }
  };
  
  return {
    delayedStream: destination.stream,
    cleanup,
    ensureResumed: () => ensureContextResumed(audioContext),
    setDelay: (seconds: number) => {
      const v = Math.max(0, Math.min(seconds, maxDelaySeconds));
      delay.delayTime.value = v;
      console.log('[AudioDelay] Delay time set to', v, 'seconds');
    },
  };
}

/**
 * Simple wrapper for 2-second delay (common use case)
 */
export function createTwoSecondDelayedStream(inputStream: MediaStream, waitForLanguageDetection?: boolean): DelayProcessor {
  if (waitForLanguageDetection) {
    // Wait for language detection event instead of fixed time
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(inputStream);
    const delay = audioContext.createDelay(10); // Max 10 seconds
    const destination = audioContext.createMediaStreamDestination();
    
    // Start with maximum delay
    delay.delayTime.value = 10;
    source.connect(delay);
    delay.connect(destination);

    // Observe AudioContext state
    const onStateChange = () => {
      console.log('[AudioDelay] (wait mode) AudioContext state:', audioContext.state);
    };
    audioContext.addEventListener?.('statechange', onStateChange as any);

    // Try to resume promptly; fallback to 0s delay if not running quickly
    (async () => {
      const ok = await ensureContextResumed(audioContext, 800);
      if (!ok) {
        console.warn('[AudioDelay] Context not running after 800ms, temporarily bypassing delay (0s)');
        delay.delayTime.value = 0;
      } else {
        console.log('[AudioDelay] Context running; holding at 5s until language detection');
      }
    })();
    
    // Listen for language detection completion
    const handleLanguageDetected = () => {
      console.log('[AudioDelay] Language detection complete, reducing delay to 0.5s');
      delay.delayTime.value = 10; // Small delay for audio smoothness
      window.removeEventListener('languageDetectionComplete', handleLanguageDetected);
    };
    
    window.addEventListener('languageDetectionComplete', handleLanguageDetected);
    
    // Fallback timeout
    const fallbackTimer = setTimeout(() => {
      console.log('[AudioDelay] Fallback timeout, reducing delay');
      delay.delayTime.value = 10;
      window.removeEventListener('languageDetectionComplete', handleLanguageDetected);
    }, 5000);
    
    const cleanup = () => {
      try {
        source.disconnect();
        delay.disconnect();
        audioContext.close();
        window.removeEventListener('languageDetectionComplete', handleLanguageDetected);
        audioContext.removeEventListener?.('statechange', onStateChange as any);
        clearTimeout(fallbackTimer);
      } catch (error) {
        console.warn('Error during audio delay processor cleanup:', error);
      }
    };
    
    return {
      delayedStream: destination.stream,
      cleanup,
      ensureResumed: () => ensureContextResumed(audioContext),
      setDelay: (seconds: number) => {
        const v = Math.max(0, Math.min(seconds, 10));
        delay.delayTime.value = v;
        console.log('[AudioDelay] Delay time set to', v, 'seconds');
      },
    };
  }
  
  return createDelayedStream(inputStream, { delaySeconds: 10 });
}

