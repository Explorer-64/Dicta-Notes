import { useState, useRef, useEffect } from 'react';
import { useCustomVAD } from 'utils/useCustomVAD';
import { useGoogleSTTTranscription } from 'utils/useGoogleSTTTranscription';
import { usePitchDetector } from 'utils/usePitchDetector';
import { audioSourceManager } from 'utils/audio/AudioSourceManager';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TranscriptionSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  sequence: number;
}

export interface GoogleSTTRecorderProps {
  audioSource: AudioSourceType;
  sessionId?: string | null;
  participants?: string[];
  phraseHints?: string[];
}

/**
 * Clean Google STT recorder component with pitch detection for speaker-based segmentation.
 * 
 * Three-trigger chunking system:
 * 1. Normal pauses - 350ms silence
 * 2. Long duration - 8+ seconds → eager mode with 150ms silence
 * 3. Pitch changes - Speaker switches detected via pitch detector
 */
export default function GoogleSTTRecorder({
  audioSource,
  sessionId,
  participants,
  phraseHints,
}: GoogleSTTRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  
  const chunkCounterRef = useRef(0);
  const currentSpeakerRef = useRef('Speaker 1');
  const receivedTranscriptionsRef = useRef(0);
  const vadDetectionsRef = useRef(0);
  const sessionIdRef = useRef(sessionId || `gst-${Date.now()}`);

  useEffect(() => {
    if (sessionId) {
      sessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  // Pitch detection - emits pitchChange events when speaker changes
  const currentSpeaker = usePitchDetector(currentStream, (speaker) => {
    console.log('🎵 GoogleSTTRecorder: Speaker change detected:', speaker);
    currentSpeakerRef.current = speaker;
    window.dispatchEvent(new CustomEvent('pitchChange', { 
      detail: { speaker } 
    }));
  });

  useEffect(() => {
    currentSpeakerRef.current = currentSpeaker;
  }, [currentSpeaker]);

  // Google STT transcription
  const { transcribeAudio, isProcessing } = useGoogleSTTTranscription({
    sessionId: sessionIdRef.current,
    onTranscription: (text, chunkId) => {
      receivedTranscriptionsRef.current++;
      
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
        
        console.log(`✅ Transcription for ${chunkId} (seq: ${sequence})`);
        setSegments(prev => [...prev, newSegment].sort((a, b) => a.sequence - b.sequence));
      }
    },
    onError: (error) => {
      console.error('❌ Transcription error:', error);
    },
  });

  // Smart VAD with three-trigger chunking
  const { startVAD, stopVAD, isSpeaking } = useCustomVAD({
    onSpeechEnd: async (audioBlob) => {
      const chunkId = `chunk-${chunkCounterRef.current}`;
      console.log(`🎵 Speech segment #${chunkCounterRef.current} ended, size: ${audioBlob.size}`);
      vadDetectionsRef.current++;
      chunkCounterRef.current++;
      await transcribeAudio(audioBlob, chunkId);
    },
    disableOverlap: true,
    isRecording,
    silenceThreshold: 350,
    minDuration: 1500,
    maxDuration: 8000,
    eagerSilenceThreshold: 150,
  });

  const startRecording = async () => {
    try {
      console.log(`🎙️ Starting recording with ${audioSource}...`);
      const result = await audioSourceManager.getAudioStream(audioSource);
      setCurrentStream(result.stream);
      await startVAD(result.stream);
      setIsRecording(true);
      console.log(`✅ Recording started with ${result.actualSourceType}`);
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      alert('Failed to access audio source: ' + error);
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    stopVAD();
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }
    setIsRecording(false);
    console.log('✅ Recording stopped');
  };

  const clearTranscript = () => {
    setSegments([]);
    chunkCounterRef.current = 0;
    receivedTranscriptionsRef.current = 0;
    vadDetectionsRef.current = 0;
    sessionIdRef.current = `gst-${Date.now()}`;
  };

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle>Google STT Recorder (Smart VAD + Pitch Detection)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex gap-3">
            {!isRecording ? (
              <Button onClick={startRecording} className="bg-green-600 hover:bg-green-700">
                🎙️ Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700">
                ⏹️ Stop Recording
              </Button>
            )}
            <Button onClick={clearTranscript} variant="outline" disabled={isRecording}>
              🗑️ Clear
            </Button>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg text-sm">
            <div>
              <span className="font-semibold">Recording: </span>
              <span className={isRecording ? 'text-green-600' : 'text-gray-500'}>
                {isRecording ? '🔴 ON' : '⚫ OFF'}
              </span>
            </div>
            <div>
              <span className="font-semibold">Speaking: </span>
              <span className={isSpeaking ? 'text-orange-600' : 'text-gray-500'}>
                {isSpeaking ? '🗣️ YES' : '🤫 NO'}
              </span>
            </div>
            <div>
              <span className="font-semibold">Processing: </span>
              <span className={isProcessing ? 'text-blue-600' : 'text-gray-500'}>
                {isProcessing ? '⚙️ YES' : '✅ NO'}
              </span>
            </div>
            <div>
              <span className="font-semibold">Segments: </span>
              <span>{segments.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcription Display */}
      <Card>
        <CardHeader>
          <CardTitle>Live Transcription</CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No transcription yet. Start recording to see live transcription.
            </div>
          ) : (
            <div className="space-y-3">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-3 bg-muted rounded-lg border-l-4 border-l-blue-500"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-purple-600">
                      {segment.speaker}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(segment.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground">{segment.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
