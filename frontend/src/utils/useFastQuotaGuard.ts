import { useState, useCallback } from 'react';
import { useQuota } from './useQuota';

export type QuotaDialogType = 'warning' | 'blocked';

export interface QuotaGuardState {
  showDialog: boolean;
  dialogType: QuotaDialogType;
  usage: number;
  resetDate: Date | null;
}

export interface QuotaGuardActions {
  checkBeforeRecording: () => Promise<boolean>;
  trackUsage: (durationMinutes: number) => void;
  closeDialog: () => void;
}

/**
 * Hook to guard recording actions with quota checks
 * Manages quota checking before recording and tracking after
 * Uses optimized fast checking to prevent UI delays
 */
export function useFastQuotaGuard() {
  const { status, canStartRecording, trackUsage: trackQuotaUsage } = useQuota();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<QuotaDialogType>('warning');

  /**
   * Check quota before allowing recording to start
   * Returns true if recording should proceed, false if blocked
   */
  const checkBeforeRecording = useCallback(async (): Promise<boolean> => {
    const check = await canStartRecording();
    
    if (!check.allowed) {
      // User has exceeded quota - block recording
      setDialogType('blocked');
      setShowDialog(true);
      return false;
    }
    
    // Check if we should show warning (50+ minutes used)
    if (status.warningThresholdReached && !status.limitReached) {
      setDialogType('warning');
      setShowDialog(true);
      // Still allow recording, just warn user
    }
    
    return true; // Allow recording to proceed
  }, [canStartRecording, status]);

  /**
   * Track usage after recording completes
   */
  const trackUsage = useCallback((durationMinutes: number) => {
    if (durationMinutes > 0) {
      trackQuotaUsage(durationMinutes);
    }
  }, [trackQuotaUsage]);

  /**
   * Close the quota dialog
   */
  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  return {
    // State
    state: {
      showDialog,
      dialogType,
      usage: status.usage,
      resetDate: status.resetDate,
    } as QuotaGuardState,
    // Actions
    actions: {
      checkBeforeRecording,
      trackUsage,
      closeDialog,
    } as QuotaGuardActions,
  };
}
