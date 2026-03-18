import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { TranscriptSegment } from 'utils/persistentTranscriptionUtils';
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { saveTranscriptionState, loadTranscriptionState, clearTranscriptionState } from "../utils/transcriptionStorageUtils";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedRecordingControl } from "components/UnifiedRecordingControl";
import { DualTranscriptionDisplay } from "components/DualTranscriptionDisplay";
import { SpeakerNameEditor } from "components/SpeakerNameEditor";
import { TranscriptionAutoSave } from "components/TranscriptionAutoSave";
import { AudioPreview } from "components/AudioPreview";
import { SessionSavedModal } from "components/SessionSavedModal";
import { Download, FileDown } from "lucide-react";
import { createFilename, downloadTextFile, createAudioBlob } from "utils/mediaRecorderUtils";
import brain from "brain";
import { toast } from "sonner";
import { isAndroidDevice, isIOSDevice, isMobileDevice } from "../utils/deviceDetection";
import { updateTranscriptWithSpeakerNames, storeLocalBackup } from "utils/transcriptionHelpers";
import { useSafeModuleContext } from "utils/ModuleContext";
import { trackSpeakerChange } from "../utils/speakerTimelineUtils";
import { useLiveTranscriptSegments } from "utils/hooks/useLiveTranscriptSegments";
import { isAdminUser } from "../utils/adminAccess";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { firebaseApp, useCurrentUser } from "app";
import { useRecordingManager } from '../utils/hooks/useRecordingManager';
import { recordingTimer } from 'utils/recording/RecordingTimerService';
import { loadBrowserSpeechData, clearBrowserSpeechData } from '../utils/browserSpeechStorage';
import { blobToBase64 } from "utils/transcriptionUtils";

interface Props {
  meetingTitle: string;
  meetingPurpose?: string;
  participants?: string[];
  onTranscriptUpdate?: (transcript: string) => void;
  companyId?: string | null;
  onParticipantsUpdate?: (participants: string[]) => void;
  speakerTimeline?: any[];
  clientName?: string;
  projectName?: string;
  tags?: string[];
  // NEW: Enhanced session management
  onBrowserSegmentUpdate?: (segments: any[]) => void;
  onInterimSegmentUpdate?: (segment: any | null) => void;
  sessionId?: string | null;
  speakerNames?: Record<string, string>;
  onSpeakerNamesChange?: (names: Record<string, string>) => void;
  // Add enableGeminiLive prop for exclusive mode control
  enableGeminiLive?: boolean;
  // NEW: Add VAD stream from Audio Captain
  vadStream?: MediaStream;
  // Add metadata field for fire-and-forget session saving
  languagePreference?: string;
  // NEW: Control architecture via parent toggle (false=v1, true=v2)
  saveForLater?: boolean;
  onProcessingStateChange?: (isProcessing: boolean) => void;
  onAudioReady?: (blob: Blob) => void;
}

export interface LiveTranscriptionHandle {
  startRecording: (overrideStream?: MediaStream) => Promise<void>;
  stopRecording: () => Promise<void>;
  // NEW: Add pause/resume methods to prevent premature processing
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  isRecording: boolean;
  isProcessing: boolean;
  // NEW: Add isPaused state
  isPaused: boolean;
  // Browser speech data access
  browserSegments: TranscriptSegment[];
  interimSegment: TranscriptSegment | null;
}

export const LiveTranscription = forwardRef<LiveTranscriptionHandle, Props>(({   
  meetingTitle, 
  meetingPurpose,
  participants,
  onTranscriptUpdate,
  companyId,
  onParticipantsUpdate,
  speakerTimeline,
  clientName,
  projectName,
  tags,
  sessionId: externalSessionId,
  enableGeminiLive,
  vadStream, // NEW: Extract VAD stream from props
  languagePreference, // NEW: Extract language preference from props
  saveForLater = false, // NEW: Extract Save for Later toggle
  onBrowserSegmentUpdate,
  onInterimSegmentUpdate,
  onProcessingStateChange,
  onAudioReady
}, ref) => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const isAdmin = isAdminUser(user);
  const { hasModuleAccess } = useSafeModuleContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Use the recording manager hook
  const recording = useRecordingManager({
    meetingTitle,
    meetingPurpose,
    participants,
    onTranscriptUpdate,
    externalSessionId,
    enableGeminiLive, // Pass the prop to control browser speech recognition
    enableVAD: true, // Enable VAD enhancement for improved speech detection
    vadStream, // NEW: Pass VAD stream from Audio Captain to recording manager
    // Pass metadata fields for fire-and-forget session saving
    clientName,
    projectName,
    tags,
    languagePreference,
    // NEW: Switch between legacy (v1) and on-demand (v2) based on toggle
    architecture: saveForLater ? 'v2' : 'v1'
  })

  // Extract session saved modal state
  const { sessionSavedData, setSessionSavedData } = recording;

  // Component-specific state
  const [detectedLanguage, setDetectedLanguage] = useState('en');

  // NEW: Report browser speech data back to parent component
  useEffect(() => {
    if (onBrowserSegmentUpdate) {
      onBrowserSegmentUpdate(recording.browserSegments);
    }
  }, [recording.browserSegments, onBrowserSegmentUpdate]);

  useEffect(() => {
    if (onInterimSegmentUpdate) {
      onInterimSegmentUpdate(recording.interimSegment);
    }
  }, [recording.interimSegment, onInterimSegmentUpdate]);

  // NEW: Report processing state back to parent component
  useEffect(() => {
    if (onProcessingStateChange) {
      onProcessingStateChange(recording.isProcessing);
    }
  }, [recording.isProcessing, onProcessingStateChange]);

  // Report audio blob to parent when recording completes
  useEffect(() => {
    if (onAudioReady && recording.audioPlaybackBlob) {
      onAudioReady(recording.audioPlaybackBlob);
    }
  }, [recording.audioPlaybackBlob, onAudioReady]);

  // Expose recording methods via ref
  useImperativeHandle(ref, () => ({
    startRecording: (overrideStream?: MediaStream) => recording.startRecording(overrideStream),
    stopRecording: recording.stopRecording,
    // NEW: Expose pause/resume methods from recording manager
    pauseRecording: recording.pauseRecording,
    resumeRecording: recording.resumeRecording,
    isRecording: recording.isRecording,
    isProcessing: recording.isProcessing,
    // NEW: Expose isPaused state
    isPaused: recording.isPaused,
    // Browser speech data access
    browserSegments: recording.browserSegments,
    interimSegment: recording.interimSegment
  }), [
    recording.startRecording, 
    recording.stopRecording, 
    // NEW: Add pause/resume to dependencies
    recording.pauseRecording,
    recording.resumeRecording,
    recording.isRecording, 
    recording.isProcessing,
    // NEW: Add isPaused to dependencies
    recording.isPaused,
    recording.browserSegments,
    recording.interimSegment
  ]);

  // Get live segments from Firestore
  const { segments: liveTranscriptSegments } = useLiveTranscriptSegments(recording.sessionId);
  
  // NOTE: Firestore saving is now handled by the useRecordingManager hook
  // within the stopRecording function to ensure it happens only once.

  // Download transcript
  const saveTranscript = () => {
    if (!recording.transcript) {
      toast.error('No transcript to download');
      return;
    }
    
    const filename = createFilename(meetingTitle || 'transcript');
    downloadTextFile(recording.transcript, filename);
    toast.success('Transcript downloaded');
  };

  // Start fresh - clear all data
  const handleStartFresh = () => {
    if (recording.isRecording) {
      toast.error('Cannot start fresh while recording');
      return;
    }
    
    recording.setBrowserSegments([]);
    recording.setTranscript('');
    recording.setGeminiTranscript('');
    recording.setInterimSegment(null);
    recording.setRecordingTime(0);
    recording.setAudioPlaybackBlob(null);
    recording.setErrorMessage(null);
    recording.setSpeakerTimeline([]);
    
    // Clear browser localStorage if sessionId exists
    if (recording.sessionId) {
      clearBrowserSpeechData(recording.sessionId);
      console.log(`Cleared browser speech localStorage for session ${recording.sessionId}`);
    }
    
    clearTranscriptionState();
    recording.setSessionId(null); // FIX: Clear the session ID
    toast.success('Started fresh - all data cleared');
  };

  // Load previous state on mount
  useEffect(() => {
    const savedState = loadTranscriptionState();
    if (savedState) {
      console.log('Restoring transcription state from session storage', savedState);
      recording.setTranscript(savedState.transcript || "");
      recording.setGeminiTranscript(savedState.geminiTranscript || "");
      recording.setRecordingTime(savedState.recordingTime || 0);
      recording.setSessionId(savedState.sessionId);
      
      // Load browser segments from localStorage if sessionId exists
      if (savedState.sessionId) {
        const browserSegments = loadBrowserSpeechData(savedState.sessionId);
        recording.setBrowserSegments(browserSegments);
        console.log(`Loaded ${browserSegments.length} browser segments from localStorage for session ${savedState.sessionId}`);
      }
      
      if (onTranscriptUpdate && savedState.transcript) {
        onTranscriptUpdate(savedState.transcript);
      }
      
      toast.info('Restored previous transcription session');
    }
  }, []);

  // Save state periodically
  useEffect(() => {
    if (recording.browserSegments.length > 0 || recording.transcript) {
      recording.saveCurrentState();
    }
  }, [recording.browserSegments, recording.transcript, recording.geminiTranscript, recording.recordingTime]);

  // Track speaker changes - FIXED: Only track actual speaker changes, not every second
  useEffect(() => {
    if (recording.isRecording && !recording.isPaused && participants.length > 0) {
      const speakerName = participants[recording.activeSpeakerIndex] || "Speaker 1";
      recording.setSpeakerTimeline(prevTimeline => 
        trackSpeakerChange(prevTimeline, recording.recordingTime, speakerName, recording.activeSpeakerIndex)
      );
      console.log(`Speaker change recorded at ${recording.recordingTime}s: ${speakerName}`);
    }
  }, [recording.activeSpeakerIndex, recording.isRecording, recording.isPaused, participants]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      recording.setOfflineMode(!navigator.onLine);
      if (navigator.onLine) {
        toast.success('Connected. Hybrid transcription available.');
      } else {
        toast.warning('Offline mode. Using browser transcription only.');
      }
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    recording.setOfflineMode(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  return (
    <>
    <Card className="overflow-hidden border border-blue-900/20">
      <CardContent className="p-5">
        <div className="flex flex-col space-y-4">
          {/* Error message display */}
          {recording.errorMessage && (
            <div className="mb-4">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{recording.errorMessage}</AlertDescription>
                <Button
                  className="mt-2"
                  onClick={() => {
                    recording.setErrorMessage(null);
                    if (recording.isRecording) recording.stopRecording();
                  }}
                >
                  Try Again
                </Button>
              </Alert>
            </div>
          )}

          {/* Device mode indicator */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mb-2">
            {isMobileDevice() && (
              <div className="flex items-center space-x-2">
                <div className="flex h-6 items-center space-x-1 rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-700">
                  <span>
                    {isIOSDevice() ? 'iOS' : isAndroidDevice() ? 'Android' : 'Mobile'} Mode
                  </span>
                </div>
              </div>
            )}
            
            <TranscriptionAutoSave 
              isRecording={recording.isRecording}
              isPaused={recording.isPaused}
              transcript={recording.transcript}
              meetingTitle={meetingTitle}
              companyId={companyId}
              transcriptRef={recording.refs.transcriptRef}
            />
          </div>

          {/* Start Fresh button */}
          <div className="flex justify-end mb-2">
            <Button 
              onClick={handleStartFresh} 
              variant="outline" 
              className="gap-2 border-dashed"
              disabled={recording.isProcessing || (recording.browserSegments.length === 0 && !recording.transcript)}
            >
              <RefreshCw className="h-4 w-4" />
              Start Fresh
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex flex-col space-y-3">
              {!!recording.transcript && (
                <div className="flex justify-end">
                  <Button 
                    onClick={saveTranscript}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 h-12 sm:h-12 px-6 sm:px-4 rounded-full sm:rounded-md text-lg sm:text-sm shadow-md"
                  >
                    <FileDown className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
                    Download
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center sm:justify-end">
              <SpeakerNameEditor 
                isRecording={recording.isRecording}
                isPaused={recording.isPaused}
                speakers={participants}
                onUpdateSpeakers={(updatedSpeakers) => {
                  if (onParticipantsUpdate) {
                    onParticipantsUpdate(updatedSpeakers);
                  }
                  
                  if (recording.transcript) {
                    const updatedTranscript = updateTranscriptWithSpeakerNames(recording.transcript, updatedSpeakers);
                    recording.setTranscript(updatedTranscript);
                    if (onTranscriptUpdate) {
                      onTranscriptUpdate(updatedTranscript);
                    }
                  }
                }}
                onPauseRecording={recording.pauseRecording}
                activeSpeakerIndex={recording.activeSpeakerIndex}
                setActiveSpeakerIndex={recording.setActiveSpeakerIndex}
              />
            </div>
          </div>
          
          {/* Transcript display */}
          <DualTranscriptionDisplay
            browserTranscript={recording.transcript}
            geminiTranscript={recording.geminiTranscript}
            isProcessing={recording.isProcessing}
            errorMessage={recording.errorMessage || null}
            browserSegments={recording.browserSegments}
            interimSegment={recording.interimSegment}
            speakers={participants}
            expandedView={recording.isRecording && !recording.isPaused}
            detectedLanguage={detectedLanguage}
          />
          
          {/* Audio playback */}
          {recording.audioPlaybackBlob && !recording.isRecording ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Recording available for playback</span>
                </div>
                <button
                  onClick={() => {
                    if (!recording.audioPlaybackBlob) return;
                    
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(recording.audioPlaybackBlob);
                    a.download = `recording_${recording.sessionId || new Date().toISOString()}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    toast.success("Audio download started");
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Recording
                </button>
              </div>
              <AudioPreview 
                audioBlob={recording.audioPlaybackBlob} 
                sessionId={recording.sessionId}
                sessionDuration={recording.recordingTime}
                className="bg-white border border-blue-900/10 rounded-md shadow-sm"
              />
            </div>
          ) : (
            !recording.isRecording && recording.transcript && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-600">
                <p>Audio playback will appear here after recording is complete.</p>
              </div>
            )
          )}
          
          {/* Interim results */}
          <div 
            id="interim-transcript" 
            className="p-3 mt-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-800 font-medium"
            style={{
              display: recording.isRecording ? 'block' : 'none',
              minHeight: '2.5rem'
            }}
          ></div>
        </div>
      </CardContent>
    </Card>
    
    <SessionSavedModal 
      isOpen={!!sessionSavedData}
      onClose={() => setSessionSavedData(null)}
      sessionData={sessionSavedData}
    />
    </>
  );
});
