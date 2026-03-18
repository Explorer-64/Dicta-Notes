import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Settings, Monitor, Trash2, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import MicVADEngineOnly, { MicVADEngineOnlyRef } from 'components/MicVADEngineOnly';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { GeminiLiveDisplay, GeminiSegment } from 'components/GeminiLiveDisplay';
import { shouldRedirectForSystemAudio } from 'utils/deviceDetection';
import { MobileSystemAudioDialog } from 'components/MobileSystemAudioDialog';
import { Switch } from '@/components/ui/switch';
import { useLanguageStore } from 'utils/languageStore';
import { useTranscriptionStore } from 'utils/transcriptionStore';
import { useLiveTranscriptSegments } from 'utils/hooks/useLiveTranscriptSegments';
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

// Add session persistence helper functions
const MICVAD_SESSION_KEY = 'micvad-test-session';

const saveSessionToStorage = (sessionId: string) => {
  try {
    localStorage.setItem(MICVAD_SESSION_KEY, sessionId);
  } catch (error) {
    console.warn('Failed to save session to localStorage:', error);
  }
};

const getSessionFromStorage = (): string | null => {
  try {
    return localStorage.getItem(MICVAD_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to read session from localStorage:', error);
    return null;
  }
};

const clearSessionFromStorage = () => {
  try {
    localStorage.removeItem(MICVAD_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear session from localStorage:', error);
  }
};

interface MicVADTestSegment {
  id: string;
  timestamp: Date;
  text: string;
  speaker?: string;
  translation?: string;
  status: 'recording' | 'processing' | 'completed' | 'error';
  audioSize?: number;
}

const MicVADTest = () => {
  // Generate a unique ID for this component instance to track remounts
  const parentComponentId = useRef(`micvadtest-${Date.now()}-${Math.random().toString(36).slice(2,4)}`);
  const componentIdValue = parentComponentId.current;
  console.log(`[MicVADTest-${componentIdValue}] Parent component mounted`);
  
  // Component unmount logging
  useEffect(() => {
    return () => {
      console.log(`[MicVADTest-${componentIdValue}] 🔴 Parent component unmounting!`);
    };
  }, [componentIdValue]);
  
  const [selectedAudioSource, setSelectedAudioSource] = useState<AudioSourceType>(AudioSourceType.MICROPHONE);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [engineStatus, setEngineStatus] = useState<string>('Ready');
  const [segments, setSegments] = useState<MicVADTestSegment[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [engineState, setEngineState] = useState<any>({ 
    isSpeaking: false, 
    processingCount: 0 
  });
  const [participants, setParticipants] = useState<string>('');
  const [phraseHints, setPhraseHints] = useState<string>(''); // State for phrase hints
  // NEW: Toggle to use bare-bones micvad_only endpoint
  const [useMicVADOnlyAPI, setUseMicVADOnlyAPI] = useState<boolean>(true);
  
  // Get live transcript segments from Firestore (for comparison)
  const { segments: liveSegments } = useLiveTranscriptSegments(sessionId);
  
  // Get persistent segments from transcription store
  const { segments: persistentSegments, clearSegments: clearPersistentSegments } = useTranscriptionStore();
  
  const engineRef = useRef<MicVADEngineOnlyRef>(null);
  
  // Get user's preferred language (for initial hint only)
  const { preferredLanguage } = useLanguageStore();
  
  // Process phrase hints into an array
  const phraseHintsArray = useMemo(() => {
    return phraseHints ? phraseHints.split(',').map(hint => hint.trim()).filter(hint => hint.length > 0) : undefined;
  }, [phraseHints]);

  // Memoize participants to prevent prop churn
  const participantsArray = useMemo(() => {
    return participants ? participants.split(',').map(name => name.trim()).filter(name => name.length > 0) : undefined;
  }, [participants]);
  
  // Stabilize callback functions
  const handleSegmentUpdate = useCallback((newSegments: MicVADTestSegment[]) => {
    console.log('[MicVADTest] Segment update:', newSegments.length, 'segments');
    setSegments(newSegments);
  }, []);
  
  const handleStatusChange = useCallback((status: string) => {
    console.log('[MicVADTest] Status change:', status);
    setEngineStatus(status);
  }, []);
  
  const handleError = useCallback((error: string) => {
    console.error('[MicVADTest] Error:', error);
    setEngineStatus(`Error: ${error}`);
    toast.error(`MicVAD Error: ${error}`);
  }, []);
  
  const handleEngineStart = async () => {
    if (engineRef.current) {
      // Generate session ID for this recording session
      const newSessionId = `micvad-test-${Date.now()}`;
      setSessionId(newSessionId);
      console.log('[MicVADTest] Starting with sessionId:', newSessionId);
      
      // Wait a tick so the sessionId prop propagates into the engine before start
      setTimeout(async () => {
        await engineRef.current?.start();
        setIsRecording(true);
      }, 50);
    }
  };
  
  const handleEngineStop = () => {
    if (engineRef.current) {
      console.log('[MicVADTest] Stopping engine');
      engineRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const clearTranscript = () => {
    // Ensure engine is stopped
    if (isRecording) {
      handleEngineStop();
    }
    // Clear local segments and end current session
    setSegments([]);
    // Clear persistent segments too
    clearPersistentSegments();
    setSessionId(null);
    // The engine's internal state will be cleared on the next start.
    // No need to force a remount.
    toast.info('Cleared. Start again to create a new MicVAD session.');
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
      {/* Hidden MicVAD engine - NO CustomVAD imports! */}
      <MicVADEngineOnly
        ref={engineRef}
        audioSource={selectedAudioSource}
        // targetLanguage removed to prevent prop-driven re-renders; language is updated via ref
        phraseHints={phraseHintsArray} // Pass phrase hints
        onSegmentUpdate={handleSegmentUpdate}
        onStatusChange={handleStatusChange}
        onEngineStateChange={setEngineState}
        onError={handleError}
        sessionId={sessionId}
        participants={participantsArray}
        vadOptions={{ postSpeechPadMs: 120, minSpeechFrames: 5 }} //Do not fi
        useMicVADOnlyAPI={useMicVADOnlyAPI}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            🎤 MicVAD-Only Test Harness
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Isolated @ricky0123/vad-web testing with NO CustomVAD fallback. Pure MicVAD → Gemini 2.0 pipeline.
          </p>
          <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
            <strong>Test Isolation:</strong> This page uses MicVADEngineOnly component that imports ONLY @ricky0123/vad-web and AudioSourceManager. 
            No CustomVAD, no legacy analyser code. Perfect for validating the @ricky0123/vad-web end-to-end flow.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="text-sm font-medium">Bare-bones Gemini path</div>
              <div className="text-xs text-muted-foreground">Bypass all extras (no Firestore, no speaker hints). Minimal prompt → Gemini.</div>
            </div>
            <Switch checked={useMicVADOnlyAPI} onCheckedChange={(v) => setUseMicVADOnlyAPI(v)} disabled={isRecording} />
          </div>
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
          
          {/* Phrase Hints Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Phrase Hints (for accurate transcription):</label>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <Input
                placeholder="e.g. Firebase, OAuth"
                value={phraseHints}
                onChange={(e) => setPhraseHints(e.target.value)}
                disabled={isRecording}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter phrases separated by commas. This helps Gemini understand specific terms and context.
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
              {isRecording ? '🔴 MicVAD Recording...' : 'Start MicVAD Test'}
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
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm space-y-1">
            <div className="font-medium text-green-800">🎯 MicVAD Engine Status</div>
            <div>⚡ Status: {engineStatus}</div>
            <div>🎧 Audio Source: {selectedAudioSource}</div>
            <div>🗣️ Speaking: {engineState.isSpeaking ? '🟢 Detected by MicVAD' : '🔴 Silent'}</div>
            <div>⚡ Processing: {engineState.processingCount} segments</div>
            <div>📝 Local Segments: {segments.length}</div>
            <div>📝 Persistent Segments: {persistentSegments.length}</div>
            <div>📝 Firestore Segments: {liveSegments.length}</div>
            <div>🧾 Session: {sessionId ?? '—'}</div>
            <div>🧪 Mode: {useMicVADOnlyAPI ? 'Bare-bones (micvad_only)' : 'Full pipeline'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Local Segments Display (from MicVAD component) */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Local MicVAD Segments</CardTitle>
          <p className="text-sm text-muted-foreground">
            Direct output from MicVADEngineOnly component (not from Firestore)
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-60 overflow-y-auto pr-2">
            {segments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No MicVAD segments yet. Start recording and speak!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {segments.map((segment) => (
                  <div key={segment.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={segment.status === 'completed' ? 'default' : 'secondary'}>
                          {segment.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatTime(segment.timestamp)}</span>
                        {segment.speaker && (
                          <Badge variant="outline">{segment.speaker}</Badge>
                        )}
                      </div>
                      {segment.audioSize && (
                        <span className="text-xs text-gray-500">{segment.audioSize} bytes</span>
                      )}
                    </div>
                    <div className="text-sm">
                      {segment.text || <em className="text-gray-400">Processing...</em>}
                    </div>
                    {segment.translation && (
                      <div className="text-sm text-blue-600 mt-1">
                        Translation: {segment.translation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Transcript Display (from Firestore for comparison) */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Firestore Live Transcript (for comparison)</CardTitle>
          <p className="text-sm text-muted-foreground">
            This shows segments saved to Firestore by the backend, using GeminiLiveDisplay component
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-60 overflow-y-auto pr-2">
            {liveSegments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No Firestore segments yet. Backend saves may be delayed.</p>
                </div>
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
          </div>
        </CardContent>
      </Card>

      <MobileSystemAudioDialog 
        open={showMobileDialog}
        onOpenChange={(open) => setShowMobileDialog(open)}
      />
    </div>
  );
};

export default MicVADTest;
