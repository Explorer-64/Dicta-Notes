import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionMetadata {
  clientName: string;
  projectName: string;
  tags: string[];
}

interface SessionMetadataStore {
  metadata: SessionMetadata;
  setClientName: (clientName: string) => void;
  setProjectName: (projectName: string) => void;
  setTags: (tags: string[]) => void;
  clearMetadata: () => void;
}

const defaultMetadata: SessionMetadata = {
  clientName: '',
  projectName: '',
  tags: [],
};

export const useSessionMetadataStore = create<SessionMetadataStore>()(persist(
  (set) => ({
    metadata: defaultMetadata,
    setClientName: (clientName) => set((state) => ({ 
      metadata: { ...state.metadata, clientName } 
    })),
    setProjectName: (projectName) => set((state) => ({ 
      metadata: { ...state.metadata, projectName } 
    })),
    setTags: (tags) => set((state) => ({ 
      metadata: { ...state.metadata, tags } 
    })),
    clearMetadata: () => set({ metadata: defaultMetadata }),
  }),
  {
    name: 'session-metadata-storage',
  }
));
