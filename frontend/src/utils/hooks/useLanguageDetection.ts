import { useState } from 'react';

type LanguageDetectionResult = {
  detectedLanguage: string;
  isDetecting: boolean;
};

/**
 * DEPRECATED: This hook is no longer used for language detection.
 * The app now relies on Gemini's built-in language detection capabilities.
 * 
 * This is kept for backwards compatibility only and will be removed in a future version.
 */
export function useLanguageDetection(): LanguageDetectionResult {
  const [detectedLanguage] = useState<string>('en');
  const [isDetecting] = useState<boolean>(false);

  // This hook no longer does anything - we rely on Gemini for language detection
  console.warn('useLanguageDetection is deprecated and will be removed in a future version');

  return { detectedLanguage, isDetecting };
}
