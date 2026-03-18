import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import brain from 'brain';
import { storeLocalBackup } from '../utils/transcriptionHelpers';
import { recordingTimer } from '../utils/recording/RecordingTimerService';
import {
  isSpeechRecognitionAvailable,
  getSpeechRecognition,
  blobToBase64
} from "utils/transcriptionUtils";
import { formatTime } from "utils/transcriptionUtils";
import { useSafeModuleContext } from "app";

interface Props {
  meetingTitle: string;
  participants: string[];
  companyId?: string | null;
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingStateChange: (isRecording: boolean, isPaused: boolean) => void;
  onRecordingTimeChange: (time: number) => void;
  onProcessingStateChange: (isProcessing: boolean) => void;
  onSessionIdChange: (sessionId: string | null) => void;
  onErrorChange: (error: string | null) => void;
  clientName?: string;
  projectName?: string;
  tags?: string[];
  meetingPurpose?: string;
  languagePreference?: string;
}

export const TranscriptionRecorder: React.FC<Props> = ({
  meetingTitle,
  participants,
  companyId,
  onTranscriptUpdate,
  onRecordingStateChange,
  onRecordingTimeChange,
  onProcessingStateChange,
  onSessionIdChange,
  onErrorChange,
  clientName,
  projectName,
  tags,
  meetingPurpose,
  languagePreference,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef<string>("");
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  // Timer subscription to sync with singleton timer service
  useEffect(() => {
    const unsubscribe = recordingTimer.subscribe((state) => {
      setRecordingTime(state.currentTime);
      onRecordingTimeChange(state.currentTime);
    });

    return unsubscribe;
  }, [onRecordingTimeChange]);

  // Initialize speech recognition
  const initSpeechRecognition = () => {
    // Check if speech recognition is available
    if (!isSpeechRecognitionAvailable()) {
      console.log('Speech recognition not available in this browser');
      onErrorChange("Speech recognition is not available in this browser. Please use Chrome or Edge for browser speech recognition.");
      return false;
    }
    
    try {
      // Get the SpeechRecognition constructor
      const SpeechRecognition = getSpeechRecognition();
      recognitionRef.current = new SpeechRecognition();
      
      // Configure the recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = languagePreference || 'en-US'; // Use language preference or default to English
      
      // Set up event handlers
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = transcriptRef.current;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          if (result.isFinal) {
            // For final results, add timestamp and current speaker
            const timestamp = formatTime(recordingTime);
            // Use first participant name if available, otherwise fallback to Speaker 1
            const currentSpeaker = participants.length > 0 ? participants[0] : "Speaker 1";
            finalTranscript += `\n[${timestamp}] ${currentSpeaker}: ${transcriptText}`;
          } else {
            interimTranscript += transcriptText;
          }
        }
        
        // Update the transcript
        transcriptRef.current = finalTranscript;
        onTranscriptUpdate(finalTranscript);
        
        // Display interim results separately
        if (interimTranscript) {
          const displayElement = document.getElementById('interim-transcript');
          if (displayElement) {
            const currentSpeaker = participants.length > 0 ? participants[0] : "Speaker 1";
            displayElement.textContent = `${currentSpeaker}: ${interimTranscript}`;
          }
        }
      };
      
      recognitionRef.current.onerror = (event: { error: string }) => {
        console.error('Speech recognition error:', event.error);
        onErrorChange(`Speech recognition error: ${event.error}`);
      };
      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        onErrorChange(null); // Clear any previous errors
      };
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        // Restart if still recording
        if (isRecording && recognitionRef.current) {
          console.log('Restarting speech recognition');
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Error restarting speech recognition:', error);
          }
        }
      };
      
      return true;
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      onErrorChange(`Error initializing speech recognition: ${error}`);
      return false;
    }
  };
  
  // Initialize media recorder for audio capture
  const initMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event: { data: Blob }) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        // When recording stops, we keep the audio chunks for processing
      };
      
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      onErrorChange(`Error accessing microphone: ${error}`);
      return false;
    }
  };
  
  // Start recording
  const startRecording = async () => {
    onErrorChange(null);
    
    // Initialize both speech recognition and media recorder
    const speechInitSuccess = initSpeechRecognition();
    const mediaInitSuccess = await initMediaRecorder();
    
    if (!speechInitSuccess || !mediaInitSuccess) {
      return;
    }
    
    try {
      // Start speech recognition
      recognitionRef.current.start();
      
      // Start media recorder
      mediaRecorderRef.current?.start(1000); // Collect data every second
      
      // Start singleton timer service
      recordingTimer.start();
      
      setIsRecording(true);
      setIsPaused(false);
      onRecordingStateChange(true, false);
    } catch (error) {
      console.error('Error starting recording:', error);
      onErrorChange(`Error starting recording: ${error}`);
    }
  };
  
  // Pause recording
  const pauseRecording = async () => {
    if (!isRecording || !recognitionRef.current) return;
    
    try {
      // Pause speech recognition
      recognitionRef.current.stop();
      
      // Pause media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      
      // Pause singleton timer service
      recordingTimer.pause();
      
      setIsPaused(true);
      onRecordingStateChange(true, true);
    } catch (error) {
      console.error('Error pausing recording:', error);
      onErrorChange(`Error pausing recording: ${error}`);
    }
  };
  
  // Resume recording
  const resumeRecording = async () => {
    if (!isRecording || !isPaused || !recognitionRef.current) return;
    
    try {
      // Resume speech recognition
      recognitionRef.current.start();
      
      // Resume media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      
      // Resume singleton timer service
      recordingTimer.resume();
      
      setIsPaused(false);
      onRecordingStateChange(true, false);
    } catch (error) {
      console.error('Error resuming recording:', error);
      onErrorChange(`Error resuming recording: ${error}`);
    }
  };
  
  // Stop recording
  const stopRecording = async () => {
    if (!isRecording) return;
    
    try {
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop singleton timer service
      recordingTimer.stop();
      
      setIsRecording(false);
      setIsPaused(false);
      onRecordingStateChange(false, false);
      
      // Process the recording
      await processRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
      onErrorChange(`Error stopping recording: ${error}`);
    }
  };
  
  // Process the recording using Gemini API
  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      onErrorChange("No audio recorded.");
      return;
    }
    
    onProcessingStateChange(true);
    setIsTranscribing(true);
    
    try {
      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64
      const base64Audio = await blobToBase64(audioBlob);
      
      // Send to API for processing with Gemini
      const response = await brain.transcribe_audio({
        audio_data: base64Audio,
        filename: `meeting_${Date.now()}.webm`,
        content_type: 'audio/webm',
        meeting_title: meetingTitle,
        participants: participants.length > 0 ? participants : ["Speaker 1", "Speaker 2"],
        client_name: clientName,
        project_name: projectName,
        tags: tags,
        meeting_purpose: meetingPurpose,
        language_preference: languagePreference,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Gemini transcription result:", result);
        
        // Update transcript with speaker-differentiated text
        transcriptRef.current = result.full_text;
        onTranscriptUpdate(result.full_text);
        
        setIsTranscribing(false);
      } else {
        // Handle error from API
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process with Gemini");
      }
    } catch (error) {
      console.error('Error processing with Gemini:', error);
      onErrorChange(`Error processing with Gemini: ${error}`);
    } finally {
      onProcessingStateChange(false);
      setIsTranscribing(false);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    // Clean up function that runs on component unmount
    return () => {
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping on unmount
        }
      }
      
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping on unmount
        }
      }
      
      // Stop singleton timer service
      recordingTimer.stop();
    };
  }, []);
  
  // Update session ID when it changes
  useEffect(() => {
    onSessionIdChange(sessionId);
  }, [sessionId, onSessionIdChange]);
  
  // Update recording time when it changes
  useEffect(() => {
    onRecordingTimeChange(recordingTime);
  }, [recordingTime, onRecordingTimeChange]);
  
  // This component doesn't render anything - it's a hook-like component
  // The parent should use the callbacks and state
  return null;
};
