/**
 * Hook and utility for getting localized UI text
 * Uses browser language detection for UI elements
 */
import { uiTranslations, getBrowserLanguage } from './uiInternationalization';
import { useUILanguageStore } from './uiLanguageStore';

// Hook to get localized UI text
export const useLocalizedText = () => {
  const { uiLanguage } = useUILanguageStore();
  
  const getText = (key: keyof typeof uiTranslations.en): string => {
    // Use store language if available, otherwise use browser detection
    const lang = uiLanguage || getBrowserLanguage();
    return uiTranslations[lang]?.[key] || uiTranslations.en[key];
  };
  
  return { getText, currentUILanguage: uiLanguage };
};

// Standalone function for getting localized text
export const getLocalizedText = (key: keyof typeof uiTranslations.en): string => {
  const { uiLanguage } = useUILanguageStore.getState();
  const lang = uiLanguage || getBrowserLanguage();
  return uiTranslations[lang]?.[key] || uiTranslations.en[key];
};
