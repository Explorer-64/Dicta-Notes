/**
 * Global configuration for browser speech recognition
 * Used to control whether browser speech should run based on audio source
 */

let globalDisableBrowserSpeech = false;

/**
 * Set whether browser speech recognition should be disabled
 * @param disable - true to disable, false to enable
 */
export function setDisableBrowserSpeech(disable: boolean): void {
  globalDisableBrowserSpeech = disable;
  console.log(`🎤 Browser speech recognition ${disable ? 'DISABLED' : 'ENABLED'}`);
}

/**
 * Check if browser speech recognition should be disabled
 * @returns true if disabled, false if enabled
 */
export function shouldDisableBrowserSpeech(): boolean {
  return globalDisableBrowserSpeech;
}
