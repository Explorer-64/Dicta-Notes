import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const FORM_STORAGE_KEY = 'transcribe-form-data';

export interface TranscribeFormData {
  meetingTitle: string;
  meetingPurpose: string;
  participants: string[];
  clientName: string;
  projectName: string;
  tags: string[];
  notes: string;
  timeSpent: number;
  selectedShareableSessionId: string | null;
}

export interface UseTranscribeFormReturn {
  // State
  meetingTitle: string;
  setMeetingTitle: (value: string) => void;
  meetingPurpose: string;
  setMeetingPurpose: (value: string) => void;
  participants: string[];
  setParticipants: (value: string[]) => void;
  newParticipant: string;
  setNewParticipant: (value: string) => void;
  clientName: string;
  setClientName: (value: string) => void;
  projectName: string;
  setProjectName: (value: string) => void;
  tags: string[];
  setTags: (value: string[]) => void;
  newTag: string;
  setNewTag: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  timeSpent: number;
  setTimeSpent: (value: number) => void;
  selectedShareableSessionId: string | null;
  setSelectedShareableSessionId: (value: string | null) => void;
  
  // Warning dialog state
  showSpeakerWarning: boolean;
  setShowSpeakerWarning: (value: boolean) => void;
  pendingParticipant: string;
  setPendingParticipant: (value: string) => void;
  
  // Initialization state
  isInitialized: boolean;
  formDataLoaded: boolean;
  
  // Handlers
  handleAddParticipant: () => void;
  confirmAddParticipant: () => void;
  cancelAddParticipant: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  removeParticipant: (index: number) => void;
  addTag: () => void;
  removeTag: (index: number) => void;
  increaseTimeSpent: (minutes: number) => void;
  clearForm: () => void;
  clearFormData: () => void;
  hasFormData: () => boolean;
}

/**
 * Custom hook to manage all form state and logic for the Transcribe page.
 * Handles form data persistence, participant/tag management, and form clearing.
 */
export function useTranscribeForm(): UseTranscribeFormReturn {
  // Form fields
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [meetingPurpose, setMeetingPurpose] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [selectedShareableSessionId, setSelectedShareableSessionId] = useState<string | null>(null);
  
  // Warning dialog state
  const [showSpeakerWarning, setShowSpeakerWarning] = useState<boolean>(false);
  const [pendingParticipant, setPendingParticipant] = useState<string>('');
  
  // Initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  const [formDataLoaded, setFormDataLoaded] = useState(false);

  // Load form data from localStorage on mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeForm = async () => {
      try {
        const savedData = localStorage.getItem(FORM_STORAGE_KEY);
        if (savedData && isMounted) {
          try {
            const parsed: TranscribeFormData = JSON.parse(savedData);
            setMeetingTitle(parsed.meetingTitle || '');
            setMeetingPurpose(parsed.meetingPurpose || '');
            setParticipants(parsed.participants || []);
            setClientName(parsed.clientName || '');
            setProjectName(parsed.projectName || '');
            setTags(parsed.tags || []);
            setNotes(parsed.notes || '');
            setTimeSpent(parsed.timeSpent || 0);
            setSelectedShareableSessionId(parsed.selectedShareableSessionId || null);
          } catch (error) {
            console.error('Error loading saved form data:', error);
          }
        }
        
        if (isMounted) {
          setFormDataLoaded(true);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };
    
    initializeForm();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Save form data to localStorage with debouncing
  useEffect(() => {
    if (!isInitialized || !formDataLoaded) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const formData: TranscribeFormData = {
          meetingTitle,
          meetingPurpose,
          participants,
          clientName,
          projectName,
          tags,
          notes,
          timeSpent,
          selectedShareableSessionId
        };
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    }, 300); // Debounce to prevent excessive writes
    
    return () => clearTimeout(timeoutId);
  }, [isInitialized, formDataLoaded, meetingTitle, meetingPurpose, participants, clientName, projectName, tags, notes, timeSpent, selectedShareableSessionId]);

  // Clear form data from localStorage
  const clearFormData = useCallback(() => {
    localStorage.removeItem(FORM_STORAGE_KEY);
  }, []);

  // Clear all form fields
  const clearForm = useCallback(() => {
    console.log('🧹 Clearing all form fields');
    setMeetingTitle('');
    setMeetingPurpose('');
    setParticipants([]);
    setNewParticipant('');
    setClientName('');
    setProjectName('');
    setTags([]);
    setNewTag('');
    setNotes('');
    setTimeSpent(0);
    setSelectedShareableSessionId(null);
    clearFormData();
    console.log('✅ All form fields cleared');
  }, [clearFormData]);

  // Handle adding a participant with warning dialog
  const handleAddParticipant = useCallback(() => {
    if (newParticipant.trim()) {
      setPendingParticipant(newParticipant.trim());
      setShowSpeakerWarning(true);
    }
  }, [newParticipant]);

  // Confirm adding a participant
  const confirmAddParticipant = useCallback(() => {
    if (pendingParticipant) {
      setParticipants(prev => [...prev, pendingParticipant]);
      setNewParticipant('');
      setPendingParticipant('');
      setShowSpeakerWarning(false);
    }
  }, [pendingParticipant]);

  // Cancel adding a participant
  const cancelAddParticipant = useCallback(() => {
    setPendingParticipant('');
    setShowSpeakerWarning(false);
  }, []);

  // Handle adding participant with Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newParticipant.trim()) {
      handleAddParticipant();
    }
  }, [newParticipant, handleAddParticipant]);

  // Remove a participant
  const removeParticipant = useCallback((index: number) => {
    setParticipants(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Add a tag
  const addTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, tags]);

  // Remove a tag
  const removeTag = useCallback((index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Increase time spent
  const increaseTimeSpent = useCallback((minutes: number) => {
    setTimeSpent(prev => prev + minutes);
    toast.success(`Added ${minutes} minutes to time spent`);
  }, []);

  // Check if any form fields have content
  const hasFormData = useCallback(() => {
    return (
      meetingTitle.trim() !== '' ||
      meetingPurpose.trim() !== '' ||
      participants.length > 0 ||
      clientName.trim() !== '' ||
      projectName.trim() !== '' ||
      tags.length > 0 ||
      notes.trim() !== '' ||
      timeSpent > 0 ||
      selectedShareableSessionId !== null
    );
  }, [meetingTitle, meetingPurpose, participants, clientName, projectName, tags, notes, timeSpent, selectedShareableSessionId]);

  return {
    // State
    meetingTitle,
    setMeetingTitle,
    meetingPurpose,
    setMeetingPurpose,
    participants,
    setParticipants,
    newParticipant,
    setNewParticipant,
    clientName,
    setClientName,
    projectName,
    setProjectName,
    tags,
    setTags,
    newTag,
    setNewTag,
    notes,
    setNotes,
    timeSpent,
    setTimeSpent,
    selectedShareableSessionId,
    setSelectedShareableSessionId,
    
    // Warning dialog state
    showSpeakerWarning,
    setShowSpeakerWarning,
    pendingParticipant,
    setPendingParticipant,
    
    // Initialization state
    isInitialized,
    formDataLoaded,
    
    // Handlers
    handleAddParticipant,
    confirmAddParticipant,
    cancelAddParticipant,
    handleKeyDown,
    removeParticipant,
    addTag,
    removeTag,
    increaseTimeSpent,
    clearForm,
    clearFormData,
    hasFormData,
  };
}
