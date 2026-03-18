/**
 * Store for managing UI language preferences
 * Separate from content translation preferences
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getBrowserLanguage } from './uiInternationalization';

interface UILanguageState {
  uiLanguage: string;
  setUILanguage: (language: string) => void;
  getUILanguage: () => string;
}

export const useUILanguageStore = create<UILanguageState>(
  persist(
    (set, get) => ({
      uiLanguage: getBrowserLanguage(),
      
      setUILanguage: (language: string) => {
        set({ uiLanguage: language });
      },
      
      getUILanguage: () => {
        return get().uiLanguage;
      }
    }),
    {
      name: 'ui-language-store',
      partialize: (state) => ({ uiLanguage: state.uiLanguage })
    }
  )
);

// Hook to get current UI language
export const useUILanguage = () => {
  const { uiLanguage } = useUILanguageStore();
  return uiLanguage;
};
