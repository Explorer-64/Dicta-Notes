import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Download, Copy, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  meetingTitle: string;
  meetingPurpose: string;
  participants: string[];
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
}

export function BrowserModeRecorder({
  meetingTitle,
  meetingPurpose,
  participants,
  onTranscriptUpdate,
  onRecordingStateChange,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    }
  }, []);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPiece + ' ';
        } else {
          interim += transcriptPiece;
        }
      }

      if (final) {
        setTranscript(prev => {
          const updated = prev + final;
          onTranscriptUpdate(updated);
          return updated;
        });
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Don't stop on no-speech error, just continue
        return;
      }
      setError(`Recognition error: ${event.error}`);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access and try again.');
        stopRecording();
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording
      if (isRecording && recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };

    return recognition;
  }, [isRecording, onTranscriptUpdate]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    onTranscriptUpdate('');
    setRecordingTime(0);

    const recognition = initializeRecognition();
    if (!recognition) {
      toast.error('Failed to initialize speech recognition');
      return;
    }

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsRecording(true);
      onRecordingStateChange(true);
      toast.success('Recording started');

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording');
      setError('Failed to start recording');
    }
  }, [isSupported, initializeRecognition, onRecordingStateChange, onTranscriptUpdate]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    onRecordingStateChange(false);
    setInterimTranscript('');
    toast.success('Recording stopped');
  }, [onRecordingStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy transcript to clipboard
  const handleCopyTranscript = useCallback(() => {
    navigator.clipboard.writeText(transcript);
    toast.success('Transcript copied to clipboard');
  }, [transcript]);

  // Download transcript
  const handleDownloadTranscript = useCallback(() => {
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
  }, [transcript, meetingTitle, meetingPurpose, participants]);

  // Clear transcript
  const handleClearTranscript = useCallback(() => {
    if (isRecording) {
      toast.error('Please stop recording before clearing');
      return;
    }
    setTranscript('');
    onTranscriptUpdate('');
    toast.success('Transcript cleared');
  }, [isRecording, onTranscriptUpdate]);

  return (
    <div className="space-y-4">
      {/* Browser not supported warning */}
      {!isSupported && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Speech recognition is not supported in this browser. Please use Chrome or Edge.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Error display */}
      {error && isSupported && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Browser Transcription
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  Recording
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
        <CardContent>
          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={!isSupported}
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
          </div>

          {/* Info about browser mode */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Browser mode uses your browser's built-in speech recognition. 
              No speaker identification or sharing features available.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transcript</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleCopyTranscript}
                disabled={!transcript}
                size="sm"
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleDownloadTranscript}
                disabled={!transcript}
                size="sm"
                variant="outline"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleClearTranscript}
                disabled={!transcript || isRecording}
                size="sm"
                variant="outline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 bg-muted rounded-lg">
            {transcript || interimTranscript ? (
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-muted-foreground italic">
                      {interimTranscript}
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start recording to see your transcript here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
