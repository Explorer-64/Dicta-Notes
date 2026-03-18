/**
 * Implementation: service-worker
 * 
 * Description:
 * Utility functions for working with service workers and module management in PWA context.
 */

import { usePWAStore } from './pwaStore';

/**
 * Notifies the service worker about modules that have been installed with the PWA
 * @param moduleIds Array of module IDs that were enabled during PWA installation
 */
export const notifyModulesPWAInstalled = async (moduleIds: string[]): Promise<boolean> => {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.warn('PWA: No active service worker found for module notification');
    return false;
  }
  
  try {
    // Get the service worker registration from the store
    const registration = usePWAStore.getState().serviceWorkerRegistration;
    if (!registration) {
      console.warn('PWA: No service worker registration found in store');
      return false;
    }
    
    // Send a message to the service worker
    navigator.serviceWorker.controller.postMessage({
      type: 'MODULES_INSTALLED',
      moduleIds
    });
    
    console.log('PWA: Notified service worker about installed modules:', moduleIds);
    return true;
  } catch (error) {
    console.error('PWA: Error notifying service worker about modules:', error);
    return false;
  }
};

/**
 * Checks if the service worker is active and registered
 */
export const isServiceWorkerActive = (): boolean => {
  return !!navigator.serviceWorker && 
         !!navigator.serviceWorker.controller && 
         !!usePWAStore.getState().serviceWorkerRegistration;
};

/**
 * Updates the PWA's cache for specific modules
 * @param moduleIds Array of module IDs to update cache for
 */
export const updateModuleCache = async (moduleIds: string[]): Promise<boolean> => {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.warn('PWA: No active service worker found for cache update');
    return false;
  }
  
  try {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_MODULE_CACHE',
      moduleIds
    });
    
    console.log('PWA: Requested module cache update for:', moduleIds);
    return true;
  } catch (error) {
    console.error('PWA: Error requesting module cache update:', error);
    return false;
  }
};

/**
 * Clears the cache for specific modules
 * @param moduleIds Array of module IDs to clear cache for
 */
export const clearModuleCache = async (moduleIds: string[]): Promise<boolean> => {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.warn('PWA: No active service worker found for cache clearing');
    return false;
  }
  
  try {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_MODULE_CACHE',
      moduleIds
    });
    
    console.log('PWA: Requested module cache clearing for:', moduleIds);
    return true;
  } catch (error) {
    console.error('PWA: Error requesting module cache clearing:', error);
    return false;
  }
};
