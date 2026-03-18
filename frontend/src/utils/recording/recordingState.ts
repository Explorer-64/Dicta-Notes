import { useState, useRef } from 'react';
import { TranscriptSegment } from 'utils/types';
import { SpeakerChangeEvent } from '../speakerTimelineUtils';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  transcript: string;
  recordingTime: number;
  errorMessage: string | null;
  isProcessing: boolean;
  sessionId: string | null;
  isCreatingSession: boolean;
  activeSpeakerIndex: number;
  audioPlaybackBlob: Blob | null;
  speakerTimeline: SpeakerChangeEvent[];
  transcriptionMode: 'browser' | 'gemini' | 'hybrid';
  processingChunk: boolean;
  offlineMode: boolean;
  corrections: Map<string, string>;
  interimText: string;
  detectedLanguage: string;
  browserSegments: TranscriptSegment[];
  interimSegment: TranscriptSegment | null;
  geminiTranscript: string;
  geminiSegments: Map<string, string>;
}

export interface RecordingRefs {
  recognitionRef: React.MutableRefObject<any>;
  timerRef: React.MutableRefObject<number | null>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  browserTranscriptRef: React.MutableRefObject<string>;
  transcriptRef: React.MutableRefObject<string>;
  lastAudioSentRef: React.MutableRefObject<number>;
}

export function useRecordingState(): {
  state: RecordingState;
  setState: {
    setIsRecording: (value: boolean) => void;
    setIsPaused: (value: boolean) => void;
    setTranscript: (value: string) => void;
    setRecordingTime: (value: number) => void;
    setErrorMessage: (value: string | null) => void;
    setIsProcessing: (value: boolean) => void;
    setSessionId: (value: string | null) => void;
    setIsCreatingSession: (value: boolean) => void;
    setActiveSpeakerIndex: (value: number) => void;
    setAudioPlaybackBlob: (value: Blob | null) => void;
    setSpeakerTimeline: (value: SpeakerChangeEvent[]) => void;
    setTranscriptionMode: (value: 'browser' | 'gemini' | 'hybrid') => void;
    setProcessingChunk: (value: boolean) => void;
    setOfflineMode: (value: boolean) => void;
    setCorrections: (value: Map<string, string>) => void;
    setInterimText: (value: string) => void;
    setDetectedLanguage: (value: string) => void;
    setBrowserSegments: (value: TranscriptSegment[]) => void;
    setInterimSegment: (value: TranscriptSegment | null) => void;
    setGeminiTranscript: (value: string) => void;
    setGeminiSegments: (value: Map<string, string>) => void;
  };
} {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState<number>(0);
  const [audioPlaybackBlob, setAudioPlaybackBlob] = useState<Blob | null>(null);
  const [speakerTimeline, setSpeakerTimeline] = useState<SpeakerChangeEvent[]>([]);
  const [transcriptionMode, setTranscriptionMode] = useState<'browser' | 'gemini' | 'hybrid'>('browser');
  const [processingChunk, setProcessingChunk] = useState(false);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [corrections, setCorrections] = useState<Map<string, string>>(new Map());
  const [interimText, setInterimText] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [browserSegments, setBrowserSegments] = useState<TranscriptSegment[]>([]);
  const [interimSegment, setInterimSegment] = useState<TranscriptSegment | null>(null);
  const [geminiTranscript, setGeminiTranscript] = useState<string>('');
  const [geminiSegments, setGeminiSegments] = useState<Map<string, string>>(new Map());

  return {
    state: {
      isRecording,
      isPaused,
      transcript,
      recordingTime,
      errorMessage,
      isProcessing,
      sessionId,
      isCreatingSession,
      activeSpeakerIndex,
      audioPlaybackBlob,
      speakerTimeline,
      transcriptionMode,
      processingChunk,
      offlineMode,
      corrections,
      interimText,
      detectedLanguage,
      browserSegments,
      interimSegment,
      geminiTranscript,
      geminiSegments,
    },
    setState: {
      setIsRecording,
      setIsPaused,
      setTranscript,
      setRecordingTime,
      setErrorMessage,
      setIsProcessing,
      setSessionId,
      setIsCreatingSession,
      setActiveSpeakerIndex,
      setAudioPlaybackBlob,
      setSpeakerTimeline,
      setTranscriptionMode,
      setProcessingChunk,
      setOfflineMode,
      setCorrections,
      setInterimText,
      setDetectedLanguage,
      setBrowserSegments,
      setInterimSegment,
      setGeminiTranscript,
      setGeminiSegments,
    },
  };
}

export function useRecordingRefs(): RecordingRefs {
  return {
    recognitionRef: useRef<any>(null),
    timerRef: useRef<number | null>(null),
    audioChunksRef: useRef<Blob[]>([]),
    mediaRecorderRef: useRef<MediaRecorder | null>(null),
    browserTranscriptRef: useRef<string>(''),
    transcriptRef: useRef<string>(''),
    lastAudioSentRef: useRef<number>(0),
  };
}
