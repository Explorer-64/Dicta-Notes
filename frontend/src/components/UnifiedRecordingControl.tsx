import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Pause, Play } from "lucide-react";
import { formatTime } from "utils/transcriptionUtils";
import { ModuleStatusIndicators } from "components/ModuleStatusIndicators";
import { useSafeModuleContext } from "utils/ModuleContext";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

export interface Props {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  // Enhanced props for multiple recording contexts
  recordingType?: 'live' | 'traditional' | 'unified';
  showPauseResume?: boolean;
  customStartText?: string;
  customStopText?: string;
  additionalActions?: React.ReactNode;
}

const UnifiedRecordingControl: React.FC<Props> = ({
  isRecording,
  isPaused,
  isProcessing,
  recordingTime,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  recordingType = 'live',
  showPauseResume = true,
  customStartText,
  customStopText,
  additionalActions,
}) => {
  const { hasModuleAccess } = useSafeModuleContext();
  const isRecordingEnabled = hasModuleAccess('recording');
  const isStorageEnabled = hasModuleAccess('persistence');
  
  // Get dynamic button text
  const getStartButtonText = () => customStartText || "Start Recording";
  const getStopButtonText = () => customStopText || "Stop Recording";
  
  // Get module status messages (these should be translatable)
  const getRecordingMessage = () => {
    if (isRecordingEnabled) {
      return "Audio files can be downloaded and shared";
    } else {
      return "Audio available during session only";
    }
  };
  
  const getStorageMessage = () => {
    if (isStorageEnabled) {
      return "Transcript files can be downloaded and shared";
    } else {
      return "Transcripts available during session only";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-3 justify-center sm:justify-start items-center">
        {!isRecording ? (
          <>
            <Button 
              onClick={onStartRecording}
              disabled={isProcessing}
              className={`transition-all duration-200 ${
                recordingType === 'traditional' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } h-16 sm:h-12 px-6 sm:px-4 text-lg sm:text-base rounded-full sm:rounded-md w-full sm:w-auto max-w-sm mx-auto sm:mx-0 shadow-md`}
              data-testid="start-recording-button"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-7 w-7 sm:h-5 sm:w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-7 w-7 sm:h-5 sm:w-5" />
                  {getStartButtonText()}
                </>
              )}
            </Button>
            
            <div className="flex items-center gap-3">
              <ModuleStatusIndicators compact={true} className="flex-wrap" />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon size={16} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center" className="max-w-md">
                    <div className="space-y-2 p-1">
                      <p className="font-medium">Recording Behavior:</p>
                      <ul className="text-xs space-y-1 list-disc pl-4">
                        <li>Transcription always happens during the meeting</li>
                        <li>Audio is always recorded temporarily during the session</li>
                        <li><strong>Transcript Files:</strong> {isStorageEnabled ? "Can be downloaded and shared" : "Available during session only"}</li>
                        <li><strong>Audio Files:</strong> {isRecordingEnabled ? "Can be downloaded and shared" : "Available during session only"}</li>
                        <li>Each file type can be enabled/disabled independently</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </>
        ) : showPauseResume && isPaused ? (
          <Button 
            onClick={onResumeRecording}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 h-16 sm:h-12 px-6 sm:px-4 text-lg sm:text-base rounded-full sm:rounded-md w-full sm:w-auto max-w-sm mx-auto sm:mx-0 shadow-md"
          >
            <Play className="mr-2 h-7 w-7 sm:h-5 sm:w-5" />
            Resume
          </Button>
        ) : showPauseResume && (
          <Button 
            onClick={onPauseRecording}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 h-16 sm:h-12 px-6 sm:px-4 text-lg sm:text-base rounded-full sm:rounded-md w-full sm:w-auto max-w-sm mx-auto sm:mx-0 shadow-md"
          >
            <Pause className="mr-2 h-7 w-7 sm:h-5 sm:w-5" />
            Pause
          </Button>
        )}
        
        {isRecording && (
          <Button 
            onClick={onStopRecording}
            variant="destructive"
            disabled={isProcessing}
            className="h-16 sm:h-12 px-6 sm:px-4 text-lg sm:text-base rounded-full sm:rounded-md w-full sm:w-auto max-w-sm mx-auto sm:mx-0 shadow-md"
            data-testid="stop-recording-button"
          >
            <Square className="mr-2 h-7 w-7 sm:h-5 sm:w-5" />
            {getStopButtonText()}
          </Button>
        )}
        
        {/* Additional actions for different recording types */}
        {additionalActions && (
          <div className="flex items-center gap-2">
            {additionalActions}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center sm:justify-end space-x-4">
        {isRecording && (
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 h-12 sm:h-12 px-4 bg-gray-100 rounded-full sm:rounded-md shadow-sm">
              <div className={`h-4 w-4 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-base sm:text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <div className={isRecordingEnabled ? "text-green-600" : "text-amber-600"}>
                {getRecordingMessage()}
              </div>
              <div className={isStorageEnabled ? "text-green-600" : "text-amber-600"}>
                {getStorageMessage()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Support both named and default exports
export { UnifiedRecordingControl };
export default UnifiedRecordingControl;
