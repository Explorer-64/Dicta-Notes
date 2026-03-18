/**
 * PWA Initialization
 * 
 * This utility initializes PWA functionality as early as possible in the application lifecycle.
 * It captures the beforeinstallprompt event which is crucial for PWA installation.
 */

// Global declaration to make TypeScript happy with our custom window property
declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

/**
 * Initialize PWA event listeners
 * This should be called as early as possible in the application lifecycle
 */
export function initializePWA() {
  console.log('PWA: Early initialization running');
  
  // Store the beforeinstallprompt event for later use
  // This is crucial - the event only fires once when conditions are right for installation
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the browser from showing its default UI
    e.preventDefault();
    
    // Store the event for later use
    window.deferredPrompt = e;
    
    console.log('PWA: beforeinstallprompt event captured at document level');
  });
  
  // Track installation success
  window.addEventListener('appinstalled', (e) => {
    console.log('PWA: App was installed', e);
    window.deferredPrompt = null;
  });
  
  // Also capture standalone mode or iOS homescreen
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
  
  if (isStandalone) {
    console.log('PWA: Running in standalone mode');
  }
}

// Auto-initialize
initializePWA();
