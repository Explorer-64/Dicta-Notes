import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DualRecordingController } from 'components/DualRecordingController';
import { useGoogleSTTTranscription } from 'utils/useGoogleSTTTranscription';
import { audioSourceManager } from 'utils/audio/AudioSourceManager';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { TranscriptionMode } from 'utils/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { detectBrowserCapabilities, getCapabilityWarning } from 'utils/recording/browserCapabilities';

interface Props {
  meetingTitle: string;
  meetingPurpose: string;
  participants: string[];
  companyId: string | null;
  clientName: string;
  projectName: string;
  tags: string[];
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
}

/**
 * TraditionalModeRecorder - SACRED COMPONENT
 * This is the backbone of our transcription system.
 * It wraps the proven DualRecordingController that has been working reliably.
 * DO NOT modify the core logic - this is a thin wrapper that delegates to DualRecordingController.
 */
export function TraditionalModeRecorder({
  meetingTitle,
  meetingPurpose,
  participants,
  companyId,
  clientName,
  projectName,
  tags,
  onTranscriptUpdate,
  onRecordingStateChange,
}: Props) {
  // Audio source state with localStorage persistence (from Transcribe.tsx)
  const [audioSource, setAudioSource] = useState<AudioSourceType>(() => {
    const saved = localStorage.getItem('dicta_audioSource');
    return saved !== null ? saved as AudioSourceType : AudioSourceType.MICROPHONE;
  });

  // Transcription mode state (from Transcribe.tsx)
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>(() => {
    const saved = localStorage.getItem('dicta_enableGeminiLive');
    const enableGeminiLive = saved !== null ? JSON.parse(saved) : true;
    return enableGeminiLive ? 'gemini' : 'browser';
  });

  // Save for Later toggle (from Transcribe.tsx)
  const [saveForLater, setSaveForLater] = useState<boolean>(() => {
    const saved = localStorage.getItem('dicta_saveForLater');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [browserWarning, setBrowserWarning] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Reference to LiveTranscription component inside DualRecordingController
  const liveTranscriptionRef = useRef<{
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    isRecording: boolean;
    isProcessing: boolean;
  } | null>(null);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('dicta_audioSource', audioSource);
  }, [audioSource]);

  useEffect(() => {
    localStorage.setItem('dicta_enableGeminiLive', JSON.stringify(transcriptionMode === 'gemini'));
  }, [transcriptionMode]);

  useEffect(() => {
    localStorage.setItem('dicta_saveForLater', JSON.stringify(saveForLater));
  }, [saveForLater]);

  // Check browser capabilities on mount (from Transcribe.tsx)
  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const capabilities = await detectBrowserCapabilities();
        const warning = getCapabilityWarning(capabilities);
        setBrowserWarning(warning);
      } catch (error) {
        console.error('Error checking browser capabilities:', error);
      }
    };
    checkCapabilities();
  }, []);

  // Handle participants update callback
  const handleParticipantsUpdate = useCallback((updatedParticipants: string[]) => {
    // This is called from DualRecordingController when participants are identified
    console.log('Participants updated:', updatedParticipants);
  }, []);

  // Handle recording toggle callback
  const handleRecordingToggle = useCallback((recording: boolean) => {
    onRecordingStateChange(recording);
  }, [onRecordingStateChange]);

  return (
    <div className="space-y-4">
      {/* Browser Warning */}
      {browserWarning && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{browserWarning}</AlertDescription>
        </Alert>
      )}

      {/* Audio Source Selection */}
      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="audioSource" className="text-sm font-medium mb-2 block">
              Audio Source
            </Label>
            <Select
              value={audioSource}
              onValueChange={(value) => setAudioSource(value as AudioSourceType)}
            >
              <SelectTrigger id="audioSource">
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

          <div>
            <Label htmlFor="transcriptionMode" className="text-sm font-medium mb-2 block">
              Transcription Engine
            </Label>
            <Select
              value={transcriptionMode}
              onValueChange={(value) => setTranscriptionMode(value as TranscriptionMode)}
            >
              <SelectTrigger id="transcriptionMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="browser">Browser Speech API</SelectItem>
                <SelectItem value="gemini">Gemini Live</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <p className="text-sm text-purple-900 dark:text-purple-100">
              ⚡ Traditional mode includes all features: dual transcription engines,
              speaker identification, and full session management.
            </p>
          </div>
        </div>
      </Card>

      {/* DualRecordingController - The Sacred Component */}
      {/* This is the proven, working transcription system from Transcribe.tsx */}
      {/* DO NOT modify how this component works - it's the backbone */}
      <DualRecordingController
        meetingTitle={meetingTitle}
        meetingPurpose={meetingPurpose}
        participants={participants}
        companyId={companyId}
        sessionId={sessionId}
        audioSource={audioSource}
        onTranscriptUpdate={onTranscriptUpdate}
        onParticipantsUpdate={handleParticipantsUpdate}
        liveTranscriptionRef={liveTranscriptionRef}
        transcriptionMode={transcriptionMode}
        setTranscriptionMode={setTranscriptionMode}
        onRecordingToggle={handleRecordingToggle}
        clientName={clientName}
        projectName={projectName}
        tags={tags}
        saveForLater={saveForLater}
        setSaveForLater={setSaveForLater}
      />
    </div>
  );
}
