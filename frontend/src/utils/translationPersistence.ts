/**
 * Simple translation persistence utilities for TranslationControls component
 */

interface TranslationState {
  translation: string;
  showTranslation: boolean;
  selectedTargetLang: string;
  sourceLanguage: string;
  originalText: string;
}

/**
 * Generate a unique key for translation state based on text content
 */
function getTranslationKey(text: string, sourceLanguage: string): string {
  // Create a short hash of the text to keep sessionStorage keys manageable
  const textHash = text.slice(0, 50).replace(/\s+/g, '_');
  return `translation_${sourceLanguage}_${textHash}`;
}

/**
 * Save translation state for a specific text segment
 */
export function saveTranslationState(text: string, sourceLanguage: string, state: Omit<TranslationState, 'originalText' | 'sourceLanguage'>): void {
  try {
    if (!text || !sourceLanguage) return;
    
    const key = getTranslationKey(text, sourceLanguage);
    const fullState: TranslationState = {
      ...state,
      originalText: text,
      sourceLanguage
    };
    
    sessionStorage.setItem(key, JSON.stringify(fullState));
  } catch (error) {
    console.warn('Failed to save translation state:', error);
  }
}

/**
 * Load translation state for a specific text segment
 */
export function loadTranslationState(text: string, sourceLanguage: string): TranslationState | null {
  try {
    if (!text || !sourceLanguage) return null;
    
    const key = getTranslationKey(text, sourceLanguage);
    const saved = sessionStorage.getItem(key);
    
    if (!saved) return null;
    
    const state = JSON.parse(saved) as TranslationState;
    
    // Verify the saved state matches the current text (in case of hash collision)
    if (state.originalText === text && state.sourceLanguage === sourceLanguage) {
      return state;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to load translation state:', error);
    return null;
  }
}

/**
 * Clear translation state for a specific text segment
 */
export function clearTranslationState(text: string, sourceLanguage: string): void {
  try {
    if (!text || !sourceLanguage) return;
    
    const key = getTranslationKey(text, sourceLanguage);
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear translation state:', error);
  }
}

/**
 * Clear all translation states (useful when starting new session)
 */
export function clearAllTranslationStates(): void {
  try {
    const keysToRemove: string[] = [];
    
    // Find all translation keys in sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('translation_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all translation keys
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear all translation states:', error);
  }
}
