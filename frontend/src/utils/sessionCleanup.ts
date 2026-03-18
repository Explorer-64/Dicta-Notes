/**
 * Centralized session storage cleanup utility to prevent cross-session data contamination
 * This addresses the issue where new sessions show data from previous sessions
 */

/**
 * Clear all session storage keys that could cause cross-session contamination
 * This should be called when creating a new session or switching between sessions
 */
export function clearAllSessionData(): void {
  console.log('🧹 Clearing all session storage data to prevent cross-session contamination');
  
  try {
    // Core transcription data
    sessionStorage.removeItem('dicta_transcription_state');
    sessionStorage.removeItem('lastSavedSessionId');
    
    // Transcript backup data
    sessionStorage.removeItem('dictaNotes_transcript_backup');
    sessionStorage.removeItem('dictaNotes_title_backup');
    sessionStorage.removeItem('dictaNotes_timestamp_backup');
    sessionStorage.removeItem('dictaNotes_company_backup');
    sessionStorage.removeItem('dictaNotes_purpose_backup');
    
    // Translation persistence data (clear all translation keys)
    clearAllTranslationData();
    
    // Support chat history (optional - user might want to keep this)
    // sessionStorage.removeItem('support-chat-history');
    
    // Auto-translate hint
    sessionStorage.removeItem('translationHintShown');
    
    console.log('✅ Session storage cleanup completed');
  } catch (error) {
    console.error('❌ Error during session storage cleanup:', error);
  }
}

/**
 * Clear all translation-related session storage keys
 * Translation keys follow the pattern: translation_{sourceLanguage}_{textHash}
 */
function clearAllTranslationData(): void {
  try {
    const keys = Object.keys(sessionStorage);
    const translationKeys = keys.filter(key => key.startsWith('translation_'));
    
    translationKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    if (translationKeys.length > 0) {
      console.log(`✅ Cleared ${translationKeys.length} translation cache entries`);
    }
  } catch (error) {
    console.warn('Failed to clear translation data:', error);
  }
}

/**
 * Clear only recording-related session data while preserving user preferences
 * Use this for lighter cleanup when you want to keep user settings
 */
export function clearRecordingSessionData(): void {
  console.log('🧹 Clearing recording session data only');
  
  try {
    // Core recording data
    sessionStorage.removeItem('dicta_transcription_state');
    sessionStorage.removeItem('lastSavedSessionId');
    
    // Transcript backup data
    sessionStorage.removeItem('dictaNotes_transcript_backup');
    sessionStorage.removeItem('dictaNotes_title_backup');
    sessionStorage.removeItem('dictaNotes_timestamp_backup');
    sessionStorage.removeItem('dictaNotes_company_backup');
    sessionStorage.removeItem('dictaNotes_purpose_backup');
    
    console.log('✅ Recording session storage cleanup completed');
  } catch (error) {
    console.error('❌ Error during recording session storage cleanup:', error);
  }
}

/**
 * Log current session storage state for debugging
 */
export function debugSessionStorage(): void {
  console.log('📊 Current session storage state:');
  
  const keys = Object.keys(sessionStorage);
  if (keys.length === 0) {
    console.log('  (empty)');
    return;
  }
  
  keys.forEach(key => {
    try {
      const value = sessionStorage.getItem(key);
      const size = value ? value.length : 0;
      console.log(`  ${key}: ${size} chars`);
    } catch (error) {
      console.log(`  ${key}: (error reading)`);
    }
  });
}
