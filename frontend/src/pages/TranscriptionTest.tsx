import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Settings, Monitor, Square, Play, Pause, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import RealTimeTranscriptionEngine, { RealTimeTranscriptionEngineRef } from 'components/RealTimeTranscriptionEngine';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { useLiveTranscriptSegments } from 'utils/hooks/useLiveTranscriptSegments';
import { GeminiLiveDisplay, GeminiSegment } from 'components/GeminiLiveDisplay';
import { shouldRedirectForSystemAudio } from 'utils/deviceDetection';
import { MobileSystemAudioDialog } from 'components/MobileSystemAudioDialog';
import { audioCaptain } from 'utils/recording/audioCaptain';
import useLanguageOrchestrator from 'utils/useLanguageOrchestrator';
import { initializeSpeechRecognition } from 'utils/recording/speechRecognitionUtils';
import { TranscriptSegment } from 'utils/persistentTranscriptionUtils';
import { NoIndexMeta } from 'components/NoIndexMeta';

export default function TranscriptionTest() {
  const [selectedAudioSource, setSelectedAudioSource] = useState<AudioSourceType>(AudioSourceType.MICROPHONE);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [engineStatus, setEngineStatus] = useState<string>('Ready');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [engineState, setEngineState] = useState<any>({ 
    isSpeaking: false, 
    processingCount: 0 
  });
  const [participants, setParticipants] = useState<string>('');  // New: participants input
  const [preCapturedStream, setPreCapturedStream] = useState<MediaStream | null>(null); // For compatibility
  const [audioCaptainInstance, setAudioCaptainInstance] = useState<audioCaptain | null>(null);
  const [capturedStreams, setCapturedStreams] = useState<{
    originalDisplayStream?: MediaStream;
    vadStream?: MediaStream;
    languageDetectionStream?: MediaStream;
  }>({});
  
  // NEW: Browser Speech Recognition State
  const [isBrowserSpeechActive, setIsBrowserSpeechActive] = useState(false);
  const [browserTranscript, setBrowserTranscript] = useState<string>('');
  const [browserSegments, setBrowserSegments] = useState<TranscriptSegment[]>([]);
  const [interimSegment, setInterimSegment] = useState<TranscriptSegment | null>(null);
  const [interimText, setInterimText] = useState<string>('');
  const [speechErrorMessage, setSpeechErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  
  // Get live transcript segments from Firestore
  const { segments: liveSegments, clearSegments } = useLiveTranscriptSegments(sessionId);
  
  // Add language orchestrator for pitch-based language change detection
  const detectedLanguage = useLanguageOrchestrator(preCapturedStream);
  
  const engineRef = useRef<RealTimeTranscriptionEngineRef>(null);

  // NEW: Browser Speech Recognition Functions
  const startBrowserSpeech = () => {
    const success = initializeSpeechRecognition(recognitionRef, {
      activeSpeakerIndex: 0,
      participants: participants ? participants.split(',').map(name => name.trim()).filter(name => name.length > 0) : [],
      recordingTime: Date.now(),
      sessionId: sessionId,
      isRecording: isBrowserSpeechActive,
      isPaused: false,
      onTranscriptUpdate: (transcript: string) => {
        setBrowserTranscript(transcript);
      },
      setBrowserSegments,
      setInterimSegment,
      setTranscript: setBrowserTranscript,
      setInterimText,
      setErrorMessage: setSpeechErrorMessage,
      transcriptRef,
      browserSegments
    });
    
    if (success && recognitionRef.current) {
      recognitionRef.current.start();
      setIsBrowserSpeechActive(true);
      toast.success('Browser speech recognition started!');
    }
  };
  
  const stopBrowserSpeech = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsBrowserSpeechActive(false);
    toast.info('Browser speech recognition stopped.');
  };
  
  const clearBrowserTranscript = () => {
    setBrowserTranscript('');
    setBrowserSegments([]);
    setInterimSegment(null);
    setInterimText('');
    setSpeechErrorMessage(null);
    transcriptRef.current = '';
    toast.info('Browser transcript cleared.');
  };

  // NEW: AudioCaptain capture function (using singleton)
  const handleAudioCapture = useCallback(async () => {
    try {
      console.log('🎯 [TranscriptionTest] Starting AudioCaptain capture...');
      
      // Set audio source to system audio before capturing
      audioCaptain.setAudioSource(AudioSourceType.SYSTEM_AUDIO);
      
      // Capture the original stream
      const originalStream = await audioCaptain.captureAudio();
      console.log('🎯 [TranscriptionTest] Original stream captured:', originalStream.getTracks().length, 'tracks');
      
      // Create stream clones like in GeminiLive
      const vadStream = await audioCaptain.createStreamCopy('transcription-test-vad', 'TranscriptionTest VAD');
      const languageDetectionStream = await audioCaptain.createStreamCopy('transcription-test-lang', 'TranscriptionTest Language Detection');
      
      console.log('🎯 [TranscriptionTest] AudioCaptain streams created:', {
        original: originalStream.getTracks().length,
        vadStream: vadStream.getTracks().length,
        languageDetectionStream: languageDetectionStream.getTracks().length
      });
      
      setCapturedStreams({
        originalDisplayStream: originalStream,
        vadStream,
        languageDetectionStream
      });
      setPreCapturedStream(vadStream); // Use VAD stream for engine
      
      toast.success('System audio captured! Ready to record.');
    } catch (error) {
      console.error('Failed to capture system audio:', error);
      toast.error(`Failed to capture system audio: ${error}`);
    }
  }, []);
  
  // NEW: Stop AudioCaptain capture
  const handleStopCapture = useCallback(() => {
    console.log('🎯 [TranscriptionTest] Stopping AudioCaptain...');
    audioCaptain.stopAllCapture();
    setCapturedStreams({});
    setPreCapturedStream(null);
    toast.info('Audio capture stopped.');
  }, []);

  // Handle Engine Start with AudioCaptain integration
  const handleEngineStart = async () => {
    if (engineRef.current) {
      try {
        // STEP 1: Set up AudioCaptain exactly like GeminiLive
        console.log('🎯 Setting up AudioCaptain with source:', selectedAudioSource);
        audioCaptain.setAudioSource(selectedAudioSource);
        
        // STEP 2: Capture audio and create clones
        const originalStream = await audioCaptain.captureAudio();
        const vadStream = await audioCaptain.createStreamCopy('transcription-test-vad', 'TranscriptionTest VAD');
        const languageDetectionStream = await audioCaptain.createStreamCopy('transcription-test-lang', 'TranscriptionTest Language Detection');
        
        // STEP 3: NEW - Create 2 additional clones to test cloning behavior
        const clone1 = await audioCaptain.createStreamCopy('transcription-test-clone1', 'TranscriptionTest Clone 1');
        const clone2 = await audioCaptain.createStreamCopy('transcription-test-clone2', 'TranscriptionTest Clone 2');
        
        console.log('🎯 AudioCaptain streams created:', {
          original: originalStream.getTracks().length,
          vadStream: vadStream.getTracks().length,
          languageDetectionStream: languageDetectionStream.getTracks().length,
          clone1: clone1.getTracks().length,
          clone2: clone2.getTracks().length,
          vadReadyState: vadStream.getAudioTracks()[0]?.readyState,
          originalReadyState: originalStream.getAudioTracks()[0]?.readyState,
          clone1ReadyState: clone1.getAudioTracks()[0]?.readyState,
          clone2ReadyState: clone2.getAudioTracks()[0]?.readyState,
          // EXPLICIT STREAM IDs FOR VERIFICATION
          vadStreamId: vadStream.id,
          languageDetectionStreamId: languageDetectionStream.id,
          clone1Id: clone1.id,
          clone2Id: clone2.id
        });
        
        // STEP 4: Store cloned streams for debugging
        setCapturedStreams({
          originalStream,
          vadStream,
          languageDetectionStream,
          clone1,
          clone2
        });
        
        // STEP 5: Start engine with SECOND CLONE (languageDetectionStream)
        console.log('🚨 EXPLICIT VERIFICATION: Using languageDetectionStream (SECOND CLONE) for transcription:', {
          streamId: languageDetectionStream.id,
          streamType: 'languageDetectionStream',
          cloneOrder: 'SECOND CLONE',
          trackCount: languageDetectionStream.getAudioTracks().length,
          trackState: languageDetectionStream.getAudioTracks()[0]?.readyState
        });
        setPreCapturedStream(languageDetectionStream); // CHANGED: Use second clone instead of first
        
        // Generate session ID and start engine
        const newSessionId = `session-${Date.now()}`;
        setSessionId(newSessionId);
        await engineRef.current.start();
        setIsRecording(true);
        
        toast.success('Real-time transcription started with 2 additional clones!');
      } catch (error) {
        console.error('Failed to start engine with AudioCaptain + clones:', error);
        toast.error('Failed to start with cloned streams');
      }
    }
  };
  
  const handleEngineStop = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleSegmentUpdate = (newSegments: TranscriptSegment[]) => {
    setSegments(newSegments);
  };
  
  const handleStatusChange = (status: string) => {
    setEngineStatus(status);
  };
  
  const handleError = (error: string) => {
    setEngineStatus(`Error: ${error}`);
    toast.error(error);
  };
  
  const clearTranscript = () => {
    // End current view by clearing session so Firestore listener resets
    setSessionId(null);
    toast.info('Cleared. Start again to create a new session.');
  };

  const toDisplayDate = (ts: any): Date => {
    if (!ts) return new Date();
    if (typeof ts?.toDate === 'function') return ts.toDate(); // Firestore Timestamp
    if (typeof ts === 'number') return new Date(ts);
    if (typeof ts === 'string') return new Date(ts);
    if (ts instanceof Date) return ts;
    return new Date();
  };

  const formatTime = (ts: any) => {
    const date = toDisplayDate(ts);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getStatusIcon = (isFinal?: boolean) => {
    return isFinal ? '✅' : '🟡';
  };

  // Handle System Audio button click with mobile redirect check
  const handleSystemAudioClick = () => {
    if (shouldRedirectForSystemAudio()) {
      setShowMobileDialog(true);
    } else {
      setSelectedAudioSource(AudioSourceType.SYSTEM_AUDIO);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <NoIndexMeta />
      {/* DEPRECATION NOTICE */}
      <Card className="border-orange-500 bg-orange-50">
        <CardContent className="pt-6">
          <div className="text-orange-800">
            <h3 className="font-bold text-lg mb-2">⚠️ DEPRECATED TEST PAGE</h3>
            <p className="text-sm">
              RealTimeTranscriptionEngine has been removed. This test page is obsolete.
              Use DualRecordingController for all recording functionality.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden transcription engine */}
      <RealTimeTranscriptionEngine
        ref={engineRef}
        audioSource={selectedAudioSource}
        targetLanguage="en"
        onSegmentUpdate={handleSegmentUpdate}
        onStatusChange={(status) => console.log('Engine status:', status)}
        onEngineStateChange={setEngineState}
        onError={(error) => toast.error(`Engine Error: ${error}`)}
        sessionId={sessionId}
        preCapturedStream={preCapturedStream}
        participants={participants ? participants.split(',').map(name => name.trim()).filter(name => name.length > 0) : undefined}
        disableOverlap={true} // NEW: Disable 500ms overlap for Google STT compatibility
      />
      
      <Card>
        <CardHeader>
          <CardTitle>🎤 Real-Time Meeting Transcription</CardTitle>
          <p className="text-sm text-muted-foreground">
            Automatic transcription with AudioSourceManager + VAD + Gemini 2.5. Segments processed in parallel!
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audio Source Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Audio Source:</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={selectedAudioSource === AudioSourceType.MICROPHONE ? "default" : "outline"}
                onClick={() => setSelectedAudioSource(AudioSourceType.MICROPHONE)}
                disabled={isRecording}
              >
                <Mic className="w-4 h-4 mr-1" />
                Microphone
              </Button>
              
              <Button
                size="sm"
                variant={selectedAudioSource === AudioSourceType.SYSTEM_AUDIO ? "default" : "outline"}
                onClick={handleSystemAudioClick}
                disabled={isRecording}
              >
                <Settings className="w-4 h-4 mr-1" />
                System Audio
              </Button>

              <Button
                size="sm"
                variant={selectedAudioSource === AudioSourceType.TAB_AUDIO ? "default" : "outline"}
                onClick={() => setSelectedAudioSource(AudioSourceType.TAB_AUDIO)}
                disabled={isRecording}
              >
                <Monitor className="w-4 h-4 mr-1" />
                Tab Audio
              </Button>
            </div>
          </div>
          
          {/* Participant Names Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Participant Names (for accurate speaker identification):</label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="e.g. Taylor Swift, Travis Kelce, Jason Kelce"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                disabled={isRecording}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter names separated by commas. This helps Gemini identify speakers by their actual names instead of "Speaker 1", "Speaker 2".
            </p>
          </div>
          
          {/* Recording Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={handleEngineStart} 
              disabled={isRecording}
              variant={isRecording ? "secondary" : "default"}
              className={isRecording ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? '🔴 Recording Live...' : 'Start Real-Time Transcription'}
            </Button>
            
            <Button 
              onClick={handleEngineStop} 
              disabled={!isRecording}
              variant="outline"
            >
              <MicOff className="w-4 h-4 mr-2" />
              Stop
            </Button>

            <Button 
              onClick={clearTranscript} 
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
          
          {/* Real-time Status */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm space-y-1">
            <div>🎯 Engine Status: {engineStatus}</div>
            <div>🎧 Audio Source: {selectedAudioSource}</div>
            <div>🗣️ Speaking: {engineState.isSpeaking ? '🟢 Detected' : '🔴 Silent'}</div>
            <div>⚡ Processing: {engineState.processingCount} segments</div>
            <div>📝 Total Segments: {liveSegments.length}</div>
            <div>🧾 Session: {sessionId ?? '—'}</div>
            {/* AudioCaptain Debug Info */}
            {Object.keys(capturedStreams).length > 0 && (
              <div>🎬 AudioCaptain: VAD readyState = {capturedStreams.vadStream?.getAudioTracks()[0]?.readyState || 'none'}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Transcript Display */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Live Transcript with Translation Toggle</CardTitle>
          <p className="text-sm text-muted-foreground">
            Testing the new GeminiLiveDisplay component with translation toggle functionality
          </p>
        </CardHeader>
        <CardContent>
          {liveSegments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No segments yet. Start recording and speak!</p>
            </div>
          ) : (
            <GeminiLiveDisplay 
              segments={liveSegments.map((segment): GeminiSegment => ({
                id: segment.id,
                text: segment.text,
                speaker: segment.speaker,
                translation: segment.translation,
                language: segment.language,
                timestamp: segment.timestamp,
                isFinal: segment.isFinal
              }))}
            />
          )}
        </CardContent>
      </Card>

      <MobileSystemAudioDialog 
        open={showMobileDialog}
        onOpenChange={(open) => setShowMobileDialog(open)}
      />
    </div>
  );
}
