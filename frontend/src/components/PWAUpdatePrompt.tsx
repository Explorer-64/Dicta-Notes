/**
 * Component: PWAUpdatePrompt
 * 
 * Description:
 * Displays a notification when a service worker update is available.
 * Provides users with an option to update the app.
 */

import { useEffect, useState } from "react";
import { usePWAStore } from "../utils/pwaStore";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { isRecordingActive, onRecordingStopOnce } from "utils/recording/navigationGuards";

export function PWAUpdatePrompt() {
  const { updateAvailable, applyUpdate } = usePWAStore();
  const [visible, setVisible] = useState(false);
  const [recording, setRecording] = useState<boolean>(isRecordingActive());

  // Track recording status to reflect button disabled state
  useEffect(() => {
    const unsubscribe = onRecordingStopOnce(() => {
      // When recording stops, update state (and allow clicking again)
      setRecording(false);
    });

    // Quick poll on mount in case not recording
    setRecording(isRecordingActive());

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Show prompt when update is available
  useEffect(() => {
    if (updateAvailable) {
      setVisible(true);
    }
  }, [updateAvailable]);

  // Handle update button click
  const handleUpdateClick = async () => {
    // Guard: do not apply during recording; defer instead
    if (isRecordingActive()) {
      toast.info("Update ready; will apply after you stop recording.");
      setVisible(false);
      onRecordingStopOnce(async () => {
        try {
          await applyUpdate();
          // Controller change will trigger reload; guarded elsewhere
        } catch (error) {
          console.error("Failed to apply update (deferred):", error);
          toast.error("Update failed. Please refresh after recording.");
        }
      });
      return;
    }

    try {
      await applyUpdate();
      toast.success("Updating…");
      // No direct reload; rely on controllerchange listener (guarded)
      setVisible(false);
    } catch (error) {
      console.error("Failed to apply update:", error);
      toast.error("Update failed. Please refresh the page manually.");
    }
  };

  // Don't render anything if no update or prompt dismissed
  if (!visible) return null;

  return (
    <div className="fixed bottom-16 right-4 z-50 max-w-md">
      <Alert className="border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 shadow-lg">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-blue-500 dark:text-blue-400 animate-spin-slow" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">Update Available</AlertTitle>
        </div>
        <AlertDescription className="flex flex-col gap-2 text-blue-700 dark:text-blue-300">
          <p className="text-sm">A new version of Dicta-Notes is ready to install.</p>
          {recording && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              Stop recording to apply the update.
            </p>
          )}
          <div className="flex justify-end space-x-2 mt-2">
            <Button 
              onClick={() => setVisible(false)} 
              variant="outline" 
              size="sm"
              className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-800/50"
            >
              Later
            </Button>
            <Button 
              onClick={handleUpdateClick}
              variant="default" 
              size="sm"
              disabled={recording}
              className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60"
            >
              Update Now
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
