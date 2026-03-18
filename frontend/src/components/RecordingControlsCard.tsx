import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, Play, Square, Loader2, Pause, Settings } from 'lucide-react';
import { InlineSpeakerEditor } from 'components/InlineSpeakerEditor';
import { formatDuration } from 'utils/recording/RecordingTimerService';
import { TimerDisplay } from 'components/TimerDisplay';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { mode, Mode } from 'app';
import type { TranscriptSegment } from 'utils/types';

interface RecordingControlsCardProps {
  // Recording state
  isAnyRecording: boolean;
  isPaused: boolean;
  isStopping: boolean;
  isStarting?: boolean; // NEW: Add loading state
  isTraditionalRecording: boolean;
  
  // Timer state
  timerState: { isRunning: boolean; currentTime: number; startTime: number | null };
  
  // Audio source
  selectedAudioSource: AudioSourceType;
  setSelectedAudioSource: (source: AudioSourceType) => void;
  handleSystemAudioClick: () => void;
  
  // Recording controls
  startBothRecordings: () => void;
  pauseBothRecordings: () => void;
  resumeBothRecordings: () => void;
  stopBothRecordings: () => void;
  
  // Segment data
  browserSegments: TranscriptSegment[];
  liveSegments: any[];
  
  // Speaker editing
  editingSegmentId: string | null;
  speakers: string[];
  handleSpeakerEdit: (segmentId: string) => void;
  handleSpeakerSave: (newSpeaker: string) => void;
  handleSpeakerCancel: () => void;
  
  // Session & clear
  sessionId: string | null;
  clearAllTranscriptionDataHandler: () => void;
  
  // Optional dev features
  saveForLater?: boolean;
  setSaveForLater?: (value: boolean) => void;
}

/**
 * Main recording controls card UI component
 * Extracted from DualRecordingController to improve maintainability
 */
export const RecordingControlsCard: React.FC<RecordingControlsCardProps> = ({
  isAnyRecording,
  isPaused,
  isStopping,
  isStarting,
  isTraditionalRecording,
  timerState,
  selectedAudioSource,
  setSelectedAudioSource,
  handleSystemAudioClick,
  startBothRecordings,
  pauseBothRecordings,
  resumeBothRecordings,
  stopBothRecordings,
  browserSegments,
  liveSegments,
  editingSegmentId,
  speakers,
  handleSpeakerEdit,
  handleSpeakerSave,
  handleSpeakerCancel,
  sessionId,
  clearAllTranscriptionDataHandler,
  saveForLater,
  setSaveForLater,
}) => {
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
        <CardTitle className="text-2xl font-bold text-gray-800">Dual Recording System</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Dev-only Save for Later toggle */}
        {mode === Mode.DEV && setSaveForLater && (
          <div className="hidden items-center gap-2">
            <Switch
              checked={saveForLater}
              onCheckedChange={setSaveForLater}
              disabled={isAnyRecording}
            />
            <Label className="text-sm text-gray-600">
              Save for Later (On-Demand Processing)
            </Label>
          </div>
        )}

        {/* Recording Systems Status */}
        <div className="mb-4 bg-gray-50 p-3 rounded space-y-2">
          <Label className="text-sm font-medium text-gray-700">Active Recording Systems</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ✅ Browser Speech Recognition
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              ✅ Traditional Recording
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            <p><strong>Browser Speech:</strong> Fast local recognition for immediate results</p>
          </div>
        </div>

        {/* Audio Source Selection */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Audio Source:</label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedAudioSource === AudioSourceType.MICROPHONE ? "default" : "outline"}
              onClick={() => setSelectedAudioSource(AudioSourceType.MICROPHONE)}
              disabled={isAnyRecording}
            >
              <Mic className="w-4 h-4 mr-1" />
              Microphone
            </Button>
            <Button
              size="sm"
              variant={selectedAudioSource === AudioSourceType.SYSTEM_AUDIO ? "default" : "outline"}
              onClick={handleSystemAudioClick}
              disabled={isAnyRecording}
            >
              <Settings className="w-4 h-4 mr-1" />
              System Audio
            </Button>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          {!isAnyRecording ? (
            <Button
              onClick={startBothRecordings}
              variant="default"
              size="lg"
              disabled={isStarting}
              className="flex items-center gap-2 px-4 sm:px-8 w-full sm:w-auto min-h-[44px] bg-green-600 hover:bg-green-700 text-white"
            >
              {isStarting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isStarting ? 'Starting...' : 'Start Dual Recording'}
            </Button>
          ) : isPaused ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={resumeBothRecordings}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 px-4 sm:px-6 flex-1 sm:flex-none min-h-[44px] border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Play className="w-5 h-5" />
                Resume
              </Button>
              <Button
                onClick={stopBothRecordings}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2 px-4 sm:px-6 flex-1 sm:flex-none min-h-[44px]"
              >
                <Square className="w-5 h-5" />
                Stop
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={pauseBothRecordings}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 px-4 sm:px-6 flex-1 sm:flex-none min-h-[44px] border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Pause className="w-5 h-5" />
                Pause
              </Button>
              <Button
                onClick={stopBothRecordings}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2 px-4 sm:px-6 flex-1 sm:flex-none min-h-[44px]"
                disabled={isStopping}
              >
                {isStopping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                {isStopping ? 'Stopping...' : 'Stop'}
              </Button>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {/* Transcription Status - Browser Transcription only */}
            {isAnyRecording ? (
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                Browser Transcription
              </Badge>
            ) : (
              <Badge variant="secondary">
                Browser Ready
              </Badge>
            )}
            
            {/* Recording Timer Display */}
            {(timerState.isRunning || timerState.currentTime > 0) && (
              <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-lg min-h-[44px] ${
                timerState.isRunning 
                  ? 'bg-red-50 border-red-200' 
                  : isPaused
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  timerState.isRunning 
                    ? 'bg-red-500 animate-pulse' 
                    : isPaused
                    ? 'bg-yellow-500'
                    : 'bg-gray-400'
                }`} />
                {/* Use isolated TimerDisplay for smooth updates */}
                <TimerDisplay 
                  startTime={timerState.startTime} 
                  isRunning={timerState.isRunning}
                  className={`text-base sm:text-lg ${
                    timerState.isRunning 
                      ? 'text-red-700' 
                      : isPaused
                      ? 'text-yellow-700'
                      : 'text-gray-700'
                  }`} 
                />
                <span className={`text-xs sm:text-sm ${
                  timerState.isRunning 
                    ? 'text-red-600' 
                    : isPaused
                    ? 'text-yellow-600'
                    : 'text-gray-600'
                }`}>
                  {timerState.isRunning ? 'REC' : isPaused ? 'PAUSED' : 'FINAL'}
                </span>
              </div>
            )}
            
            {/* Traditional Recording Status */}
            {isTraditionalRecording && (
              <Badge variant="default" className="bg-blue-100 text-blue-800 min-h-[32px] px-3">
                <Mic className="w-3 h-3 mr-1" />
                <span className="text-xs sm:text-sm">Background Rec</span>
              </Badge>
            )}
            
            {/* Overall Status */}
            {isAnyRecording && (
              <Badge variant="default" className={`min-h-[32px] px-3 ${
                isPaused 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                <div className={`w-1 h-2 rounded-full mr-2 ${
                  isPaused 
                    ? 'bg-yellow-500' 
                    : 'bg-purple-500 animate-pulse'
                }`} />
                <span className="text-xs sm:text-sm">
                  {isPaused ? 'DUAL PAUSED' : 'DUAL ACTIVE'}
                </span>
              </Badge>
            )}
          </div>
        </div>
        
        {/* Clear Button - Positioned standalone (counters hidden per user request) */}
        {(browserSegments.length > 0 || liveSegments.length > 0) && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={clearAllTranscriptionDataHandler}
              variant="outline"
              size="sm"
              className="px-6 py-2 text-sm border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400"
            >
              Clear Screen
            </Button>
          </div>
        )}
        
        {/* Mobile System Audio Dialog */}
        
        {/* Session Info with Recording Time */}
        {sessionId && (
          <div className="mt-4 bg-blue-50 p-3 rounded">
            <div className="flex justify-between text-sm text-blue-700">
              <span>Session: <code className="font-mono text-xs">{sessionId.split('-').pop()}</code></span>
              <span>Recording Time: {formatDuration(timerState.currentTime)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
