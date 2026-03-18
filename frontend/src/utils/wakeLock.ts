
/**
 * Wake Lock API implementation for preventing screen sleep during recording
 * 
 * Prevents device screen from going to sleep during active recording sessions,
 * which would cause MediaRecorder and Web Speech API to stop working.
 */

export interface WakeLockManager {
  request(): Promise<boolean>;
  release(): Promise<void>;
  isActive(): boolean;
  isSupported(): boolean;
}

class WakeLockService implements WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;
  private isRequested = false;

  /**
   * Check if Wake Lock API is supported in current browser
   */
  isSupported(): boolean {
    return 'wakeLock' in navigator && 'request' in navigator.wakeLock;
  }

  /**
   * Request wake lock to prevent screen sleep
   * @returns Promise<boolean> - true if wake lock was successfully acquired
   */
  async request(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('⚠️ Wake Lock API not supported in this browser');
      return false;
    }

    if (this.isActive()) {
      console.log('✅ Wake lock already active');
      return true;
    }

    try {
      console.log('🔒 Requesting wake lock to prevent screen sleep...');
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.isRequested = true;

      // Add event listener for when wake lock is released
      this.wakeLock.addEventListener('release', () => {
        console.log('📱 Wake lock was released');
        this.wakeLock = null;
        this.isRequested = false;
        
        // If we're still recording, try to re-acquire the wake lock
        if (this.shouldReacquire()) {
          setTimeout(() => {
            console.log('🔄 Attempting to re-acquire wake lock after release...');
            this.request().catch(error => {
              console.warn('⚠️ Failed to re-acquire wake lock:', error);
            });
          }, 1000);
        }
      });

      console.log('✅ Wake lock acquired successfully - screen will stay on during recording');
      return true;
    } catch (error) {
      console.error('❌ Failed to acquire wake lock:', error);
      this.wakeLock = null;
      this.isRequested = false;
      return false;
    }
  }

  /**
   * Release the wake lock
   */
  async release(): Promise<void> {
    if (!this.wakeLock) {
      console.log('🔓 No wake lock to release');
      return;
    }

    try {
      console.log('🔓 Releasing wake lock...');
      await this.wakeLock.release();
      this.wakeLock = null;
      this.isRequested = false;
      console.log('✅ Wake lock released successfully');
    } catch (error) {
      console.error('❌ Failed to release wake lock:', error);
      // Even if release fails, clear our reference
      this.wakeLock = null;
      this.isRequested = false;
    }
  }

  /**
   * Check if wake lock is currently active
   */
  isActive(): boolean {
    return this.wakeLock !== null && !this.wakeLock.released;
  }

  /**
   * Check if we should try to re-acquire wake lock after it was released
   * This can happen when user switches tabs or minimizes the app
   */
  private shouldReacquire(): boolean {
    // Check if we're still in a recording session
    // This is a simple heuristic - in practice, you'd want to check actual recording state
    return document.visibilityState === 'visible' && this.isRequested;
  }
}

// Singleton instance
export const wakeLockManager = new WakeLockService();

/**
 * Hook for managing wake lock in React components
 */
export function useWakeLock() {
  const request = async (): Promise<boolean> => {
    return wakeLockManager.request();
  };

  const release = async (): Promise<void> => {
    return wakeLockManager.release();
  };

  const isActive = (): boolean => {
    return wakeLockManager.isActive();
  };

  const isSupported = (): boolean => {
    return wakeLockManager.isSupported();
  };

  return {
    request,
    release,
    isActive,
    isSupported
  };
}

/**
 * Utility function to show user notification about wake lock status
 */
export function notifyWakeLockStatus(success: boolean, isSupported: boolean): void {
  if (!isSupported) {
    console.log('ℹ️ Wake Lock not supported - device screen may go to sleep during recording');
    // Show persistent warning toast that user must dismiss
    toast.warning(
      'Screen Sleep Warning: Your device may go to sleep during recording, which could interrupt the session. Please keep your screen active manually.',
      {
        duration: 0, // Persistent - user must dismiss
        id: 'wake-lock-warning',
        description: 'Tap to dismiss this warning',
        action: {
          label: 'Understood',
          onClick: () => toast.dismiss('wake-lock-warning')
        }
      }
    );
    return;
  }

  if (success) {
    console.log('✅ Screen will stay on during recording');
    // Show brief success notification
    toast.success('Screen will stay on during recording', {
      duration: 3000,
      id: 'wake-lock-success'
    });
  } else {
    console.warn('⚠️ Could not prevent screen sleep - recording may be interrupted if device sleeps');
    // Show persistent warning toast when wake lock fails
    toast.warning(
      'Could not prevent screen sleep. Your recording may be interrupted if the device goes to sleep. Please keep your screen active manually.',
      {
        duration: 0, // Persistent - user must dismiss
        id: 'wake-lock-failed',
        description: 'Tap to dismiss this warning',
        action: {
          label: 'Understood',
          onClick: () => toast.dismiss('wake-lock-failed')
        }
      }
    );
  }
}

// Types for TypeScript
declare global {
  interface Navigator {
    wakeLock: {
      request(type: 'screen'): Promise<WakeLockSentinel>;
    };
  }

  interface WakeLockSentinel {
    released: boolean;
    type: 'screen';
    release(): Promise<void>;
    addEventListener(type: 'release', listener: () => void): void;
    removeEventListener(type: 'release', listener: () => void): void;
  }
}
