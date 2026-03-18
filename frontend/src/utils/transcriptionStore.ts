import { create } from 'zustand';

// Types for transcription state
interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: number;
  speaker?: string;
  language?: string;
}

interface TranscriptionStore {
  segments: TranscriptionSegment[];
  currentLanguage: string;
  isRecording: boolean;
  
  // Actions
  addSegment: (segment: TranscriptionSegment) => void;
  updateLanguage: (language: string) => void;
  setRecording: (recording: boolean) => void;
  clearSegments: () => void;
  updateSegment: (id: string, updates: Partial<TranscriptionSegment>) => void;
}

// Global transcription store that survives component remounts
export const useTranscriptionStore = create<TranscriptionStore>((set, get) => ({
  segments: [],
  currentLanguage: 'en',
  isRecording: false,
  
  addSegment: (segment) => {
    set((state) => ({
      segments: [...state.segments, segment]
    }));
  },
  
  updateLanguage: (language) => {
    console.log('🌍 [TranscriptionStore] Language updated:', language);
    set({ currentLanguage: language });
  },
  
  setRecording: (recording) => {
    set({ isRecording: recording });
  },
  
  clearSegments: () => {
    set({ segments: [] });
  },
  
  updateSegment: (id, updates) => {
    set((state) => ({
      segments: state.segments.map(segment => 
        segment.id === id ? { ...segment, ...updates } : segment
      )
    }));
  },
}));
