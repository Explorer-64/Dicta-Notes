


import { AudioSourceType } from './audioSourceTypes';

/**
 * Audio Captain - The "one guy" who captures system audio and creates copies
 * for different recording systems (Traditional MediaRecorder + Gemini Live)
 * 
 * This module handles:
 * - Single point of audio capture from system/microphone
 * - Stream cloning to create identical copies
 * - Distribution of audio streams to multiple consumers
 * - Proper cleanup and error handling
 */

export interface AudioCaptainOptions {
  audioSource?: AudioSourceType; // Replace preferSystemAudio with explicit audioSource
  fallbackToMicrophone?: boolean;
  enableLogging?: boolean;
}

export interface AudioStreamCopy {
  id: string;
  stream: MediaStream;
  consumer: string; // 'traditional' | 'gemini-live' | 'test'
}

export class AudioCaptain {
  private originalStream: MediaStream | null = null;
  private originalDisplayStream: MediaStream | null = null;
  private streamCopies: Map<string, AudioStreamCopy> = new Map();
  private isCapturing = false;
  private options: AudioCaptainOptions;

  constructor(options: AudioCaptainOptions = {}) {
    this.options = {
      enableLogging: true,
      audioSource: AudioSourceType.MICROPHONE,
      fallbackToMicrophone: true,
      ...options
    };
  }

  /**
   * The main "recorder" - captures audio from system or microphone
   */
  async captureAudio(): Promise<MediaStream> {
    if (this.isCapturing && this.originalStream) {
      this.log('Audio already being captured, returning existing stream');
      return this.originalStream;
    }

    try {
      this.log('Starting audio capture...');
      
      let stream: MediaStream;
      
      // Use explicit audio source instead of preferSystemAudio
      if (this.options.audioSource === AudioSourceType.SYSTEM_AUDIO) {
        this.log('User selected Meeting Audio - using getDisplayMedia()');
        stream = await this.captureSystemAudio();
      } else {
        this.log('User selected Microphone - using getUserMedia()');
        stream = await this.captureMicrophoneAudio();
      }

      this.originalStream = stream;
      this.isCapturing = true;
      this.log('Audio capture successful');
      
      return stream;
    } catch (error) {
      this.log('Audio capture failed:', error);
      throw new Error(`Audio Captain failed to capture audio: ${error}`);
    }
  }

  /**
   * Update the audio source configuration
   * Must be called before captureAudio() to take effect
   */
  setAudioSource(audioSource: AudioSourceType): void {
    if (this.isCapturing) {
      this.log('Warning: Cannot change audio source while recording is active');
      return;
    }
    
    this.options.audioSource = audioSource;
    this.log(`Audio source updated to: ${audioSource}`);
  }

  /**
   * The "cloning tool" - creates exact copies of the audio stream
   */
  async createStreamCopy(consumerId: string, consumerName: string): Promise<MediaStream> {
    if (!this.originalStream) {
      throw new Error('No original stream available. Call captureAudio() first.');
    }

    try {
      this.log(`Creating stream copy for ${consumerName}`);
      
      // Clone the audio tracks from the original stream
      const audioTracks = this.originalStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in original stream');
      }

      // Create cloned tracks
      const clonedTracks = audioTracks.map(track => track.clone());
      
      // Create new MediaStream with cloned tracks
      const clonedStream = new MediaStream(clonedTracks);
      
      // Store the copy for management
      const streamCopy: AudioStreamCopy = {
        id: consumerId,
        stream: clonedStream,
        consumer: consumerName
      };
      
      this.streamCopies.set(consumerId, streamCopy);
      this.log(`Stream copy created for ${consumerName}, total copies: ${this.streamCopies.size}`);
      
      return clonedStream;
    } catch (error) {
      this.log('Failed to create stream copy:', error);
      throw new Error(`Failed to clone stream for ${consumerName}: ${error}`);
    }
  }

  /**
   * Captures system audio using getDisplayMedia
   */
  private async captureSystemAudio(): Promise<MediaStream> {
    try {
      this.log('Attempting system audio capture...');
      
      // Request display media with audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Extract only audio tracks
      const audioTracks = displayStream.getAudioTracks();
      
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks in system capture');
      }

      // CRITICAL: Keep the original displayStream alive to preserve track lifecycle
      // Stopping video tracks was causing cloned audio tracks to show readyState: "ended"
      // Store reference to prevent garbage collection
      this.originalDisplayStream = displayStream;
      
      // Create audio-only stream but keep original displayStream alive
      const audioStream = new MediaStream(audioTracks);
      this.log('System audio captured successfully');
      
      return audioStream;
    } catch (error) {
      this.log('System audio capture failed:', error);
      
      if (this.options.fallbackToMicrophone) {
        this.log('Falling back to microphone...');
        return this.captureMicrophoneAudio();
      }
      
      throw error;
    }
  }

  /**
   * Captures microphone audio using getUserMedia
   */
  private async captureMicrophoneAudio(): Promise<MediaStream> {
    try {
      this.log('Attempting microphone capture...');
      
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      this.log('Microphone captured successfully');
      return micStream;
    } catch (error) {
      this.log('Microphone capture failed:', error);
      throw error;
    }
  }

  /**
   * Get status information about current audio capture
   */
  getStatus() {
    return {
      isCapturing: this.isCapturing,
      hasOriginalStream: !!this.originalStream,
      activeCopies: this.streamCopies.size,
      consumers: Array.from(this.streamCopies.values()).map(copy => ({
        id: copy.id,
        consumer: copy.consumer,
        streamActive: copy.stream.active
      }))
    };
  }

  /**
   * Stop a specific stream copy
   */
  stopStreamCopy(consumerId: string): void {
    const copy = this.streamCopies.get(consumerId);
    if (copy) {
      copy.stream.getTracks().forEach(track => track.stop());
      this.streamCopies.delete(consumerId);
      this.log(`Stopped stream copy for consumer: ${copy.consumer}`);
    }
  }

  /**
   * Stop all audio capture and clean up resources
   */
  stopAllCapture(): void {
    this.log('Stopping all audio capture...');
    
    // Stop all stream copies
    this.streamCopies.forEach((copy, consumerId) => {
      this.stopStreamCopy(consumerId);
    });
    
    // Stop original stream
    if (this.originalStream) {
      this.originalStream.getTracks().forEach(track => track.stop());
      this.originalStream = null;
    }
    
    this.isCapturing = false;
    this.log('All audio capture stopped');
  }

  /**
   * Internal logging method
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.enableLogging) {
      console.log(`[AudioCaptain] ${message}`, ...args);
    }
  }
}

// Convenience factory function
export function createAudioCaptain(options?: AudioCaptainOptions): AudioCaptain {
  return new AudioCaptain(options);
}

// Export a singleton instance for simple usage
export const audioCaptain = createAudioCaptain({ enableLogging: true });
