import { useState, useCallback } from 'react';
import { unstable_useBlocker as useBlocker } from 'react-router-dom';

interface UseRecordingNavigationGuardOptions {
  isRecording: boolean;
  onBlock?: () => void;
}

interface UseRecordingNavigationGuardReturn {
  isBlocked: boolean;
  proceed: () => void;
  reset: () => void;
}

/**
 * Hook to guard against accidental navigation away from the Transcribe page
 * while recording is active. Uses React Router's useBlocker to intercept navigation.
 * 
 * Browser-level navigation (close tab, refresh, external URLs) is NOT blocked by this hook.
 * 
 * @param isRecording - Whether recording is currently active (recording or paused)
 * @param onBlock - Optional callback when navigation is blocked
 * @returns Object with blocked state and control functions
 */
export function useRecordingNavigationGuard({
  isRecording,
  onBlock,
}: UseRecordingNavigationGuardOptions): UseRecordingNavigationGuardReturn {
  // Use React Router's blocker - blocks navigation when isRecording is true
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      // Block if recording and trying to navigate to a different path
      const shouldBlock = isRecording && currentLocation.pathname !== nextLocation.pathname;
      
      if (shouldBlock) {
        console.log('🚧 Navigation blocked - recording in progress');
        onBlock?.();
      }
      
      return shouldBlock;
    }
  );

  /**
   * User clicked "Continue" - proceed with blocked navigation
   */
  const proceed = useCallback(() => {
    if (blocker.state === 'blocked') {
      console.log('✅ User chose to proceed with navigation');
      blocker.proceed();
    }
  }, [blocker]);

  /**
   * User clicked "Cancel" - stay on page
   */
  const reset = useCallback(() => {
    if (blocker.state === 'blocked') {
      console.log('❌ User chose to cancel navigation');
      blocker.reset();
    }
  }, [blocker]);

  return {
    isBlocked: blocker.state === 'blocked',
    proceed,
    reset,
  };
}
