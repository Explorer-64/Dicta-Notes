
import React, { useEffect, useState, useRef } from "react";
import { storeLocalBackup, clearLocalBackup } from "utils/transcriptionHelpers";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserGuardContext } from "app";
import { CompanyValidator } from "utils/CompanyValidator";
import { recordingTimer } from "utils/recording/RecordingTimerService";

interface Props {
  isRecording: boolean;
  isPaused: boolean;
  transcript: string;
  meetingTitle: string;
  companyId?: string | null;
  transcriptRef?: React.MutableRefObject<string>; // Reference to latest transcript for timer access
}

export const TranscriptionAutoSave: React.FC<Props> = ({
  isRecording,
  isPaused,
  transcript,
  meetingTitle,
  companyId,
  transcriptRef,
}) => {
  const { user } = useUserGuardContext();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [networkError, setNetworkError] = useState<boolean>(false);
  const lastAutoSaveTimeRef = useRef<number>(0); // Track last auto-save time to prevent duplicates

  // Subscribe to singleton timer for auto-save triggers
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const unsubscribe = recordingTimer.subscribe((state) => {
      // Auto-save every 30 seconds based on master clock
      if (
        state.isRunning &&
        state.currentTime > 0 &&
        state.currentTime % 30 === 0
      ) {
        // Prevent duplicate saves by checking if we already saved at this time
        if (lastAutoSaveTimeRef.current !== state.currentTime) {
          lastAutoSaveTimeRef.current = state.currentTime;
          autoSaveTranscript();
        }
      }
    });

    return unsubscribe;
  }, [autoSaveEnabled, isRecording]);

  // Auto save function
  const autoSaveTranscript = async () => {
    // Only save if recording is active and we have some transcript
    // Use transcriptRef if provided (for latest value), otherwise use transcript prop
    const currentTranscript =
      (transcriptRef && transcriptRef.current) || transcript;

    if (!isRecording || !currentTranscript || currentTranscript.trim() === "") {
      return;
    }

    setIsSaving(true);
    setNetworkError(false);

    try {
      // For auto-save, we only store a local backup for crash recovery.
      // The final session is saved once when the recording is stopped.
      storeLocalBackup(currentTranscript, meetingTitle, companyId);
      setLastSaved(new Date());
      console.log(
        `Local backup saved at ${new Date().toLocaleTimeString()} with length ${
          currentTranscript.length
        }`
      );
    } catch (error) {
      console.error("Error saving local backup:", error);
      setNetworkError(true);
      toast.error("Could not save local backup", { id: "backup-error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle auto-save function
  const toggleAutoSave = () => {
    if (autoSaveEnabled) {
      setAutoSaveEnabled(false);
      toast.info("Auto-save disabled");
    } else {
      setAutoSaveEnabled(true);
      if (isRecording && !isPaused) {
        toast.info("Auto-save enabled");
      }
    }
  };

  // Check if user is admin for the company
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (companyId && user) {
        try {
          const isAdmin = await CompanyValidator.isCompanyAdmin(companyId);
          setIsAdmin(isAdmin);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [companyId, user]);

  // Check for local backup on component mount
  useEffect(() => {
    // Check for backup from a potential offline session
    const backupTranscript = sessionStorage.getItem('dictaNotes_transcript_backup');
    const backupTitle = sessionStorage.getItem('dictaNotes_title_backup');
    const backupTimestamp = sessionStorage.getItem('dictaNotes_timestamp_backup');
    
    if (backupTranscript && backupTitle && backupTimestamp) {
      // Show recovery option toast
      toast.info(
        <div className="flex flex-col gap-1">
          <span>Found unsaved transcript from {new Date(backupTimestamp).toLocaleString()}</span>
          <div className="flex gap-2 mt-1">
            <button 
              onClick={() => {
                toast.success('Transcript recovered');
                // We pass the recovered data to parent
                return { 
                  transcript: backupTranscript,
                  meetingTitle: backupTitle
                };
              }}
              className="text-sm font-medium bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Recover
            </button>
            <button 
              onClick={() => {
                // Clear backup
                sessionStorage.removeItem('dictaNotes_transcript_backup');
                sessionStorage.removeItem('dictaNotes_title_backup');
                sessionStorage.removeItem('dictaNotes_timestamp_backup');
                toast.success('Backup cleared');
              }}
              className="text-sm font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
            >
              Discard
            </button>
          </div>
        </div>,
        { duration: 10000 }
      );
    }
  }, []);

  if (!isRecording) {
    return null;
  }

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b mb-2">
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <div 
            className="flex items-center cursor-pointer" 
            onClick={toggleAutoSave}
            title={autoSaveEnabled ? "Disable auto-save" : "Enable auto-save"}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={autoSaveEnabled} 
                      onCheckedChange={toggleAutoSave} 
                      id="auto-save-toggle"
                      aria-label="Toggle auto-save"  
                    />
                    <Label htmlFor="auto-save-toggle">Auto-save</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {autoSaveEnabled ? "Auto-save is enabled" : "Auto-save is disabled"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs">Auto-save: {autoSaveEnabled ? "Enabled" : "Disabled"}</span>
          </div>
        )}
      </div>
      
      {autoSaveEnabled && (
        <div className="flex items-center gap-1">
          {isSaving ? (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
              <span>Saving...</span>
            </>
          ) : networkError ? (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
              <span>Offline - saved locally</span>
            </>
          ) : lastSaved ? (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            </>
          ) : (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
              <span>Ready to save</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
