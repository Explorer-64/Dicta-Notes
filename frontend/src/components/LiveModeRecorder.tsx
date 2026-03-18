import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Square, Download, Copy, Save, Share2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomVAD } from 'utils/useCustomVAD';
import { useGoogleSTTTranscription } from 'utils/useGoogleSTTTranscription';
import { audioSourceManager } from 'utils/audio/AudioSourceManager';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import brain from 'brain';
import { useCurrentUser } from 'app';

interface TranscriptionSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  sequence: number;
}

interface Props {
  meetingTitle: string;
  meetingPurpose: string;
  participants: string[];
  companyId: string | null;
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
}

export function LiveModeRecorder({
  meetingTitle,
  meetingPurpose,
  participants,
  companyId,
  onTranscriptUpdate,
  onRecordingStateChange,
}: Props) {
  const { user } = useCurrentUser();
  const [isRecording, setIsRecording] = useState(false);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSourceType>(AudioSourceType.MICROPHONE);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  const sessionIdRef = useRef(`session-${Date.now()}`);
  const chunkCounterRef = useRef(0);
  const currentSpeakerRef = useRef('Speaker 1');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  // Google STT transcription with Gemini fallback
  const { transcribeAudio, isProcessing } = useGoogleSTTTranscription({
    sessionId: sessionIdRef.current,
    onTranscription: (text, chunkId) => {
      if (text.trim()) {
        const sequenceMatch = chunkId.match(/chunk-(\d+)/);
        const sequence = sequenceMatch ? parseInt(sequenceMatch[1], 10) : 0;

        const newSegment: TranscriptionSegment = {
          id: chunkId,
          speaker: currentSpeakerRef.current,
          text: text.trim(),
          timestamp: Date.now(),
          sequence,
        };

        setSegments(prev => {
          const updated = [...prev, newSegment].sort((a, b) => a.sequence - b.sequence);
          // Update parent with full transcript
          const fullTranscript = updated.map(s => `${s.speaker}: ${s.text}`).join('\n\n');
          onTranscriptUpdate(fullTranscript);
          return updated;
        });
      }
    },
    onError: (error) => {
      console.error('Transcription error:', error);
      toast.error('Transcription error occurred');
    },
  });

  // VAD - detects speech and sends audio chunks
  const { startVAD, stopVAD, isSpeaking } = useCustomVAD({
    onSpeechEnd: async (audioBlob) => {
      const chunkId = `chunk-${chunkCounterRef.current}`;
      console.log(`Speech segment #${chunkCounterRef.current} ended, size: ${audioBlob.size} bytes`);
      chunkCounterRef.current++;
      await transcribeAudio(audioBlob, chunkId);
    },
    disableOverlap: true,
    isRecording,
    // Recommended defaults for smart chunking:
    silenceThreshold: 350,        // Normal pause detection
    minDuration: 1500,            // Minimum chunk length
    maxDuration: 8000,            // Trigger eager mode
    eagerSilenceThreshold: 150,   // Brief pause for eager chunking
  });

  // Start recording
  const startRecording = async () => {
    try {
      const result = await audioSourceManager.getAudioStream(audioSource);
      const stream = result.stream;
      setCurrentStream(stream);
      await startVAD(stream);
      setIsRecording(true);
      onRecordingStateChange(true);
      setRecordingTime(0);
      setSavedSessionId(null);
      
      // Track recording start time for relative timestamps
      recordingStartTimeRef.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success(`Recording started with ${result.actualSourceType}`);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access audio source');
    }
  };

  // Stop recording
  const stopRecording = useCallback(() => {
    stopVAD();
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    onRecordingStateChange(false);
    toast.success('Recording stopped');
  }, [currentStream, stopVAD, onRecordingStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStream]);

  // Format time
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save session
  const handleSaveSession = async () => {
    if (!user) {
      toast.error('You must be logged in to save sessions');
      return;
    }

    if (segments.length === 0) {
      toast.error('No transcription to save');
      return;
    }

    setIsSaving(true);
    try {
      const transcript = segments.map(s => `${s.speaker}: ${s.text}`).join('\n\n');
      const response = await brain.save_session({
        title: meetingTitle || 'Untitled Meeting',
        purpose: meetingPurpose || '',
        transcript,
        participants: participants.join(', '),
        company_id: companyId,
        user_id: user.uid,
      });

      const data = await response.json();
      setSavedSessionId(data.session_id);
      toast.success('Session saved successfully');
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy transcript
  const handleCopyTranscript = () => {
    const transcript = segments.map(s => `${s.speaker}: ${s.text}`).join('\n\n');
    navigator.clipboard.writeText(transcript);
    toast.success('Transcript copied to clipboard');
  };

  // Download transcript
  const handleDownloadTranscript = () => {
    const transcript = segments.map(s => `${s.speaker}: ${s.text}`).join('\n\n');
    const content = `Meeting: ${meetingTitle || 'Untitled'}\n` +
                   `Purpose: ${meetingPurpose || 'N/A'}\n` +
                   `Participants: ${participants.join(', ') || 'N/A'}\n` +
                   `Date: ${new Date().toLocaleString()}\n\n` +
                   `Transcript:\n${transcript}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meetingTitle || 'transcript'}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Transcript downloaded');
  };

  // Clear transcript
  const handleClearTranscript = () => {
    if (isRecording) {
      toast.error('Please stop recording before clearing');
      return;
    }
    setSegments([]);
    chunkCounterRef.current = 0;
    sessionIdRef.current = `session-${Date.now()}`;
    setSavedSessionId(null);
    onTranscriptUpdate('');
    toast.success('Transcript cleared');
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Live Transcription
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  Recording
                </Badge>
              )}
              {isSpeaking && (
                <Badge variant="default" className="bg-orange-600">
                  Speaking
                </Badge>
              )}
              {isProcessing && (
                <Badge variant="default" className="bg-blue-600">
                  Processing
                </Badge>
              )}
            </CardTitle>
            {isRecording && (
              <div className="text-sm font-mono text-muted-foreground">
                {formatTime(recordingTime)}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audio Source Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Audio Source</label>
            <Select
              value={audioSource}
              onValueChange={(value) => setAudioSource(value as AudioSourceType)}
              disabled={isRecording}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AudioSourceType.MICROPHONE}>
                  🎤 Microphone
                </SelectItem>
                <SelectItem value={AudioSourceType.SYSTEM_AUDIO}>
                  🔊 System Audio
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="flex items-center gap-2"
              >
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Recording
              </Button>
            )}

            <Button
              onClick={handleSaveSession}
              disabled={segments.length === 0 || isSaving || isRecording}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Session
            </Button>
          </div>

          {/* Session saved indicator */}
          {savedSessionId && (
            <Alert className="border-green-200 dark:border-green-800">
              <AlertDescription>
                ✅ Session saved! ID: {savedSessionId}
              </AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-green-900 dark:text-green-100">
              🎯 Live mode uses Google Speech-to-Text with Gemini fallback for highest accuracy.
              Multi-speaker detection and sharing features enabled.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Transcript
              {segments.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({segments.length} segments)
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleCopyTranscript}
                disabled={segments.length === 0}
                size="sm"
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleDownloadTranscript}
                disabled={segments.length === 0}
                size="sm"
                variant="outline"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleClearTranscript}
                disabled={segments.length === 0 || isRecording}
                size="sm"
                variant="outline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto space-y-3">
            {segments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start recording to see live transcription with speaker identification</p>
              </div>
            ) : (
              segments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-3 bg-muted rounded-lg border-l-4 border-l-green-500"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {segment.speaker}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(segment.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{segment.text}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
