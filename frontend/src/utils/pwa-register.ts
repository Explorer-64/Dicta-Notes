/**
 * Implementation: pwa-register
 * 
 * Description:
 * Utility functions for registering and managing the service worker for PWA functionality.
 */

import { usePWAStore } from './pwaStore';

/**
 * Checks if the PWA is installable based on technical criteria
 */
export const isPWAInstallable = (): boolean => {
  return 'serviceWorker' in navigator && window.isSecureContext;
};

/**
 * Unregisters all existing service workers
 */
export const unregisterServiceWorkers = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('PWA: Unregistered existing service worker');
    }
    return true;
  } catch (error) {
    console.error('PWA: Error unregistering service workers:', error);
    return false;
  }
};

/**
 * Sets up a basic cache polyfill for browsers that don't fully support service workers
 */
export const setupCachePolyfill = async (): Promise<boolean> => {
  // This is a simplified fallback that doesn't use service workers
  // but attempts to use browser cache where possible
  console.log('PWA: Setting up cache polyfill');
  return false; // Currently just a placeholder
};

/**
 * Registers the service worker for PWA functionality
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | false> => {
  // Get the store to save registration information
  const setServiceWorkerRegistration = usePWAStore.getState().setServiceWorkerRegistration;
  
  if (!('serviceWorker' in navigator)) {
    console.warn('PWA: Service workers are not supported in this browser');
    return false;
  }

  try {
    // First, clean up any existing service workers - but don't force reload
    
    // Try to get the base path from app constants if available
    let basePath = '/';
    try {
      // Import dynamically to avoid circular dependencies
      const appModule = await import('app');
      basePath = appModule.APP_BASE_PATH || '/';
      // Ensure path ends with trailing slash
      if (!basePath.endsWith('/')) {
        basePath += '/';
      }
      console.log('PWA: Using base path for service worker:', basePath);
    } catch (error) {
      console.warn('PWA: Could not get APP_BASE_PATH, using default:', error);
    }
    
    // Use only the static service worker to avoid conflicts
    // The backend-generated service worker at /pwa/service-worker.js conflicts with this one
    const swPaths = [
      `${window.location.origin}${basePath}sw.js`,  // Absolute path with base path
      `${window.location.origin}/sw.js`,              // Absolute path at root
      './sw.js',                                    // Relative to current scope (fallback)
      `${basePath}sw.js`,                            // With base path (fallback)
    ];
    
    let registration = null;
    let registrationError = null;
    
    // Try each path until one succeeds
    for (const swPath of swPaths) {
      try {
        console.log(`PWA: Attempting to register service worker at: ${swPath}`);
        registration = await navigator.serviceWorker.register(swPath);
        console.log('PWA: Service worker registered with scope:', registration.scope);
        break; // Exit loop on success
      } catch (error) {
        console.warn(`PWA: Failed to register service worker at ${swPath}:`, error);
        registrationError = error;
      }
    }
    
    if (!registration) {
      throw registrationError || new Error('Failed to register service worker at any path');
    }
    
    // Save the registration in the store for later access
    setServiceWorkerRegistration(registration);
    
    // Set up update monitoring
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      
      console.log('PWA: New service worker installing');
      
      newWorker.addEventListener('statechange', () => {
        // New service worker is installed and waiting
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('PWA: New service worker installed and waiting');
          usePWAStore.getState().setUpdateAvailable(true);
        }
      });
    });
    
    return registration;
  } catch (error) {
    console.error('PWA: Error initializing service worker:', error);
    return false;
  }
};

/**
 * Checks for service worker updates
 * @param registration The service worker registration
 */
export const checkForServiceWorkerUpdates = async (registration?: ServiceWorkerRegistration): Promise<boolean> => {
  // Use passed registration or get from store
  const reg = registration || usePWAStore.getState().serviceWorkerRegistration;
  if (!reg) return false;
  
  try {
    await reg.update();
    const hasUpdate = !!reg.waiting;
    usePWAStore.getState().setUpdateAvailable(hasUpdate);
    return hasUpdate;
  } catch (error) {
    console.error('PWA: Error checking for service worker updates:', error);
    return false;
  }
};

/**
 * Applies a pending service worker update
 * @param registration The service worker registration
 */
export const applyServiceWorkerUpdate = async (registration?: ServiceWorkerRegistration): Promise<boolean> => {
  // Use passed registration or get from store
  const reg = registration || usePWAStore.getState().serviceWorkerRegistration;
  if (!reg || !reg.waiting) {
    console.log('PWA: No waiting service worker to apply');
    return false;
  }
  
  // Send message to waiting service worker to activate
  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  usePWAStore.getState().setUpdateAvailable(false);
  return true;
};
