import { create } from 'zustand';

interface SessionState {
  sessionId: string | null;
  isSaving: boolean;
  setSessionId: (id: string | null) => void;
  setIsSaving: (saving: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  isSaving: false,
  setSessionId: (id) => set({ sessionId: id }),
  setIsSaving: (saving) => set({ isSaving: saving }),
}));
