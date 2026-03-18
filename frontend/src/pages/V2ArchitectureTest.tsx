import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRecordingManager } from 'utils/hooks/useRecordingManager';
import { useCurrentUser } from 'app/auth';
import { useLiveTranscriptSegments } from 'utils/hooks/useLiveTranscriptSegments';
import { GeminiLiveDisplay, GeminiSegment } from 'components/GeminiLiveDisplay';
import { clearInterimTranscriptUI } from 'utils/recording/speechRecognitionUtils';
import { clearBrowserSpeechData } from 'utils/browserSpeechStorage';
import RealTimeTranscriptionEngine, { RealTimeTranscriptionEngineRef } from 'components/RealTimeTranscriptionEngine';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { Badge } from '@/components/ui/badge';
import { setInterimTextCallback, setInterimFinalizeCallback, setInterimClearCallback } from 'utils/recording/speechRecognitionUtils';
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

export default function V2ArchitectureTest() {
  const { user } = useCurrentUser();

  const engineRef = useRef<RealTimeTranscriptionEngineRef | null>(null);
  const [engineStatus, setEngineStatus] = useState<string>('Idle');
  const [sessionId] = useState<string | null>(() => `session-${Date.now()}`);
  const participants: string[] = [];

  // NEW: State for capturing interim text from speech recognition
  const [interimText, setInterimText] = useState<string>('');
  const [lastInterimUpdate, setLastInterimUpdate] = useState<Date | null>(null);
  const [finalizedSegments, setFinalizedSegments] = useState<Array<{ text: string; timestamp: Date }>>([]);

  // Set up interim text callback on component mount
  useEffect(() => {
    setInterimTextCallback((text: string) => {
      setInterimText(text);
      setLastInterimUpdate(new Date());
    });

    setInterimFinalizeCallback(() => {
      if (interimText.trim()) {
        setFinalizedSegments(prev => [...prev, { 
          text: interimText.trim(), 
          timestamp: new Date() 
        }]);
        // Don't clear interimText here - let the next interim update do it
      }
    });

    setInterimClearCallback(() => {
      setFinalizedSegments([]);
      setInterimText('');
      setLastInterimUpdate(null);
    });

    // Cleanup callbacks on unmount
    return () => {
      setInterimTextCallback(null);
      setInterimFinalizeCallback(null);
      setInterimClearCallback(null);
    };
  }, [interimText]); // Include interimText in deps for finalize callback

  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    setSessionId,
  } = useRecordingManager({
    meetingTitle: "V2 On-Demand Test",
    participants,
    architecture: 'v2',
    enableVAD: false, // IMPORTANT: Disable legacy VAD to avoid double-capture. We use the new engine below.
    userId: user?.uid, // Pass the user ID for v2 architecture
  });

  const { segments: liveSegments, isLoading } = useLiveTranscriptSegments(sessionId);
  
  const handleStartRecording = async () => {
    if (user?.uid) {
      await startRecording();
      // Engine will auto-start when sessionId becomes available
    } else {
      toast.error("Authentication required. Please log in to start a recording.");
    }
  };
  
  const handleStopRecording = () => {
    stopRecording();
    // Stop the live engine as well
    try {
      engineRef.current?.stop();
    } catch {}
  };
  
  // Auto-start the real-time engine when we have a session and recording is active
  useEffect(() => {
    const startEngineIfReady = async () => {
      if (isRecording && sessionId && engineRef.current) {
        setEngineStatus('Starting...');
        try {
          await engineRef.current.start();
          setEngineStatus('Live');
        } catch (e: any) {
          setEngineStatus('Error');
          toast.error(e?.message || 'Failed to start live engine');
        }
      }
    };
    startEngineIfReady();
  }, [isRecording, sessionId]);

  // Render a small pill for Engine status with subtle colors. Map to Live / Idle / Error only.
  const renderEngineStatusChip = (status: string) => {
    const s = (status || '').toLowerCase();
    const isLive = s.includes('live') || s.includes('ready') || s.includes('recording');
    const normalized = s.includes('error') ? 'Error' : isLive ? 'Live' : 'Idle';

    const cls =
      normalized === 'Live'
        ? 'bg-green-100 text-green-700 border-green-200'
        : normalized === 'Error'
        ? 'bg-red-100 text-red-700 border-red-200'
        : 'bg-gray-100 text-gray-700 border-gray-200';

    return (
      <Badge variant="outline" className={`min-w-[56px] justify-center ${cls}`}>
        {normalized}
      </Badge>
    );
  };
  
  const clearTranscript = () => {
    // Clear any gray interim UI lines appended by Web Speech flow
    clearInterimTranscriptUI();

    // Clear browser-speech local cache for this session if present
    if (sessionId) {
      clearBrowserSpeechData(sessionId);
    }

    // Reset view by clearing sessionId (this also clears Firestore listeners/segments)
    setSessionId(null);
    setEngineStatus('Idle');
    toast.info('Cleared. Start a new recording to create a new session view.');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>🎤 V2 Architecture Test: On-Demand + Live Chunking</CardTitle>
          <p className="text-sm text-muted-foreground">
            New live VAD segment buffer streams chunks to Gemini via HTTP (transcribe_chunk) while V2 on-demand runs in parallel.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleStartRecording} 
              disabled={isRecording || isProcessing}
              className={isRecording ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? '🔴 Recording...' : 'Start V2 Recording'}
            </Button>
            
            <Button 
              onClick={handleStopRecording} 
              disabled={!isRecording || isProcessing}
              variant="outline"
            >
              <MicOff className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Stop & Save'}
            </Button>

            <Button 
              onClick={clearTranscript} 
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear View
            </Button>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm space-y-1">
            <div><strong>Architecture:</strong> V2 (On-Demand) + Live Chunk Pipeline</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                <strong>Status:</strong> {isRecording ? 'Recording' : isProcessing ? 'Processing' : 'Idle'}
              </span>
              <span className="text-gray-400">|</span>
              <span className="flex items-center gap-2">
                <strong>Engine:</strong> {renderEngineStatusChip(engineStatus)}
              </span>
            </div>
            <div><strong>Session ID:</strong> {sessionId ?? '—'}</div>
          </div>
        </CardContent>
      </Card>

      {/* NEW: Interim Text Capture Test Card */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎤 Interim Text Capture Test
            <Badge variant="secondary" className="text-xs">
              Language Detection Side Effect
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This card captures the "grey interim text" that appears as a side effect during browser speech recognition for language detection.
            {lastInterimUpdate && (
              <span className="block mt-1 text-xs text-blue-600">
                Last update: {lastInterimUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <div className="min-h-[100px] p-4 bg-white border border-gray-200 rounded-md">
            {finalizedSegments.length > 0 || interimText ? (
              <div className="space-y-1">
                <div className="text-sm text-gray-500 font-medium mb-2">Captured Interim Text:</div>
                
                {/* Display finalized segments (persistent lines) */}
                {finalizedSegments.map((segment, index) => (
                  <div key={index} className="text-gray-600 p-1 text-sm">
                    <span className="text-gray-500">Speaker:</span> {segment.text}
                  </div>
                ))}
                
                {/* Display current interim text (active line) */}
                {interimText && (
                  <div className="text-gray-700 italic p-1 text-sm bg-gray-50 border-l-2 border-blue-400">
                    <span className="text-gray-500">Speaker:</span> {interimText}
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
                  This mirrors the behavior of the grey text at the bottom.
                  Finalized lines persist, current line updates in real-time.
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start recording to see interim text captured here...</p>
                <p className="text-xs mt-1">The browser speech recognition will produce interim results during language detection</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📝 Transcript Display</CardTitle>
          <p className="text-sm text-muted-foreground">
            Segments will appear here as Gemini responses are saved to Firestore.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="text-center py-8 text-gray-500">Loading transcript...</div>}
          {!isLoading && liveSegments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a recording. Live segments will appear here during the call, and the full on-demand result after stop.</p>
            </div>
          )}
          {!isLoading && liveSegments.length > 0 && (
            <GeminiLiveDisplay 
              segments={liveSegments.map((segment): GeminiSegment => ({
                id: segment.id,
                text: segment.text,
                speakerName: segment.speakerName,
                translation: segment.translation,
                language: segment.language,
                timestamp: segment.timestamp,
                isFinal: segment.isFinal
              }))}
            />
          )}
        </CardContent>
      </Card>

      {/* Headless engine that buffers VAD segments and posts them to /transcribe_chunk */}
      <RealTimeTranscriptionEngine
        ref={(r) => (engineRef.current = r)}
        audioSource={AudioSourceType.MICROPHONE}
        sessionId={sessionId}
        participants={participants}
        onSegmentUpdate={() => { /* We rely on Firestore listener to render */ }}
        onStatusChange={setEngineStatus}
        onEngineStateChange={() => {}}
        onError={(err) => toast.error(err)}
        useMicVAD={true}
      />
    </div>
  );
}
