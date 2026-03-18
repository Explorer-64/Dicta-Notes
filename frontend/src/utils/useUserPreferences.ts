
import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app';
import { DEFAULT_THEME } from '@/constants/default-theme';
import { useLanguageStore } from './languageStore';

/**
 * Hook for accessing user preferences
 * Provides default values when user is not authenticated or preferences aren't set
 * This hook now integrates with the language preference store
 */
export const useUserPreferences = () => {
  const [theme, setTheme] = useState<string>(DEFAULT_THEME);
  const { user } = useCurrentUser();
  const { preferredLanguage } = useLanguageStore();
  
  // Language preference is now handled by the language store
  
  return {
    theme,
    setTheme,
    preferredLanguage
  };
};
