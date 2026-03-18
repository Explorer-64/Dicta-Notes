/**
 * This module provides a fallback transcription mechanism for mobile devices
 * when the Web Speech API is not working correctly.
 */

import { isAndroidDevice, isIOSDevice, isMobileDevice, getBrowserInfo } from "./deviceDetection";
import brain from "brain";
import { recordingTimer } from './recording/RecordingTimerService';

// Interface for the fallback transcription service
export interface FallbackTranscriptionService {
  initialize(): Promise<boolean>;
  start(): Promise<void>;
  stop(): Promise<ArrayBuffer | null>;
  isAvailable(): boolean;
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
  setParticipants?: (participants: string[]) => void;
}

/**
 * Audio recorder fallback using MediaRecorder with server-side transcription
 * This approach captures audio in chunks and sends it to the backend for processing
 */
export class ServerSideTranscriptionService implements FallbackTranscriptionService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recording = false;
  private lastProcessedChunk = 0;
  private isIOS: boolean;
  private isiPhone: boolean;
  private captureRetryCount = 0;
  private maxRetries = 3;
  private processingEnabled = true;
  private timerUnsubscribe?: () => void;
  private processingIntervalMs: number;
  private lastProcessingTime = 0;
  private participants: string[] = []; // Store speaker names
  
  // Callbacks
  public onInterimResult?: (text: string) => void;
  public onFinalResult?: (text: string) => void;
  public onError?: (error: string) => void;
  
  constructor() {
    this.isIOS = isIOSDevice();
    // Check if it's specifically an iPhone (not iPad)
    this.isiPhone = this.isIOS && /iPhone/.test(navigator.userAgent);
    
    // Set processing interval based on device type
    this.processingIntervalMs = this.isIOS ? 4000 : 3000;
    
    // Subscribe to singleton timer for coordination
    this.timerUnsubscribe = recordingTimer.subscribe((state) => {
      if (state.isRunning && this.recording && this.processingEnabled) {
        const now = state.currentTime * 1000; // Convert to milliseconds
        
        // Check if enough time has passed for processing (maintain interval logic)
        if (now - this.lastProcessingTime >= this.processingIntervalMs) {
          this.processAudioChunks();
          this.lastProcessingTime = now;
        }
      }
    });
    
    // Log initialization information
    console.log(`[Fallback] Initializing ServerSideTranscriptionService`);
    console.log(`[Fallback] Detected platform: ${this.isIOS ? (this.isiPhone ? 'iPhone' : 'iPad') : 'non-iOS'}`);
    console.log(`[Fallback] Browser info:`, getBrowserInfo());
    
    // Log iOS version if available (useful for debugging)
    if (this.isIOS) {
      const match = navigator.userAgent.match(/OS ([\d_]+) like Mac OS X/);
      if (match) {
        const version = match[1].replace(/_/g, '.');
        console.log(`[Fallback] iOS version: ${version}`);
      }
    }
  }
  
  /**
   * Initialize the service by requesting microphone permissions
   */
  async initialize(): Promise<boolean> {
    try {
      // Request microphone access with enhanced iOS/iPhone-specific constraints
      const constraints: MediaStreamConstraints = { 
        audio: this.isIOS ? {
          // iOS-specific settings - optimized for iPhone
          echoCancellation: this.isiPhone ? false : true, // Disable for iPhones to reduce processing
          noiseSuppression: true,
          autoGainControl: true,
          // iPhone-specific sample rate optimization
          sampleRate: this.isiPhone ? 44100 : undefined, // iPhone prefers 44.1kHz
          channelCount: 1 // Mono recording is more reliable on iOS
        } : true 
      };
      
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (streamError) {
        console.warn('[Fallback] Error with initial constraints, trying simplified constraints:', streamError);
        // iOS Safari sometimes rejects complex constraints, so try a simpler version
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      // Find a supported mime type with improved iPhone compatibility
      let mimeType = 'audio/webm';
      
      // Mime type priorities based on device
      const supportedTypes = this.isiPhone 
        ? ['audio/mp4', 'audio/m4a', 'audio/aac', 'audio/wav'] // iPhone preferred formats
        : this.isIOS
          ? ['audio/mp4', 'audio/aac', 'audio/wav'] // iPad preferred formats
          : ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      
      // Test each mime type systematically
      let foundSupportedType = false;
      for (const type of supportedTypes) {
        try {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            foundSupportedType = true;
            console.log(`[Fallback] Found supported MIME type: ${mimeType}`);
            break;
          }
        } catch (e) {
          console.warn(`[Fallback] Error checking support for ${type}:`, e);
        }
      }
      
      // iOS Safari fallback handling with specific iPhone considerations
      if (!foundSupportedType && this.isIOS) {
        console.log('[Fallback] iOS device without standard MIME type support, using device-specific default');
        
        // For iPhone, use mp4/aac which is most widely supported
        mimeType = this.isiPhone ? 'audio/mp4' : 'audio/wav';
      }
      
      console.log(`[Fallback] Using MIME type: ${mimeType}`);
      
      // Configure MediaRecorder with optimized settings for iPhone
      const options: MediaRecorderOptions = {
        mimeType,
        // Dynamic bitrate based on device type
        audioBitsPerSecond: this.isiPhone ? 24000 : this.isIOS ? 32000 : 16000
      };
      
      try {
        this.mediaRecorder = new MediaRecorder(this.stream, options);
      } catch (mimeError) {
        console.warn(`[Fallback] Failed to create MediaRecorder with mime type ${mimeType}:`, mimeError);
        // Try without specifying a mime type as a last resort
        this.mediaRecorder = new MediaRecorder(this.stream);
      }
      
      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log(`[Fallback] Recorded chunk: ${event.data.size} bytes`);
        }
      };
      
      return true;
    } catch (error) {
      console.error('[Fallback] Error initializing:', error);
      if (this.onError) this.onError(`Could not initialize audio recording: ${error}`);
      return false;
    }
  }
  
  /**
   * Check if this service is available on the current device
   * Now always returns true to ensure functionality on all devices
   */
  isAvailable(): boolean {
    return true;
  }
  
  /**
   * Start recording audio
   */
  async start(): Promise<void> {
    if (!this.mediaRecorder) {
      const initialized = await this.initialize();
      if (!initialized) throw new Error('Failed to initialize media recorder');
    }
    
    try {
      this.audioChunks = [];
      this.lastProcessedChunk = 0;
      this.recording = true;
      this.lastProcessingTime = 0; // Reset processing timer
      
      // Start recording with chunk intervals appropriate for the device
      // iOS devices may benefit from larger chunks to reduce processing overhead
      const chunkInterval = this.isIOS ? 2000 : 1000; // milliseconds
      this.mediaRecorder!.start(chunkInterval);
      console.log(`[Fallback] Started recording with ${chunkInterval}ms chunks`);
      
      // Start the singleton timer to coordinate processing
      recordingTimer.start();
      console.log(`[Fallback] Coordinating with singleton timer for ${this.processingIntervalMs}ms processing intervals`);
      
    } catch (error) {
      console.error('[Fallback] Error starting recording:', error);
      if (this.onError) this.onError(`Error starting recording: ${error}`);
    }
  }
  
  /**
   * Stop recording and return the final audio buffer
   */
  async stop(): Promise<ArrayBuffer | null> {
    if (!this.mediaRecorder || !this.recording) {
      return null;
    }
    
    try {
      this.recording = false;
      
      // Stop coordinating with the singleton timer
      recordingTimer.stop();
      console.log('[Fallback] Stopped coordination with singleton timer');
      
      // iOS requires a small delay before stopping MediaRecorder
      if (this.isIOS) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Stop recording
      this.mediaRecorder.stop();
      console.log('[Fallback] Stopped recording');
      
      // iOS requires a small delay after stopping MediaRecorder
      if (this.isIOS) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Process any remaining audio chunks
      await this.processAudioChunks(true);
      
      // Combine all chunks into one audio blob
      const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
      
      // Convert to ArrayBuffer for further processing if needed
      return await new Response(audioBlob).arrayBuffer();
    } catch (error) {
      console.error('[Fallback] Error stopping recording:', error);
      if (this.onError) this.onError(`Error stopping recording: ${error}`);
      return null;
    }
  }
  
  /**
   * Process recorded audio chunks and send to server for transcription
   */
  private async processAudioChunks(isFinal = false): Promise<void> {
    // If no new chunks to process, return
    if (this.audioChunks.length <= this.lastProcessedChunk && !isFinal) {
      return;
    }
    
    try {
      // Get chunks that haven't been processed yet
      const chunksToProcess = isFinal 
        ? this.audioChunks // Process all for final result
        : this.audioChunks.slice(this.lastProcessedChunk);
      
      if (chunksToProcess.length === 0) return;
      
      // Combine chunks into a single blob
      const audioBlob = new Blob(chunksToProcess, { 
        type: this.mediaRecorder?.mimeType || (this.isIOS ? 'audio/mp4' : 'audio/webm')
      });
      
      console.log(`[Fallback] Processing ${chunksToProcess.length} audio chunks, size: ${audioBlob.size} bytes`);
      
      // If the blob is too small, it might not contain enough audio data
      if (audioBlob.size < 1000 && !isFinal) {
        console.log('[Fallback] Audio blob too small, skipping');
        return;
      }
      
      // For iOS, we might need to do additional processing
      let processingBlob = audioBlob;
      if (this.isIOS) {
        // iOS Safari sometimes needs special handling
        console.log('[Fallback] Preparing audio data for iOS');
      }
      
      // Call the backend API for transcription
      try {
        // Create a proper FormData object with the correct content type
        const formData = new FormData();
        
        // Create a proper File object with the correct filename and content type
        // This helps ensure proper multipart boundary handling
        const fileType = this.mediaRecorder?.mimeType || (this.isIOS ? 'audio/mp4' : 'audio/webm');
        const fileName = this.isIOS ? 'recording.mp4' : 'recording.webm';
        
        // Log the exact audio format being used
        console.log(`[Fallback] Creating file with type ${fileType} and name ${fileName}`);
        
        // Use proper File constructor instead of just appending blob to FormData
        const file = new File([processingBlob], fileName, { type: fileType });
        console.log(`[Fallback] Created File object: size=${file.size}, type=${file.type}`);
        
        // Append the file first to ensure it's at the beginning of the FormData
        formData.append('file', file);
        
        // Add metadata fields to help with server-side processing
        if (isFinal) {
          formData.append('meeting_title', 'Mobile Transcription');
        }
        formData.append('device_type', this.isIOS ? 'ios' : 'android');
        formData.append('browser_info', JSON.stringify(getBrowserInfo()));
        formData.append('is_final', isFinal ? 'true' : 'false');
        
        // Pass speaker names to backend for proper speaker identification
        if (this.participants.length > 0) {
          formData.append('participants', JSON.stringify(this.participants));
          console.log(`[Fallback] Passing ${this.participants.length} speaker names:`, this.participants);
        }
        
        // Make the API request
        console.log(`[Fallback] Sending ${file.size} bytes to server for transcription`);
        
        // Add a timeout to handle stalled requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await brain.upload_audio_file(formData);
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Fallback] API error: ${response.status} - ${errorText}`);
            
            // Provide more user-friendly error messages
            if (response.status === 413) {
              throw new Error('Audio file too large. Try recording a shorter segment.');
            } else if (response.status === 415) {
              throw new Error('Audio format not supported. Try using a different browser.');
            } else {
              throw new Error(`Server error (${response.status}). Please try again.`);
            }
          }
          
          console.log('[Fallback] Successfully sent audio to server');
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') {
            throw new Error('Transcription request timed out. Check your internet connection.');
          }
          throw fetchError;
        }
        
        const result = await response.json();
        
        if (result && result.full_text) {
          console.log(`[Fallback] Transcription result:`, result.full_text);
          
          // Call the appropriate callback based on whether this is a final result
          if (isFinal && this.onFinalResult) {
            this.onFinalResult(result.full_text);
          } else if (this.onInterimResult) {
            this.onInterimResult(result.full_text);
            
            // Manually update the transcript display for mobile devices
            // This ensures interim results are visible on the screen
            const displayElement = document.getElementById('interim-transcript');
            if (displayElement) {
              // Remove the sr-only class to make it visible if it exists
              displayElement.classList.remove('sr-only');
              displayElement.textContent = result.full_text;
            }
          }
        }
      } catch (apiError) {
        console.error('[Fallback] API error:', apiError);
        if (this.onError) this.onError(`Transcription API error: ${apiError}`);
      }
      
      // Update the last processed chunk index
      if (!isFinal) {
        this.lastProcessedChunk = this.audioChunks.length;
      }
    } catch (error) {
      console.error('[Fallback] Error processing audio chunks:', error);
      if (this.onError) this.onError(`Error processing audio: ${error}`);
    }
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up timer subscription
    if (this.timerUnsubscribe) {
      this.timerUnsubscribe();
      this.timerUnsubscribe = undefined;
    }
    
    if (this.mediaRecorder && this.recording) {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.audioChunks = [];
    this.recording = false;
  }
  
  setParticipants(participants: string[]): void {
    this.participants = participants;
  }
}

/**
 * Factory function to create the appropriate transcription service
 * All devices are now supported without compatibility checks
 */
export async function createTranscriptionService(): Promise<FallbackTranscriptionService> {
  // Create an instance of our server-side fallback
  const service = new ServerSideTranscriptionService();
  
  try {
    // Initialize the service
    console.log('Initializing transcription service...');
    await service.initialize();
    console.log('Transcription service ready');
  } catch (error) {
    // Log the error but don't throw - allow the app to continue
    console.warn('Error during transcription service initialization:', error);
    console.log('Will attempt to recover during use');
  }
  
  // Always return the service regardless of initialization outcome
  // This ensures functionality on all devices, with graceful recovery
  return service;
}








