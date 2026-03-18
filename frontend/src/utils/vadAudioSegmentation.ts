import type { MicVAD } from '@ricky0123/vad-web';
import { loadVADModule, createMicVAD } from './lazyVAD';

export interface AudioSegment {
  id: string;
  audioData: Float32Array; // Raw audio data from VAD
  timestamp: number;
  duration: number;
  sequenceNumber: number;
  sessionId?: string;
  metadata?: {
    sampleRate: number;
    channels: number;
    source: 'vad';
  };
}

export interface VADSegmentationConfig {
  sessionId?: string;
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Float32Array) => void;
  vadOptions?: {
    positiveSpeechThreshold?: number;
    negativeSpeechThreshold?: number;
    preSpeechPadFrames?: number;
    redemptionFrames?: number;
    frameSamples?: number;
    workletURL?: string;
    modelURL?: string;
  };
}

export class VADAudioSegmentation {
  private vad: any = null;
  private config: VADSegmentationConfig;
  private segmentCounter = 0;
  private isActive = false;
  private segments: Map<string, AudioSegment> = new Map();
  private currentSegmentData: Float32Array[] = [];
  private currentSegmentStartTime: number = 0;

  constructor(config: VADSegmentationConfig) {
    this.config = config;
  }

  /**
   * Initialize VAD and start listening
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.log('VAD already active');
      return;
    }

    try {
      console.log('Starting VAD audio segmentation...');
      this.isActive = true;
      this.segments.clear(); // Clear any existing segments
      this.sequenceNumber = 0;

      // Create VAD instance with lazy loading
      this.vad = await createMicVAD({
        onSpeechStart: () => {
          console.log('🎤 Speech started');
          this.currentSegmentData = [];
          this.currentSegmentStartTime = Date.now();
        },
        onSpeechEnd: (audio) => {
          console.log('🔇 Speech ended, processing audio data');
          this.handleSpeechSegment(audio);
        },
        onVADMisfire: () => {
          console.log('⚠️ VAD misfire detected');
        },
        // VAD configuration
        workletURL: '/vad.worklet.bundle.min.js',
        modelURL: '/silero_vad.onnx',
        ortConfig: {
          executionProviders: ['webgl', 'wasm'],
        },
      });

      console.log('Starting VAD microphone listening...');
      this.vad.start();
      
      console.log('VAD audio segmentation started successfully');
      
    } catch (error) {
      console.error('Failed to start VAD:', error);
      throw new Error(`VAD initialization failed: ${error}`);
    }
  }

  /**
   * Stop VAD and cleanup
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    try {
      if (this.vad) {
        console.log('Stopping VAD...');
        this.vad.pause();
        this.vad = null;
      }
      
      // CRITICAL: Clear accumulated audio segments to prevent memory leaks
      this.segments.clear();
      console.log('Cleared VAD audio segments from memory');
      
      this.isActive = false;
      console.log('VAD audio segmentation stopped');
      
    } catch (error) {
      console.error('Error stopping VAD:', error);
    }
  }

  /**
   * Create structured audio segment from VAD output
   */
  private createAudioSegment(audioData: Float32Array): AudioSegment {
    const timestamp = Date.now();
    const duration = audioData.length / 16000; // Assuming 16kHz sample rate
    const sequenceNumber = ++this.segmentCounter;
    
    return {
      id: `vad-segment-${this.config.sessionId || 'unknown'}-${timestamp}-${sequenceNumber}`,
      audioData,
      timestamp,
      duration,
      sequenceNumber,
      sessionId: this.config.sessionId,
      metadata: {
        sampleRate: 16000,
        channels: 1,
        source: 'vad'
      }
    };
  }

  /**
   * Store audio segment for later reconstruction
   */
  private async storeSegment(segment: AudioSegment): Promise<void> {
    try {
      // Store in IndexedDB for client-side persistence
      await this.storeInIndexedDB(segment);
      
      // TODO: Also store in Firebase Storage for persistence across sessions
      // This will be implemented when we add backend storage APIs
      
    } catch (error) {
      console.error('Failed to store segment:', error);
      throw error;
    }
  }

  /**
   * Store segment in IndexedDB for local persistence
   */
  private async storeInIndexedDB(segment: AudioSegment): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('DictaNotesAudio', 1);
        
        request.onerror = () => reject(new Error('Failed to open IndexedDB'));
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('audioSegments')) {
            const store = db.createObjectStore('audioSegments', { keyPath: 'id' });
            store.createIndex('sessionId', 'sessionId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('sequenceNumber', 'sequenceNumber', { unique: false });
          }
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['audioSegments'], 'readwrite');
          const store = transaction.objectStore('audioSegments');
          
          // Convert Float32Array to regular array for storage
          const segmentToStore = {
            ...segment,
            audioData: Array.from(segment.audioData)
          };
          
          const addRequest = store.add(segmentToStore);
          
          addRequest.onsuccess = () => {
            console.log('Audio segment stored in IndexedDB:', segment.id);
            resolve();
          };
          
          addRequest.onerror = () => {
            reject(new Error('Failed to store segment in IndexedDB'));
          };
          
          transaction.oncomplete = () => db.close();
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all segments for a session
   */
  async getSessionSegments(sessionId: string): Promise<AudioSegment[]> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('DictaNotesAudio', 1);
        
        request.onerror = () => reject(new Error('Failed to open IndexedDB'));
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['audioSegments'], 'readonly');
          const store = transaction.objectStore('audioSegments');
          const index = store.index('sessionId');
          
          const getRequest = index.getAll(sessionId);
          
          getRequest.onsuccess = () => {
            const segments = getRequest.result.map(segment => ({
              ...segment,
              audioData: new Float32Array(segment.audioData)
            }));
            
            // Sort by sequence number
            segments.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
            
            resolve(segments);
          };
          
          getRequest.onerror = () => {
            reject(new Error('Failed to retrieve segments from IndexedDB'));
          };
          
          transaction.oncomplete = () => db.close();
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clear all segments for a session
   */
  async clearSessionSegments(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('DictaNotesAudio', 1);
        
        request.onerror = () => reject(new Error('Failed to open IndexedDB'));
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['audioSegments'], 'readwrite');
          const store = transaction.objectStore('audioSegments');
          const index = store.index('sessionId');
          
          const getRequest = index.getAllKeys(sessionId);
          
          getRequest.onsuccess = () => {
            const keys = getRequest.result;
            const deletePromises = keys.map(key => {
              return new Promise<void>((resolveDelete, rejectDelete) => {
                const deleteRequest = store.delete(key);
                deleteRequest.onsuccess = () => resolveDelete();
                deleteRequest.onerror = () => rejectDelete(new Error('Failed to delete segment'));
              });
            });
            
            Promise.all(deletePromises)
              .then(() => resolve())
              .catch(reject);
          };
          
          getRequest.onerror = () => {
            reject(new Error('Failed to retrieve segment keys'));
          };
          
          transaction.oncomplete = () => db.close();
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      segmentCount: this.segments.size,
      sequenceNumber: this.segmentCounter
    };
  }

  /**
   * Get live segments (in-memory)
   */
  getLiveSegments(): AudioSegment[] {
    return Array.from(this.segments.values())
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  private handleSpeechSegment(audio: Float32Array) {
    const segment = this.createAudioSegment(audio);
    this.segments.set(segment.id, segment);
    this.storeSegment(segment).catch(error => {
      console.error('Failed to store audio segment:', error);
    });
    this.config.onSpeechEnd?.(audio);
  }
}

/**
 * Utility function to create VAD segmentation instance
 */
export function createVADSegmentation(config: VADSegmentationConfig): VADAudioSegmentation {
  return new VADAudioSegmentation(config);
}

/**
 * Utility function to reconstruct audio from segments
 */
export function reconstructAudioFromSegments(segments: AudioSegment[]): Float32Array {
  // Sort segments by sequence number
  const sortedSegments = segments.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  
  // Calculate total length
  const totalLength = sortedSegments.reduce((sum, segment) => sum + segment.audioData.length, 0);
  
  // Concatenate all segments
  const reconstructedAudio = new Float32Array(totalLength);
  let offset = 0;
  
  for (const segment of sortedSegments) {
    reconstructedAudio.set(segment.audioData, offset);
    offset += segment.audioData.length;
  }
  
  return reconstructedAudio;
}

/**
 * Utility function to convert Float32Array to WAV blob for download/playback
 */
export function audioSegmentsToWAV(segments: AudioSegment[], sampleRate: number = 16000): Blob {
  const reconstructedAudio = reconstructAudioFromSegments(segments);
  return float32ArrayToWAV(reconstructedAudio, sampleRate);
}

/**
 * Convert Float32Array to WAV blob
 */
function float32ArrayToWAV(audioData: Float32Array, sampleRate: number): Blob {
  const length = audioData.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float32 to int16
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    const int16Value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, int16Value, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
