/**
 * Centralized Recording Timer Service
 * 
 * Provides a unified timing service for all recording functionality in Dicta-Notes.
 * This service serves as the single source of truth for recording timing,
 * eliminating timing inconsistencies and duration calculation bugs.
 * 
 * Features:
 * - Unified timer with consistent calculation logic
 * - Event-driven architecture with subscription system
 * - Support for external start times (for coordination between systems)
 * - Support for pause/resume functionality
 * - Automatic cleanup and memory management
 * - Edge case handling (multiple start/stop calls, etc.)
 */

export interface TimerState {
  isRunning: boolean;
  currentTime: number; // Duration in seconds
  startTime: number | null; // Timestamp when recording started
}

export type TimerCallback = (state: TimerState) => void;

export interface RecordingTimerOptions {
  /** Update interval in milliseconds (default: 1000) */
  updateInterval?: number;
  /** External start time for coordination between systems */
  externalStartTime?: number;
  /** Resume from previous recording time (for pause/resume) */
  resumeFromTime?: number;
}

/**
 * Centralized Recording Timer Service
 * 
 * Usage:
 * ```typescript
 * const timer = new RecordingTimerService();
 * 
 * // Subscribe to timer updates
 * const unsubscribe = timer.subscribe((state) => {
 *   console.log(`Recording time: ${state.currentTime}s`);
 * });
 * 
 * // Start recording
 * timer.start({ externalStartTime: Date.now() });
 * 
 * // Stop recording
 * timer.stop();
 * 
 * // Cleanup
 * unsubscribe();
 * timer.destroy();
 * ```
 */
export class RecordingTimerService {
  private startTime: number | null = null;
  private timerRef: number | null = null;
  private resumeTime: number = 0; // Accumulated time from previous sessions
  private finalDuration: number = 0; // Final duration when stopped
  private subscribers: Set<TimerCallback> = new Set();
  private updateInterval: number = 1000; // Default to 1 second
  private isDestroyed: boolean = false;

  constructor() {
    // Bind methods to preserve context
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }

  /**
   * Start the recording timer
   * @param options Timer configuration options
   */
  start(options: RecordingTimerOptions = {}): void {
    if (this.isDestroyed) {
      console.warn('RecordingTimerService: Cannot start - service has been destroyed');
      return;
    }

    // If already running, don't start again
    if (this.timerRef !== null) {
      console.warn('RecordingTimerService: Timer already running');
      return;
    }

    // Reset final duration when starting/resuming
    this.finalDuration = 0;

    // Set configuration
    this.updateInterval = options.updateInterval ?? 1000;
    this.resumeTime = options.resumeFromTime ?? 0;
    
    // Use external start time if provided, otherwise use current time
    this.startTime = options.externalStartTime ?? Date.now();
    
    // Adjust start time if resuming from previous recording
    if (this.resumeTime > 0) {
      this.startTime = this.startTime - (this.resumeTime * 1000);
    }

    // Start the timer
    this.timerRef = window.setInterval(() => {
      this.tick();
    }, this.updateInterval);

    // Immediately notify subscribers with initial state
    this.notifySubscribers();

    console.log('RecordingTimerService: Timer started', {
      startTime: this.startTime,
      resumeTime: this.resumeTime,
      externalStartTime: options.externalStartTime
    });
  }

  /**
   * Stop the recording timer
   */
  stop(): void {
    if (this.timerRef === null) {
      console.warn('RecordingTimerService: Timer not running');
      return;
    }

    // Save final duration before clearing timer
    this.finalDuration = this.getDuration();

    clearInterval(this.timerRef);
    this.timerRef = null;

    // Final notification to subscribers
    this.notifySubscribers();

    console.log('RecordingTimerService: Timer stopped', {
      finalDuration: this.finalDuration,
      startTime: this.startTime
    });
  }

  /**
   * Pause the timer (retains current duration)
   */
  pause(): void {
    if (this.timerRef === null) {
      console.warn('RecordingTimerService: Timer not running, cannot pause');
      return;
    }

    // Save current duration for resume
    this.resumeTime = this.getDuration();
    this.stop();

    console.log('RecordingTimerService: Timer paused', {
      pausedAtDuration: this.resumeTime
    });
  }

  /**
   * Resume the timer from previous duration
   */
  resume(options: Omit<RecordingTimerOptions, 'resumeFromTime'> = {}): void {
    this.start({
      ...options,
      resumeFromTime: this.resumeTime
    });

    console.log('RecordingTimerService: Timer resumed', {
      resumingFromDuration: this.resumeTime
    });
  }

  /**
   * Get current recording duration in seconds
   */
  getDuration(): number {
    // If timer is stopped, return the saved final duration
    if (this.timerRef === null && this.finalDuration > 0) {
      return this.finalDuration;
    }

    if (this.startTime === null) {
      return this.resumeTime;
    }

    // startTime is already adjusted for resumeTime in start(), so don't add it again
    const currentDuration = Math.floor((Date.now() - this.startTime) / 1000);
    return Math.max(0, currentDuration); // Ensure non-negative
  }

  /**
   * Get recording start timestamp
   */
  getStartTime(): number | null {
    return this.startTime;
  }

  /**
   * Get current timer state
   */
  getState(): TimerState {
    return {
      isRunning: this.timerRef !== null,
      currentTime: this.getDuration(),
      startTime: this.startTime
    };
  }

  /**
   * Check if timer is currently running
   */
  isRunning(): boolean {
    return this.timerRef !== null;
  }

  /**
   * Subscribe to timer updates
   * @param callback Function to call on timer updates
   * @returns Unsubscribe function
   */
  subscribe(callback: TimerCallback): () => void {
    if (this.isDestroyed) {
      console.warn('RecordingTimerService: Cannot subscribe - service has been destroyed');
      return () => {};
    }

    this.subscribers.add(callback);

    // Immediately call with current state
    callback(this.getState());

    // Return unsubscribe function
    return () => {
      this.unsubscribe(callback);
    };
  }

  /**
   * Unsubscribe from timer updates
   */
  unsubscribe(callback: TimerCallback): void {
    this.subscribers.delete(callback);
  }

  /**
   * Get number of active subscribers
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  /**
   * Reset timer to initial state (clears all timing data)
   */
  reset(): void {
    this.stop();
    this.startTime = null;
    this.resumeTime = 0;
    this.finalDuration = 0;
    this.notifySubscribers();

    console.log('RecordingTimerService: Timer reset');
  }

  /**
   * Destroy the timer service and cleanup all resources
   */
  destroy(): void {
    this.stop();
    this.subscribers.clear();
    this.isDestroyed = true;

    console.log('RecordingTimerService: Service destroyed');
  }

  /**
   * Internal timer tick handler
   */
  private tick(): void {
    if (this.isDestroyed) {
      this.stop();
      return;
    }

    this.notifySubscribers();
  }

  /**
   * Notify all subscribers with current state
   */
  private notifySubscribers(): void {
    if (this.subscribers.size === 0) {
      return;
    }

    const state = this.getState();
    
    // Use setTimeout to avoid blocking timer
    setTimeout(() => {
      this.subscribers.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('RecordingTimerService: Error in subscriber callback:', error);
        }
      });
    }, 0);
  }
}

/**
 * Singleton instance for app-wide use
 * 
 * Usage:
 * ```typescript
 * import { recordingTimer } from 'utils/recording/RecordingTimerService';
 * 
 * recordingTimer.start();
 * recordingTimer.subscribe((state) => console.log(state));
 * ```
 */
export const recordingTimer = new RecordingTimerService();

/**
 * Create a new timer instance (for cases where singleton is not appropriate)
 */
export const createTimerService = (): RecordingTimerService => {
  return new RecordingTimerService();
};

/**
 * Format duration in seconds to MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Format duration in seconds to HH:MM:SS format
 */
export const formatDurationLong = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
