/**
 * Recording-aware navigation and update guards
 *
 * Prevents navigation, reloads, or opening external links while a recording is active.
 * Provides helper utilities to defer actions until recording stops.
 */
import { toast } from "sonner";
import { recordingTimer } from "./RecordingTimerService";

/** Return true if a recording is currently active (timer running) */
export const isRecordingActive = (): boolean => {
  try {
    return recordingTimer.isRunning();
  } catch (e) {
    // Fallback safe default
    return false;
  }
};

/**
 * Run a callback once, immediately after recording stops.
 * If no recording is active now, the callback runs right away.
 * Returns an unsubscribe function.
 */
export const onRecordingStopOnce = (cb: () => void): (() => void) => {
  // If not recording, run immediately
  if (!isRecordingActive()) {
    cb();
    return () => {};
  }

  let ran = false;
  const unsubscribe = recordingTimer.subscribe((state) => {
    if (!state.isRunning && !ran) {
      ran = true;
      // Unsubscribe before invoking to avoid reentrancy
      unsubscribe();
      // Run outside the current tick to avoid timing edge cases
      setTimeout(() => cb(), 0);
    }
  });

  return unsubscribe;
};

interface BlockOptions {
  /**
   * Optional function to execute once recording stops (deferred action)
   */
  defer?: () => void;
  /**
   * Optional custom toast when blocking
   */
  toastMessage?: string;
  /**
   * Optional custom toast when deferring
   */
  deferredToastMessage?: string;
}

/**
 * Guard an action; if recording is active, block and show toast.
 * Optionally defer the provided action until recording stops.
 * Returns { blocked: boolean }.
 */
export const blockIfRecording = (
  actionName: string,
  options: BlockOptions = {}
): { blocked: boolean } => {
  if (!isRecordingActive()) {
    return { blocked: false };
  }

  const { defer, toastMessage, deferredToastMessage } = options;

  toast.error(toastMessage ?? `Cannot perform ${actionName} during recording.`);

  if (defer) {
    onRecordingStopOnce(defer);
    toast.info(
      deferredToastMessage ?? `"${actionName}" will apply after you stop recording.`
    );
  }

  return { blocked: true };
};

/**
 * Install a global guard for window.location.reload() so that any attempt
 * to reload while recording is active will be deferred until recording stops.
 * Returns an uninstall function that restores the original reload.
 */
export const installRecordingReloadGuard = (): (() => void) => {
  const originalReload = window.location.reload.bind(window.location) as unknown as (() => void);

  // Patch only once per page lifetime by tagging the function
  const locationAny = window.location as any;
  if (locationAny.__reloadPatchedForRecording === true) {
    // Already patched; return a no-op uninstaller
    return () => {};
  }
  locationAny.__reloadPatchedForRecording = true;

  const guardedReload = (() => {
    if (isRecordingActive()) {
      // Inform the user and defer until recording stops
      toast.info("Update ready; will apply after you stop recording.");
      onRecordingStopOnce(() => {
        originalReload();
      });
      return; // Do not reload now
    }
    // Safe to reload immediately
    originalReload();
  }) as unknown as (() => void);

  // Assign the guarded implementation
  (window.location as any).reload = guardedReload;

  // Provide a way to uninstall/restore original
  return () => {
    (window.location as any).reload = originalReload;
    (window.location as any).__reloadPatchedForRecording = false;
  };
};
