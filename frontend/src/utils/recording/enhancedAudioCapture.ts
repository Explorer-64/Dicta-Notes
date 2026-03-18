import { AudioSourceType, AudioCaptureResult, AudioCaptureConstraints } from './audioSourceTypes';
import { detectBrowserCapabilities } from './browserCapabilities';

/**
 * Enhanced media recorder that supports multiple audio sources including system audio
 */
export class EnhancedAudioCapture {
  private currentStream: MediaStream | null = null;
  private currentSourceType: AudioSourceType = AudioSourceType.MICROPHONE;
  
  /**
   * Capture audio using getDisplayMedia for meeting platforms
   */
  async captureSystemAudio(): Promise<AudioCaptureResult> {
    try {
      console.log('🔊 Attempting to capture system audio via screen share...');
      
      // Request screen share with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Required for screen share
        audio: true  // Request system audio
      });
      
      console.log('✅ Screen share granted, checking audio tracks...');
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      
      if (audioTracks.length === 0) {
        // No audio captured, clean up video and throw error
        videoTracks.forEach(track => track.stop());
        throw new Error('No audio was captured. Make sure to check "Share tab audio" or "Share system audio" when sharing.');
      }
      
      console.log(`✅ Captured ${audioTracks.length} audio track(s) and ${videoTracks.length} video track(s)`);
      
      // Create audio-only stream from the captured audio
      const audioOnlyStream = new MediaStream();
      audioTracks.forEach(track => {
        console.log(`Audio track: ${track.label}, enabled: ${track.enabled}`);
        audioOnlyStream.addTrack(track);
      });
      
      // Stop video tracks since we only need audio
      videoTracks.forEach(track => {
        console.log(`Stopping video track: ${track.label}`);
        track.stop();
      });
      
      this.currentStream = audioOnlyStream;
      this.currentSourceType = AudioSourceType.SYSTEM_AUDIO;
      
      return {
        stream: audioOnlyStream,
        sourceType: AudioSourceType.SYSTEM_AUDIO,
        displayInfo: {
          isScreenShare: true,
          hasSystemAudio: true,
          hasTabAudio: false
        }
      };
    } catch (error) {
      console.error('❌ Failed to capture system audio:', error);
      throw new Error(`Failed to capture meeting audio: ${error instanceof Error ? error.message : 'Unknown error'}. Try using Chrome or Edge for best results.`);
    }
  }
  
  /**
   * Capture audio from microphone (fallback method)
   */
  async captureMicrophoneAudio(): Promise<AudioCaptureResult> {
    try {
      console.log('🎤 Capturing microphone audio...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ Microphone access granted');
      
      this.currentStream = stream;
      this.currentSourceType = AudioSourceType.MICROPHONE;
      
      return {
        stream,
        sourceType: AudioSourceType.MICROPHONE,
        displayInfo: {
          isScreenShare: false,
          hasSystemAudio: false,
          hasTabAudio: false
        }
      };
    } catch (error) {
      console.error('❌ Failed to capture microphone audio:', error);
      throw new Error(`Failed to access microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Auto-select and capture the best available audio source
   */
  async captureAudio(preferredSource?: AudioSourceType): Promise<AudioCaptureResult> {
    const capabilities = await detectBrowserCapabilities();
    
    // If user specifically requested system audio or if it's supported and no preference
    if (preferredSource === AudioSourceType.SYSTEM_AUDIO || 
        (!preferredSource && (capabilities.supportsSystemAudio || capabilities.supportsTabAudio))) {
      
      try {
        return await this.captureSystemAudio();
      } catch (error) {
        console.warn('⚠️ System audio capture failed, falling back to microphone:', error);
        // Fall through to microphone capture
      }
    }
    
    // Default to microphone
    return await this.captureMicrophoneAudio();
  }
  
  /**
   * Stop current audio capture
   */
  stopCapture(): void {
    if (this.currentStream) {
      console.log(`🛑 Stopping ${this.currentSourceType} capture...`);
      this.currentStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.label}`);
      });
      this.currentStream = null;
    }
  }
  
  /**
   * Get current stream info
   */
  getCurrentCapture(): { stream: MediaStream | null; sourceType: AudioSourceType } {
    return {
      stream: this.currentStream,
      sourceType: this.currentSourceType
    };
  }
  
  /**
   * Check if currently capturing system audio
   */
  isCapturingSystemAudio(): boolean {
    return this.currentSourceType === AudioSourceType.SYSTEM_AUDIO && this.currentStream !== null;
  }
}

/**
 * Initialize enhanced media recorder with the captured audio stream
 */
export async function initializeEnhancedMediaRecorder(
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  audioChunksRef: React.MutableRefObject<Blob[]>,
  setErrorMessage: (message: string | null) => void,
  audioCapture: EnhancedAudioCapture,
  preferredSource?: AudioSourceType
): Promise<{ success: boolean; sourceType: AudioSourceType; displayInfo?: any }> {
  try {
    // Capture audio using enhanced capture
    const result = await audioCapture.captureAudio(preferredSource);
    
    console.log(`✅ Audio captured successfully from ${result.sourceType}`);
    
    // Define potential MIME types (same as original)
    const potentialTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
    ];
    
    const supportedTypes = potentialTypes.filter(type => MediaRecorder.isTypeSupported(type));
    console.log('Supported recording MIME types:', supportedTypes);
    
    const options: MediaRecorderOptions = {};
    if (supportedTypes.length > 0) {
      options.mimeType = supportedTypes[0];
      console.log(`Using MIME type: ${options.mimeType}`);
    }
    
    // Create MediaRecorder with the captured stream
    mediaRecorderRef.current = new MediaRecorder(result.stream, options);
    audioChunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (event: { data: Blob }) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    return {
      success: true,
      sourceType: result.sourceType,
      displayInfo: result.displayInfo
    };
  } catch (error) {
    console.error('❌ Enhanced media recorder initialization failed:', error);
    setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize audio capture');
    return {
      success: false,
      sourceType: AudioSourceType.MICROPHONE
    };
  }
}
