

import { AudioSourceType } from '../recording/audioSourceTypes';
import { detectBrowserCapabilities } from '../recording/browserCapabilities';

/**
 * AudioSourceManager - Single Source of Truth for Audio Stream Decisions
 * 
 * This class centralizes ALL audio source selection and stream creation logic.
 * No other component should directly call getUserMedia or getDisplayMedia.
 * 
 * Architecture:
 * AudioSourceManager.getAudioStream() → AudioCaptain → Consumers
 * 
 * Key Principle: This manager makes the decision, AudioCaptain distributes.
 */

export interface AudioSourceManagerOptions {
  enableLogging?: boolean;
  fallbackToMicrophone?: boolean; // Whether to fallback when preferred source fails
}

export interface AudioStreamResult {
  stream: MediaStream;
  actualSourceType: AudioSourceType;
  sourceInfo: {
    label: string;
    deviceId?: string;
    constraints: MediaStreamConstraints;
  };
}

class AudioSourceManager {
  private options: AudioSourceManagerOptions;
  private static instance: AudioSourceManager | null = null;
  
  constructor(options: AudioSourceManagerOptions = {}) {
    this.options = {
      enableLogging: false,
      fallbackToMicrophone: false,
      ...options
    };
  }

  /**
   * Get singleton instance with logging enabled by default
   */
  static getInstance(): AudioSourceManager {
    if (!AudioSourceManager.instance) {
      AudioSourceManager.instance = new AudioSourceManager({ enableLogging: true });
    }
    return AudioSourceManager.instance;
  }

  /**
   * MAIN METHOD: Get audio stream for specified source type
   * This is the ONLY method components should call for audio
   */
  async getAudioStream(sourceType: AudioSourceType): Promise<AudioStreamResult> {
    this.log(`🎯 AudioSourceManager: Getting audio stream for ${sourceType}`);
    
    try {
      // Validate browser capabilities first
      const capabilities = await detectBrowserCapabilities();
      this.validateSourceSupport(sourceType, capabilities);
      
      let result: AudioStreamResult;
      
      switch (sourceType) {
        case AudioSourceType.MICROPHONE:
          result = await this.getMicrophoneStream();
          break;
          
        case AudioSourceType.SYSTEM_AUDIO:
          result = await this.getSystemAudioStream();
          break;
          
        case AudioSourceType.TAB_AUDIO:
          result = await this.getTabAudioStream();
          break;
          
        default:
          throw new Error(`Unsupported audio source type: ${sourceType}`);
      }
      
      this.log(`✅ AudioSourceManager: Successfully obtained ${result.actualSourceType} stream`);
      this.logStreamDetails(result);
      
      return result;
      
    } catch (error) {
      this.log(`❌ AudioSourceManager: Failed to get ${sourceType} stream:`, error);
      
      // Handle fallback logic if enabled
      if (this.options.fallbackToMicrophone && sourceType !== AudioSourceType.MICROPHONE) {
        this.log(`🔄 AudioSourceManager: Falling back to microphone`);
        try {
          return await this.getMicrophoneStream();
        } catch (fallbackError) {
          throw new Error(`Primary source (${sourceType}) failed and microphone fallback also failed: ${fallbackError}`);
        }
      }
      
      throw new Error(`AudioSourceManager failed to get ${sourceType}: ${error}`);
    }
  }

  /**
   * Get microphone audio stream with optimal settings
   */
  private async getMicrophoneStream(): Promise<AudioStreamResult> {
    this.log('🎤 AudioSourceManager: Capturing microphone audio');
    
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000
      },
      video: false
    };
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in microphone stream');
      }
      
      const primaryTrack = audioTracks[0];
      
      return {
        stream,
        actualSourceType: AudioSourceType.MICROPHONE,
        sourceInfo: {
          label: primaryTrack.label || 'Microphone',
          deviceId: primaryTrack.getSettings().deviceId,
          constraints
        }
      };
      
    } catch (error) {
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            throw new Error('Microphone access denied. Please allow microphone permissions.');
          case 'NotFoundError':
            throw new Error('No microphone device found.');
          case 'NotReadableError':
            throw new Error('Microphone is already in use by another application.');
          default:
            throw new Error(`Microphone access failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Get system audio stream via screen sharing
   */
  private async getSystemAudioStream(): Promise<AudioStreamResult> {
    this.log('🔊 AudioSourceManager: Capturing system audio via screen share');
    
    const constraints: MediaStreamConstraints = {
      video: true, // Required for getDisplayMedia
      audio: true
    };
    
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      const audioTracks = displayStream.getAudioTracks();
      const videoTracks = displayStream.getVideoTracks();
      
      // Check if audio was actually captured
      if (audioTracks.length === 0) {
        // Clean up video tracks
        videoTracks.forEach(track => track.stop());
        throw new Error('No audio tracks captured. User may have denied audio sharing or selected a source without audio.');
      }
      
      // Stop video tracks to save resources (we only need audio)
      videoTracks.forEach(track => track.stop());
      
      // Create audio-only stream
      const audioOnlyStream = new MediaStream(audioTracks);
      
      const primaryTrack = audioTracks[0];
      
      return {
        stream: audioOnlyStream,
        actualSourceType: AudioSourceType.SYSTEM_AUDIO,
        sourceInfo: {
          label: primaryTrack.label || 'System Audio',
          constraints: constraints as MediaStreamConstraints
        }
      };
      
    } catch (error) {
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            throw new Error('Screen sharing denied. Please allow screen sharing to capture system audio.');
          case 'NotSupportedError':
            throw new Error('Screen sharing not supported in this browser.');
          case 'AbortError':
            throw new Error('Screen sharing was cancelled.');
          default:
            throw new Error(`System audio capture failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Get tab audio stream via tab sharing
   */
  private async getTabAudioStream(): Promise<AudioStreamResult> {
    this.log('🌐 AudioSourceManager: Capturing tab audio via tab share');
    
    const constraints: MediaStreamConstraints = {
      video: true, // Required for getDisplayMedia
      audio: true
    };
    
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      const audioTracks = displayStream.getAudioTracks();
      const videoTracks = displayStream.getVideoTracks();
      
      // Check if audio was actually captured
      if (audioTracks.length === 0) {
        // Clean up video tracks
        videoTracks.forEach(track => track.stop());
        throw new Error('No audio tracks captured. Please select a browser tab with audio (like a video call or music player).');
      }
      
      // Stop video tracks to save resources (we only need audio)
      videoTracks.forEach(track => track.stop());
      
      // Create audio-only stream
      const audioOnlyStream = new MediaStream(audioTracks);
      
      const primaryTrack = audioTracks[0];
      
      return {
        stream: audioOnlyStream,
        actualSourceType: AudioSourceType.TAB_AUDIO,
        sourceInfo: {
          label: primaryTrack.label || 'Tab Audio',
          constraints: constraints as MediaStreamConstraints
        }
      };
      
    } catch (error) {
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            throw new Error('Tab sharing denied. Please allow screen sharing and select a browser tab with audio.');
          case 'NotSupportedError':
            throw new Error('Tab sharing not supported in this browser.');
          case 'AbortError':
            throw new Error('Tab sharing was cancelled.');
          default:
            throw new Error(`Tab audio capture failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Validate that the requested source type is supported
   */
  private validateSourceSupport(sourceType: AudioSourceType, capabilities: any): void {
    switch (sourceType) {
      case AudioSourceType.MICROPHONE:
        if (!capabilities.supportsMicrophone) {
          throw new Error('Microphone not supported in this browser');
        }
        break;
        
      case AudioSourceType.SYSTEM_AUDIO:
        if (!capabilities.supportsGetDisplayMedia) {
          throw new Error('Screen sharing not supported in this browser');
        }
        break;
        
      case AudioSourceType.TAB_AUDIO:
        if (!capabilities.supportsGetDisplayMedia) {
          throw new Error('Tab sharing not supported in this browser');
        }
        // Note: We can still try even if supportsTabAudio is false,
        // as user might select a tab with audio
        break;
        
      default:
        throw new Error(`Unsupported audio source type: ${sourceType}`);
    }
  }

  /**
   * Log detailed stream information for debugging
   */
  private logStreamDetails(result: AudioStreamResult): void {
    if (!this.options.enableLogging) return;
    
    const { stream, actualSourceType, sourceInfo } = result;
    const audioTracks = stream.getAudioTracks();
    
    console.log(`🔍 AudioSourceManager: Stream details for ${actualSourceType}:`, {
      sourceInfo,
      streamId: stream.id,
      streamActive: stream.active,
      audioTrackCount: audioTracks.length,
      primaryTrack: audioTracks[0] ? {
        label: audioTracks[0].label,
        enabled: audioTracks[0].enabled,
        readyState: audioTracks[0].readyState,
        settings: audioTracks[0].getSettings()
      } : null
    });
  }

  /**
   * Internal logging method
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.enableLogging) {
      console.log(`[AudioSourceManager] ${message}`, ...args);
    }
  }

  /**
   * Get current browser capabilities for audio sources
   */
  async getBrowserCapabilities() {
    return await detectBrowserCapabilities();
  }
}

// Export singleton instance for simple usage
export const audioSourceManager = AudioSourceManager.getInstance();

// Export class for custom instances
export { AudioSourceManager };

// Export convenience function
export async function getAudioStream(sourceType: AudioSourceType): Promise<AudioStreamResult> {
  return audioSourceManager.getAudioStream(sourceType);
}
