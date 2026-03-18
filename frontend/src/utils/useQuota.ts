import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app';
import brain from 'brain';
import { toast } from 'sonner';

export interface QuotaStatus {
  usage: number;
  remaining: number;
  limit: number;
  resetDate: Date | null;
  warningThresholdReached: boolean;
  limitReached: boolean;
  loading: boolean;
}

/**
 * Hook to check quota status and enforce limits
 */
export function useQuota() {
  const { user } = useCurrentUser();
  const [status, setStatus] = useState<QuotaStatus>({
    usage: 0,
    remaining: 60, // Safe default
    limit: 60,
    resetDate: null,
    warningThresholdReached: false,
    limitReached: false,
    loading: true,
  });

  // Fetch quota status
  const fetchQuota = async () => {
    if (!user) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const response = await brain.get_usage_stats();
      const data = await response.json();

      setStatus({
        usage: data.minutes_used || 0,
        remaining: data.minutes_remaining || 0,
        limit: data.limit || 0,
        resetDate: data.reset_date ? new Date(data.reset_date * 1000) : null,
        warningThresholdReached: data.warning_threshold_reached || false,
        limitReached: data.limit_reached || false,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching quota:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchQuota();
  }, [user]);

  /**
   * Check if user can start a new recording session
   * Returns true if allowed, false if blocked
   * NON-BLOCKING check using cached status
   */
  const canStartRecording = async (): Promise<{
    allowed: boolean;
    reason?: string;
  }> => {
    // Trigger background refresh
    fetchQuota().catch(e => console.error('Background quota refresh failed:', e));

    if (status.limitReached) {
      return {
        allowed: false,
        reason: 'quota_exceeded',
      };
    }

    return { allowed: true };
  };

  /**
   * Track usage after a session completes
   */
  const trackUsage = async (minutesUsed: number) => {
    if (!user || minutesUsed <= 0) return;

    try {
      const response = await brain.track_usage({
        session_id: 'session-' + Date.now(),
        minutes_used: minutesUsed,
      });
      const data = await response.json();

      if (data.success) {
        // Update local status
        await fetchQuota();

        // Show warning if threshold reached
        if (data.warning_threshold_reached && !status.warningThresholdReached) {
          toast.warning(
            `You've used ${Math.round(data.total_usage)} minutes.`,
            { duration: 5000 }
          );
        }

        // Show limit reached message
        if (data.limit_reached) {
          toast.error(
            "You've reached your monthly limit. Usage resets on your billing anniversary.",
            { duration: 7000 }
          );
        }
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  return {
    status,
    canStartRecording,
    trackUsage,
    refreshQuota: fetchQuota,
  };
}
