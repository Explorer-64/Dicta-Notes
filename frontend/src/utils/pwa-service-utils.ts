/**
 * PWA Service Worker Utils
 * 
 * This file contains utilities for managing the service worker
 * from the client side.
 */

import { usePWAStore } from './pwaStore';

// This file is kept for potential future use, but core registration logic
// is now handled by utils/pwa-register.ts to avoid duplication.

// Example import if needed:
// import { applyUpdate, unregisterServiceWorkers } from './pwa-service-utils';

/**
 * Applies the service worker update
 */
export const applyUpdate = async (): Promise<boolean> => {
  const reg = usePWAStore.getState().serviceWorkerRegistration;
  
  if (!reg || !reg.waiting) {
    console.warn('PWA: No service worker update to apply');
    return false;
  }
  
  try {
    // Send message to the waiting service worker to activate
    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Wait for the page to reload
    await new Promise<void>((resolve) => {
      // Listen for the controlling service worker to change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('PWA: Service worker controller changed');
        resolve();
      });
    });
    
    return true;
  } catch (error) {
    console.error('PWA: Failed to apply update:', error);
    return false;
  }
};

/**
 * Unregisters all service workers
 */
export const unregisterServiceWorkers = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('PWA: Unregistered service worker:', registration.scope);
    }
    
    return true;
  } catch (error) {
    console.error('PWA: Failed to unregister service workers:', error);
    return false;
  }
};
