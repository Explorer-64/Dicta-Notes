import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Pause, Play, Save, FileDown } from "lucide-react";
import { formatTime } from "utils/transcriptionUtils";
import { ModuleStatusIndicators } from "components/ModuleStatusIndicators";
import { useSafeModuleContext } from "utils/ModuleContext";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ShareableSession {
  id: string;
  title: string;
  createdAt: string;
}

interface Props {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  recordingTime: number;
  hasTranscript: boolean;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onSaveTranscript: () => void;
  // New props for session selection
  shareableSessions?: ShareableSession[];
  selectedSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
}

export const TranscriptionControls: React.FC<Props> = ({
  isRecording,
  isPaused,
  isProcessing,
  recordingTime,
  hasTranscript,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onSaveTranscript,
  shareableSessions = [],
  selectedSessionId,
  onSessionSelect,
}) => {
  const { hasModuleAccess } = useSafeModuleContext();
  const isRecordingEnabled = hasModuleAccess('recording');
  const isStorageEnabled = hasModuleAccess('persistence');
  
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
    <div className="flex flex-col space-y-5 sm:space-y-3">
      {/* Session Selection Dropdown */}
      {!isRecording && shareableSessions.length > 0 && onSessionSelect && (
        <div className="flex flex-col space-y-2">
          <Label htmlFor="session-select" className="text-sm font-medium">
            Choose Session (Optional)
          </Label>
          <Select value={selectedSessionId || "new"} onValueChange={(value) => {
            if (value === "new") {
              onSessionSelect("");
            } else {
              onSessionSelect(value);
            }
          }}>
            <SelectTrigger id="session-select" className="w-full max-w-md">
              <SelectValue placeholder="Start new session or choose existing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">
                <span className="flex items-center gap-2">
                  <span>🆕</span>
                  <span>Start New Session</span>
                </span>
              </SelectItem>
              {shareableSessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <span className="flex items-center gap-2">
                    <span>📝</span>
                    <span>{session.title}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {selectedSessionId 
              ? "Recording will continue the selected shared session" 
              : "Recording will create a new private session"
            }
          </p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-3 justify-center sm:justify-start items-center">
          {!isRecording ? (
            <>
              <Button 
                onClick={onStartRecording}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 h-16 sm:h-12 px-6 sm:px-4 text-lg sm:text-base rounded-full sm:rounded-md w-full sm:w-auto max-w-sm mx-auto sm:mx-0 shadow-md"
              >
                <Mic className="mr-2 h-7 w-7 sm:h-5 sm:w-5" />
                Start Recording
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
          ) : isPaused ? (
            <Button 
              onClick={onResumeRecording}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 h-16 sm:h-12 px-6 sm:px-4 text-lg sm:text-base rounded-full sm:rounded-md w-full sm:w-auto max-w-sm mx-auto sm:mx-0 shadow-md"
            >
              <Play className="mr-2 h-7 w-7 sm:h-5 sm:w-5" />
              Resume
            </Button>
          ) : (
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
            >
              <MicOff className="mr-2 h-7 w-7 sm:h-5 sm:w-5" />
              Stop Recording
            </Button>
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
          
          {hasTranscript && (
            <Button 
              onClick={onSaveTranscript}
              variant="outline"
              size="sm"
              className="text-gray-600 h-12 sm:h-12 px-6 sm:px-4 rounded-full sm:rounded-md text-lg sm:text-sm shadow-md"
            >
              <FileDown className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
              Download
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};