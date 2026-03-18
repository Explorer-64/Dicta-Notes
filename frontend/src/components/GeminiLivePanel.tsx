


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, Mic, MicOff, Play, Square, Loader2 } from 'lucide-react';
import { useGeminiLiveAPI } from 'utils/useGeminiLiveAPI';
import { toast } from 'sonner';
import brain from 'brain';
import { recordingTimer } from 'utils/recording/RecordingTimerService';
import { TranslationControls } from 'components/TranslationControls';
import { clearAllSessionData } from 'utils/sessionCleanup';

interface Props {
  meetingTitle: string;
  meetingPurpose?: string;
  participants?: string[];
  companyId?: string | null;
  // Coordination props for dual recording
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  isExternalRecording?: boolean;
  disabled?: boolean;
}

/**
 * Panel component that provides Gemini Live API transcription functionality
 * for integration into the main Transcribe page alongside traditional recording
 */
export function GeminiLivePanel({
  meetingTitle,
  meetingPurpose = '',
  participants = [],
  companyId,
  onRecordingStart,
  onRecordingStop,
  isExternalRecording = false,
  disabled = false
}: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastSavedSegmentCount, setLastSavedSegmentCount] = useState(0);
  
  // Gemini Live API hook - UNIFIED transcription + translation
  const {
    isConnected,
    isRecording,
    error,
    segments,
    currentSegment,
    startRecording,
    stopRecording,
    clearTranscription
  } = useGeminiLiveAPI(sessionId, 'en', participants || []);
  
  // Live segments are automatically saved to Firestore via saveSegmentToFirestore
  // No need for post-recording session saves since backend now handles this
  
  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    if (disabled) return;
    
    try {
      // CRITICAL: Clear all session storage first to prevent cross-session contamination
      clearAllSessionData();
      console.log('🧹 Cleared all session storage data to prevent cross-session contamination');
      
      // Generate session ID for Gemini Live
      const currentSessionId = `gemini-live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(currentSessionId);
      
      // Start Gemini Live API recording
      await startRecording();
      
      // Notify parent component
      onRecordingStart?.();
      
      console.log('📝 Started Gemini Live recording with session ID:', currentSessionId);
      
    } catch (error) {
      console.error('Failed to start Gemini recording:', error);
      toast.error('Failed to start Gemini Live recording');
    }
  }, [disabled, startRecording, onRecordingStart]);
  
  // Handle recording stop
  const handleStopRecording = useCallback(() => {
    stopRecording();
    onRecordingStop?.();
    console.log('📝 Stopped Gemini Live recording');
  }, [stopRecording, onRecordingStop]);
  
  // Note: Auto-save logic removed since backend now handles complete session saving
  // Live segments are already saved individually via saveSegmentToFirestore
  
  return (
    <div className="space-y-4">
      {/* Gemini Live Transcription Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-blue-600" />
            Gemini Live Transcription
            {isExternalRecording && (
              <Badge variant="outline" className="text-xs">
                Sync with Main
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Recording Controls */}
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              disabled={disabled}
              className="flex items-center gap-2"
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop Live
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Live
                </>
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Live Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Disconnected
                </Badge>
              )}
              
              {isRecording && (
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  <Mic className="w-3 h-3 mr-1" />
                  Gemini Live
                </Badge>
              )}
            </div>
            
            {segments.length > 0 && (
              <Button
                onClick={() => {
                  clearTranscription();
                }}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Transcription Display */}
          <div className="min-h-[300px] max-h-[500px] p-4 bg-blue-50 rounded-lg overflow-y-auto border border-blue-200">
            {segments.length === 0 && !currentSegment && (
              <p className="text-gray-500 text-center">
                {isRecording ? "Listening with Gemini..." : "Click 'Start Live' for real-time Gemini transcription"}
              </p>
            )}
            
            {/* Completed Segments */}
            {segments.map((segment) => (
              <div key={segment.id} className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header with speaker info */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center gap-2">
                  {segment.speaker && (
                    <Badge variant="outline" className="text-xs">
                      {segment.speaker}
                    </Badge>
                  )}
                  {segment.language && (
                    <Badge variant="secondary" className="text-xs">
                      {segment.language.toUpperCase()}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(segment.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {/* Original Transcription */}
                <div className="p-4">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-blue-700">Original Transcription</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {segment.language?.toUpperCase() || 'AUTO'}
                      </Badge>
                    </div>
                    <p className="text-gray-900 text-base leading-relaxed bg-blue-50 p-3 rounded-md border border-blue-200">
                      {segment.text}
                    </p>
                  </div>
                  
                  {/* Translation Section */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-green-700">Translation</span>
                      <Languages className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="bg-green-50 p-3 rounded-md border border-green-200">
                      <TranslationControls 
                        text={segment.text}
                        sourceLanguage={segment.language}
                        colorScheme="green"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Current Segment (Live) */}
            {currentSegment && (
              <div className="mb-4 bg-white rounded-lg shadow-sm border border-blue-300">
                {/* Header for live segment */}
                <div className="px-4 py-2 bg-blue-100 border-b border-blue-300 rounded-t-lg flex items-center gap-2">
                  <Badge variant="default" className="text-xs bg-blue-600 text-white">
                    Live
                  </Badge>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm text-blue-700 font-medium">Recording in progress...</span>
                </div>
                
                {/* Live Transcription */}
                <div className="p-4">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-blue-700">Live Transcription</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        REAL-TIME
                      </Badge>
                    </div>
                    <p className="text-gray-900 text-base leading-relaxed bg-blue-50 p-3 rounded-md border border-blue-200 italic">
                      {currentSegment}
                    </p>
                  </div>
                  
                  {/* Live Translation Section */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-green-700">Live Translation</span>
                      <Languages className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="bg-green-50 p-3 rounded-md border border-green-200">
                      <p className="text-sm text-green-600 italic">Translation will appear after segment completion</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Stats */}
          <div className="mt-4 flex justify-between text-sm text-gray-600">
            <span>Segments: {segments.length}</span>
            {sessionId && (
              <span className="font-mono text-xs">
                ID: {sessionId.split('-').pop()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
