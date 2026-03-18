import { useCallback, useEffect, useState, RefObject } from 'react';
import { toast } from 'sonner';
import { recordingTimer } from './RecordingTimerService';
import { audioCaptain } from './audioCaptain';
import { AudioSourceType } from './audioSourceTypes';
import { LiveTranscriptionHandle } from 'components/LiveTranscription';
import { setDisableBrowserSpeech } from './browserSpeechConfig';

interface UseDualRecordingControlsOptions {
  selectedAudioSource: AudioSourceType;
  transcriptionMode: string;
  liveTranscriptionRef: RefObject<LiveTranscriptionHandle>;
  beforeRecordingStart?: () => Promise<boolean>;
  onRecordingComplete?: (durationMinutes: number) => void;
}

interface UseDualRecordingControlsReturn {
  isTraditionalRecording: boolean;
  isPaused: boolean;
  isStopping: boolean;
  isAnyRecording: boolean;
  startBothRecordings: () => Promise<void>;
  pauseBothRecordings: () => Promise<void>;
  resumeBothRecordings: () => Promise<void>;
  stopBothRecordings: () => Promise<void>;
}

/**
 * Custom hook to manage dual recording system controls
 * Handles starting, pausing, resuming, and stopping recordings
 */
export const useDualRecordingControls = ({
  selectedAudioSource,
  transcriptionMode,
  liveTranscriptionRef,
  beforeRecordingStart,
  onRecordingComplete,
}: UseDualRecordingControlsOptions): UseDualRecordingControlsReturn => {
  // Recording state
  const [isTraditionalRecording, setIsTraditionalRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Derived state
  const isAnyRecording = isTraditionalRecording;

  // Enhanced start recording with audio source selection
  const startBothRecordings = useCallback(async () => {
    console.log('🔥 DEBUG: startBothRecordings called with selectedAudioSource:', selectedAudioSource);
    
    if (isAnyRecording) {
      console.warn('⚠️ Already recording, ignoring duplicate start request');
      return;
    }

    // Check quota before starting
    if (beforeRecordingStart) {
      const allowed = await beforeRecordingStart();
      if (!allowed) {
        console.log('🚫 Recording blocked by quota check');
        return;
      }
    }

    try {
      console.log('⏰ Unified timer service starting...');
      recordingTimer.start();
      console.log(`⏰ Unified timer service started at: ${Date.now()}`);
      
      console.log('🎯 Starting DUAL recording systems with audio source:', selectedAudioSource);
      
      // Set audio source before capturing
      console.log('🎯 Setting audio source:', selectedAudioSource);
      audioCaptain.setAudioSource(selectedAudioSource);
      
      // Capture original stream ONCE
      const originalStream = await audioCaptain.captureAudio();
      console.log('🎵 Original audio stream captured with source:', selectedAudioSource);
      
      // Create BOTH stream clones upfront
      const secondaryEngineStream = await audioCaptain.createStreamCopy('secondary-engine', 'Secondary Engine Stream (MicVAD/Google STT)');
      console.log('🎵 Secondary engine stream clone created');
      
      const traditionalStream = await audioCaptain.createStreamCopy('traditional', 'Traditional Recording Stream');
      console.log('🎵 Traditional recording stream clone created');
      
      // ALWAYS start traditional recording for final processing
      if (liveTranscriptionRef?.current) {
        console.log('🎤 Starting traditional recording with cloned stream...');
        
        // Pass the cloned stream to traditional recording
        await liveTranscriptionRef.current.startRecording(traditionalStream);
        setIsTraditionalRecording(true);
        console.log('✅ Traditional recording started with cloned stream');
      } else {
        console.warn('⚠️ LiveTranscription ref not available');
      }
      
      const audioMessage = selectedAudioSource === AudioSourceType.SYSTEM_AUDIO 
        ? 'Dual recording started - Capturing meeting audio'
        : 'Dual recording started - Live transcription';
      toast.success(audioMessage);
      
    } catch (error) {
      console.error('Failed to start dual recording:', error);
      toast.error('Failed to start dual recording system');
    }
  }, [isAnyRecording, selectedAudioSource, transcriptionMode, liveTranscriptionRef]);
  
  // Pause function for dual recording
  const pauseBothRecordings = useCallback(async () => {
    try {
      console.log('⏸️ Pausing DUAL recording systems...');
      
      // Pause timer service (preserves elapsed time)
      recordingTimer.pause();
      
      // Pause traditional recording for final processing
      if (liveTranscriptionRef?.current?.pauseRecording) {
        await liveTranscriptionRef.current.pauseRecording();
        console.log('⏸️ Traditional recording properly paused (no processing triggered)');
      } else {
        console.warn('⚠️ Traditional recording pause method not available');
      }
      
      setIsPaused(true);
      toast.success('Recording paused - can be resumed without processing');
      
    } catch (error) {
      console.error('Failed to pause dual recording:', error);
      toast.error('Failed to pause recording');
    }
  }, [liveTranscriptionRef]);
  
  // Resume both recording systems
  const resumeBothRecordings = useCallback(async () => {
    console.log('📝 Resuming DUAL recording systems...');
    
    let traditionalResumed = true;
    
    // ALWAYS resume traditional recording for final processing
    console.log('🔍 DEBUG: About to check traditional recording resume...');
    if (liveTranscriptionRef?.current?.resumeRecording) {
      try {
        console.log('🔍 DEBUG: Calling liveTranscriptionRef.current.resumeRecording()...');
        await liveTranscriptionRef.current.resumeRecording();
        console.log('▶️ Traditional recording properly resumed (continuing same session)');
        console.log('🔍 DEBUG: Traditional recording resumed successfully');
      } catch (error) {
        console.error('❌ Failed to resume Traditional recording:', error);
        traditionalResumed = false;
      }
    } else {
      console.warn('⚠️ Traditional recording resume method not available');
      console.log('🔍 DEBUG: liveTranscriptionRef?.current:', !!liveTranscriptionRef?.current);
      console.log('🔍 DEBUG: resumeRecording method:', !!liveTranscriptionRef?.current?.resumeRecording);
      traditionalResumed = false;
    }
    
    // ONLY set isPaused=false if both systems successfully resumed
    const allSystemsResumed = traditionalResumed;
    console.log('🔍 DEBUG: allSystemsResumed calculation:');
    console.log('🔍 DEBUG: traditionalResumed:', traditionalResumed);
    console.log('🔍 DEBUG: allSystemsResumed:', allSystemsResumed);

    if (allSystemsResumed) {
      setIsPaused(false);
      console.log('✅ Both recording systems resumed successfully - setting isPaused=false');
    } else {
      console.error('❌ Not all recording systems resumed successfully - keeping isPaused=true');
      console.error('❌ Resume failed. Traditional:', traditionalResumed);
    }
  }, [liveTranscriptionRef]);
  
  // Stop both recording systems with speaker timeline integration
  const stopBothRecordings = useCallback(async () => {
    if (isStopping) {
      console.warn('⚠️ Already stopping, ignoring duplicate stop request');
      return;
    }

    try {
      setIsStopping(true);
      console.log('🎯 Stopping DUAL recording systems...');
      
      // Stop unified timer service IMMEDIATELY when stopping
      recordingTimer.stop();
      
      // Get final duration for quota tracking
      const finalDurationSeconds = recordingTimer.getDuration();
      const durationMinutes = Math.ceil(finalDurationSeconds / 60);
      console.log(`⏱️ Recording duration: ${finalDurationSeconds}s (${durationMinutes} minutes)`);
      
      // Stop the audio captain to release the microphone completely
      audioCaptain.stopAllCapture();
      console.log('🎤 Audio Captain stopped all capture, releasing microphone.');
      
      // Re-enable browser speech for next recording
      setDisableBrowserSpeech(false);
      console.log('🎤 Browser speech recognition re-enabled for next session');

      // Reset pause state when stopping
      setIsPaused(false);
      
      // Wait a brief moment to ensure all state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ALWAYS stop traditional recording for final processing
      if (liveTranscriptionRef?.current) {
        await liveTranscriptionRef.current.stopRecording();
        setIsTraditionalRecording(false);
        console.log('⏹️ Traditional recording stopped via ref (ALWAYS ACTIVE)');
      } else {
        console.warn('⚠️ LiveTranscription ref not available');
      }
      
      // Track usage after recording completes
      if (onRecordingComplete && durationMinutes > 0) {
        console.log(`📊 Tracking ${durationMinutes} minutes of usage`);
        onRecordingComplete(durationMinutes);
      }

      toast.success('Dual recording stopped - Processing final transcript...');
      
    } catch (error) {
      console.error('Failed to stop dual recording:', error);
      toast.error('Error stopping recording systems');
    } finally {
      setIsStopping(false);
    }
  }, [liveTranscriptionRef, isStopping, onRecordingComplete]);
  
  // Monitor traditional recording state via ref
  useEffect(() => {
    const checkRecordingState = () => {
      if (liveTranscriptionRef?.current) {
        const isRecording = liveTranscriptionRef.current.isRecording;
        if (isRecording !== isTraditionalRecording) {
          console.log('🔄 Traditional recording state changed:', isRecording);
          setIsTraditionalRecording(isRecording);
        }
      }
    };
    
    // Check periodically
    const interval = setInterval(checkRecordingState, 1000);
    
    return () => clearInterval(interval);
  }, [liveTranscriptionRef, isTraditionalRecording]);

  return {
    isTraditionalRecording,
    isPaused,
    isStopping,
    isAnyRecording,
    startBothRecordings,
    pauseBothRecordings,
    resumeBothRecordings,
    stopBothRecordings,
  };
};
