import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import brain from 'brain';
import { AudioSourceType } from '../utils/recording/audioSourceTypes';
import { useLiveTranscriptSegments } from 'utils/hooks/useLiveTranscriptSegments';
import { recordingTimer, formatDuration } from 'utils/recording/RecordingTimerService';
import { clearAllSessionData } from 'utils/sessionCleanup';
import { clearAllTranscriptionData } from "utils/clearTranscriptionData";
import { firebaseApp } from 'app';
import { FirestoreDebugPanel } from 'components/FirestoreDebugPanel';
import { BrowserSpeechDisplay } from 'components/BrowserSpeechDisplay';
import type { LiveTranscriptionHandle } from 'components/LiveTranscription';
import { mode, Mode } from "app";
import { shouldRedirectForSystemAudio } from 'utils/deviceDetection';
import { MobileSystemAudioDialog } from 'components/MobileSystemAudioDialog';
import { useSessionStore } from 'utils/stores/sessionStore';
import { useSafeDualRecordingControls } from 'utils/recording/useSafeDualRecordingControls';
import { RecordingControlsCard } from 'components/RecordingControlsCard';
// NEW: Local storage util for browser transcript persistence
import { saveBrowserSegments, loadBrowserSegments, clearBrowserSegments } from 'utils/recording/browserTranscriptStorage';
import type { TranscriptSegment } from 'utils/types';
// NEW: Persist current browser session id across page navigation
import { getCurrentBrowserSessionId, setCurrentBrowserSessionId, clearCurrentBrowserSessionId } from 'utils/recording/browserSessionId';

interface Props {
  meetingTitle: string;
  meetingPurpose?: string;
  participants?: string[];
  companyId?: string | null;
  sessionId?: string | null; // Allow parent to pass existing session ID
  onTranscriptUpdate?: (transcript: string) => void;
  onParticipantsUpdate?: (participants: string[]) => void;
  liveTranscriptionRef?: React.RefObject<LiveTranscriptionHandle> | null;
  audioSource?: AudioSourceType;
  transcriptionMode: 'browser' | 'gemini';
  setTranscriptionMode: (mode: 'browser' | 'gemini') => void;
  onClearAll?: () => void; // NEW: Callback to clear all input fields
  // Add metadata fields for fire-and-forget session saving
  clientName?: string;
  projectName?: string;
  tags?: string[];
  languagePreference?: string;
  onRecordingToggle?: (isRecording: boolean) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onProcessingStateChange?: (isProcessing: boolean) => void;
  saveForLater?: boolean;
  setSaveForLater?: (value: boolean) => void;
  className?: string;
  // Quota guard callbacks
  beforeRecordingStart?: () => Promise<boolean>;
  onRecordingComplete?: (durationMinutes: number) => void;
}

/**
 * Unified dual recording controller that manages both:
 * - Secondary transcription engine (Browser Speech, Gemini Live, or Google STT)
 * - Traditional LiveTranscription (microphone recording for final processing)
 */
export function DualRecordingController({
  meetingTitle,
  meetingPurpose = '',
  participants = [],
  companyId,
  sessionId: externalSessionId,
  audioSource = AudioSourceType.MICROPHONE,
  onTranscriptUpdate,
  onParticipantsUpdate,
  liveTranscriptionRef,
  transcriptionMode = 'browser', // Change from enableGeminiLive to transcriptionMode
  setTranscriptionMode, // Change from setEnableGeminiLive to setTranscriptionMode
  onClearAll,
  // Add metadata fields for fire-and-forget session saving
  clientName,
  projectName,
  tags,
  languagePreference,
  onRecordingToggle,
  onRecordingStateChange,
  onProcessingStateChange,
  saveForLater = false,
  setSaveForLater,
  className = '',
  beforeRecordingStart,
  onRecordingComplete,
}: Props) {
  const navigate = useNavigate();
  // Safety check: If transcriptionMode is 'gemini', force it to 'browser'
  React.useEffect(() => {
    if (transcriptionMode === 'gemini') {
      console.warn('⚠️ Gemini Live is disabled - switching to browser mode');
      setTranscriptionMode('browser');
    }
  }, [transcriptionMode, setTranscriptionMode]);

  // Audio source selection state with localStorage persistence (like TranscriptionTest)
  const [selectedAudioSource, setSelectedAudioSource] = useState<AudioSourceType>(AudioSourceType.MICROPHONE);
  const [showMobileDialog, setShowMobileDialog] = useState(false);

  // Persist audio source selection to localStorage (like TranscriptionTest)
  useEffect(() => {
    localStorage.setItem('dicta-notes-audio-source', selectedAudioSource);
  }, [selectedAudioSource]);

  // Unified timer service instance for all recording timing
  const [timerState, setTimerState] = useState({ isRunning: false, currentTime: 0, startTime: null });

  // Traditional recording processing indicator
  const [isTraditionalProcessing, setIsTraditionalProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    // Reuse existing browser session id if available, else external id, else generate
    const stored = getCurrentBrowserSessionId();
    if (externalSessionId) return externalSessionId;
    return stored || `dual-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  // NEW: Restored segments from localStorage
  const [restoredSegments, setRestoredSegments] = useState<TranscriptSegment[]>([]);

  // Keep the session id persisted for reuse across navigation
  useEffect(() => {
    if (sessionId) {
      setCurrentBrowserSessionId(sessionId);
    }
  }, [sessionId]);

  // Core speaker state
  const [speakers, setSpeakers] = useState<string[]>(() => participants || []);

  // Sync speakers with parent when participants prop changes
  useEffect(() => {
    setSpeakers(participants || []);
  }, [participants]);

  const isSaving = useSessionStore((state) => state.isSaving);
  
  // Get live transcript segments from traditional recording (these have proper startTime/endTime)
  const { segments: liveSegments } = useLiveTranscriptSegments(sessionId);
  
  // Subscribe to singleton timer for unified timing across components
  useEffect(() => {
    const unsubscribe = recordingTimer.subscribe((state) => {
      setTimerState(state);
    });

    return unsubscribe;
  }, []);
  
  // CRITICAL: Stabilize participants array to prevent infinite re-mounting
  const stableParticipants = useMemo(() => {
    return [...participants];
  }, [participants]);
  
  // CRITICAL: Stabilize sessionId to prevent re-mounting loops
  const stableSessionId = useMemo(() => {
    return sessionId;
  }, [sessionId]);
  
  // USE THE HOOK for recording controls and state
  const {
    isTraditionalRecording,
    isPaused,
    isStopping,
    isStarting,
    isAnyRecording,
    startBothRecordings,
    pauseBothRecordings,
    resumeBothRecordings,
    stopBothRecordings,
  } = useSafeDualRecordingControls({
    selectedAudioSource,
    transcriptionMode,
    liveTranscriptionRef: liveTranscriptionRef as RefObject<LiveTranscriptionHandle>,
    beforeRecordingStart,
    onRecordingComplete,
  });

  // Clear transcription
  const clearTranscription = useCallback(async () => {
    if (!sessionId) return;
    try {
      await clearAllSessionData(sessionId as any);
      // Also clear persisted browser segments for this session
      clearBrowserSegments(sessionId);
      setRestoredSegments([]);
      // Optionally clear the current session id; a new one will be set by clearAllTranscriptionData
      clearCurrentBrowserSessionId();
      toast.success('Transcription cleared!');
    } catch (error) {
      console.error('Failed to clear transcription:', error);
      toast.error('Failed to clear transcription');
    }
  }, [sessionId]);

  // Display segments: use browser segments from ref
  const browserSegments = liveTranscriptionRef?.current?.browserSegments || [];
  
  // Load persisted segments when sessionId changes or on first mount
  useEffect(() => {
    const loaded = loadBrowserSegments(sessionId);
    if (loaded && loaded.length > 0) {
      console.log('♻️ Restored browser segments from localStorage:', loaded.length);
      setRestoredSegments(loaded);
    } else {
      setRestoredSegments([]);
    }
  }, [sessionId]);

  // Persist browser segments on every change
  useEffect(() => {
    if (!sessionId) return;
    // Save even when empty to keep storage in sync; Clear Screen explicitly removes the key
    saveBrowserSegments(sessionId, browserSegments);
  }, [browserSegments, sessionId]);
  
  const displaySegments = useMemo(() => {
    // Prefer live browser segments; fall back to restored ones
    if (browserSegments.length > 0) {
      console.log('🟢 Using live browser segments for display:', browserSegments.length);
      return browserSegments;
    }
    if (restoredSegments.length > 0) {
      console.log('🟣 Using restored segments for display:', restoredSegments.length);
      return restoredSegments;
    }

    console.log('⚪ No segments to display');
    return [] as TranscriptSegment[];
  }, [browserSegments, restoredSegments]);
  
  // Combined state for any recording activity (used to disable controls)
  const isAnyRecordingState = isTraditionalRecording;

  // Speaker Management
  const liveSpeakers = useMemo(() => {
    const liveSeakers = [...new Set(browserSegments.map(s => s.speaker).filter(Boolean))] as string[];
    console.log('🎯 Live speakers from segments:', liveSeakers);
    return liveSeakers;
  }, [browserSegments, participants]);

  // Effect to notify parent about recording and processing state changes
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isAnyRecordingState);
    }
    if (onRecordingToggle) {
      onRecordingToggle(isAnyRecordingState);
    }
  }, [isAnyRecordingState, onRecordingStateChange, onRecordingToggle]);

  useEffect(() => {
    if (onProcessingStateChange) {
      onProcessingStateChange(isTraditionalProcessing);
    }
  }, [isTraditionalProcessing, onProcessingStateChange]);
  
  // Update speakers array when segments change to include live speakers
  useEffect(() => {
    const liveSeakers = [...new Set(browserSegments.map(s => s.speaker).filter(Boolean))] as string[];
    const allSpeakers = [...new Set([...participants, ...liveSeakers])];
    setSpeakers(allSpeakers);
  }, [browserSegments, participants]);
  
  // Speaker editing - not Gemini-specific, used for general speaker management
  const updateSpeakerName = useCallback((segmentId: string, newName: string) => {
    console.log('Update speaker name:', segmentId, newName);
    // TODO: Implement Firestore update for speaker names
  }, []);

  const handleSpeakerEdit = useCallback((segmentId: string) => {
    setEditingSegmentId(segmentId);
  }, []);

  const handleSpeakerSave = useCallback((newSpeaker: string) => {
    if (editingSegmentId) {
      updateSpeakerName(editingSegmentId, newSpeaker);
      
      // Add the new speaker to our speakers list if it doesn't exist
      if (!speakers.includes(newSpeaker)) {
        setSpeakers(prev => [...prev, newSpeaker]);
      }
      
      // Update participants prop to pass speaker changes to parent/traditional recording
      if (onParticipantsUpdate) {
        const updatedParticipants = [...new Set([...participants, newSpeaker])];
        onParticipantsUpdate(updatedParticipants);
        console.log('📋 Updated participants for traditional recording:', updatedParticipants);
      }
    }
    setEditingSegmentId(null);
  }, [editingSegmentId, updateSpeakerName, speakers, onParticipantsUpdate, participants]);
  
  const handleSpeakerCancel = useCallback(() => {
    setEditingSegmentId(null);
  }, []);
  
  // Create wrapper function for clearAllTranscriptionData with required parameters
  const clearAllTranscriptionDataHandler = useCallback(() => {
    // Ensure localStorage is cleared immediately for this session and UI resets
    clearBrowserSegments(sessionId);
    setRestoredSegments([]);

    // Don't await - function is now optimized for immediate UI response
    clearAllTranscriptionData({
      sessionId,
      clearTranscription,
      setSessionId,
      onClearAll
    });
  }, [sessionId, clearTranscription, setSessionId, onClearAll]);
  
  // Update session ID when external session ID changes
  useEffect(() => {
    if (externalSessionId && externalSessionId !== sessionId) {
      console.log(`🎯 External session selected: ${externalSessionId} (was ${sessionId})`);
      try {
        // Attempt to migrate persisted browser segments from previous id to new id
        const prevSegments = loadBrowserSegments(sessionId);
        const newSegments = loadBrowserSegments(externalSessionId);
        if (prevSegments.length > 0 && newSegments.length === 0) {
          console.log(`♻️ Migrating ${prevSegments.length} browser segments -> ${externalSessionId}`);
          saveBrowserSegments(externalSessionId, prevSegments);
          clearBrowserSegments(sessionId);
          setRestoredSegments(prevSegments);
        } else if (newSegments.length > 0) {
          console.log(`📦 Found ${newSegments.length} persisted segments for external session, using them`);
          setRestoredSegments(newSegments);
        } else {
          console.log('ℹ️ No persisted segments found for either session id');
          setRestoredSegments([]);
        }
      } catch (e) {
        console.warn('Failed to migrate persisted segments on external session change:', e);
      }

      // Switch to the external session and persist as current browser session id
      setSessionId(externalSessionId);
      setCurrentBrowserSessionId(externalSessionId);
    }
  }, [externalSessionId, sessionId]);

  // Handle System Audio button click with mobile redirect check
  const handleSystemAudioClick = () => {
    if (shouldRedirectForSystemAudio()) {
      setShowMobileDialog(true);
    } else {
      setSelectedAudioSource(AudioSourceType.SYSTEM_AUDIO);
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified Recording Controls */}
      <RecordingControlsCard
        isAnyRecording={isAnyRecording}
        isPaused={isPaused}
        isStopping={isStopping}
        isStarting={isStarting}
        isTraditionalRecording={isTraditionalRecording}
        timerState={timerState}
        selectedAudioSource={selectedAudioSource}
        setSelectedAudioSource={setSelectedAudioSource}
        handleSystemAudioClick={handleSystemAudioClick}
        startBothRecordings={startBothRecordings}
        pauseBothRecordings={pauseBothRecordings}
        resumeBothRecordings={resumeBothRecordings}
        stopBothRecordings={stopBothRecordings}
        browserSegments={displaySegments}
        liveSegments={liveSegments}
        editingSegmentId={editingSegmentId}
        speakers={speakers}
        handleSpeakerEdit={handleSpeakerEdit}
        handleSpeakerSave={handleSpeakerSave}
        handleSpeakerCancel={handleSpeakerCancel}
        sessionId={sessionId}
        clearAllTranscriptionDataHandler={clearAllTranscriptionDataHandler}
        saveForLater={saveForLater}
        setSaveForLater={setSaveForLater}
      />
      
      <FirestoreDebugPanel sessionId={sessionId} isVisible={!!sessionId} />
      
      <BrowserSpeechDisplay 
        segments={displaySegments} 
        isRecording={isAnyRecordingState}
        isProcessing={isTraditionalProcessing || isSaving}
        className="mt-6"
        audioSource={selectedAudioSource}
      />
      <div>
        <MobileSystemAudioDialog 
          open={showMobileDialog}
          onOpenChange={setShowMobileDialog}
        />
      </div>
    </div>
  );
}
