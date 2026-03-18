/**
 * Utilities for handling PWA reinstallation edge cases
 */

/**
 * Attempts to clear browser storage that might prevent PWA reinstallation
 * after an uninstall by clearing caches and storage data
 */
export const clearPWAInstallationState = async (): Promise<boolean> => {
  try {
    console.log('Attempting to clear PWA installation state');
    
    // Clear localStorage items related to installation
    localStorage.removeItem('pwa_installed');
    localStorage.removeItem('pwa_installed_modules');
    localStorage.removeItem('pwa_installation_declined');
    
    // Clear caches that might be preventing reinstallation
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        if (key.includes('dicta-notes') || key.includes('pwa')) {
          await caches.delete(key);
          console.log('Cleared cache:', key);
        }
      }
    }
    
    return true;
  } catch (e) {
    console.error('Error clearing PWA installation state:', e);
    return false;
  }
};

/**
 * Forces the browser to reconsider PWA installability
 */
export const refreshInstallState = (): void => {
  // Dispatch a custom event to notify components
  window.dispatchEvent(new CustomEvent('pwaStateRefresh'));
  
  // Force page reload if needed to reset browser state
  // Commented out as this is a more aggressive solution
  // if (confirm('To finish resetting installation state, the page needs to reload. Continue?')) {
  //   window.location.reload();
  // }
};
