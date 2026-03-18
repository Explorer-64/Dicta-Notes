/**
 * Navigation Store
 * 
 * Manages global navigation state for the application
 */

import { create } from 'zustand';

interface NavigationState {
  // Whether the chat UI is currently open
  isChatOpen: boolean;
  setIsChatOpen: (value: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isChatOpen: false,
  setIsChatOpen: (value) => set({ isChatOpen: value }),
}));
