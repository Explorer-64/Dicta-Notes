/**
 * Early PWA Initialization
 * 
 * This script runs early in the application lifecycle to capture
 * the beforeinstallprompt event which is crucial for PWA installation.
 * 
 * It must be imported in a component that loads early in the app lifecycle.
 */

// Global declaration to make TypeScript happy with our custom window properties
declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
    isAppInstalled?: boolean;
    installPromptTimeoutId?: number;
  }
}

// Define BeforeInstallPromptEvent interface for TypeScript
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Initialize global state
window.deferredPrompt = window.deferredPrompt || null;
window.isAppInstalled = window.isAppInstalled || false;

// Store the beforeinstallprompt event for later use
// This is crucial - the event only fires once when conditions are right for installation
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome from automatically showing the prompt
  e.preventDefault();
  
  // Store the event for later use
  window.deferredPrompt = e;
  
  console.log('PWA: beforeinstallprompt event captured globally');
  
  // Dispatch a custom event that components can listen for
  window.dispatchEvent(new CustomEvent('pwaInstallAvailable', { detail: e }));
  
  // Clear any existing timeout
  if (window.installPromptTimeoutId) {
    clearTimeout(window.installPromptTimeoutId);
  }
  
  // Set a timeout to clear the prompt after 5 minutes if not used
  // This prevents showing outdated installation prompts
  window.installPromptTimeoutId = window.setTimeout(() => {
    if (window.deferredPrompt) {
      console.log('PWA: Install prompt timed out after 5 minutes');
      window.deferredPrompt = null;
    }
  }, 5 * 60 * 1000);
});

// Track installation success
window.addEventListener('appinstalled', (e) => {
  console.log('PWA: App was installed globally', e);
  window.deferredPrompt = null;
  window.isAppInstalled = true;
  
  // Dispatch a custom event that components can listen for
  window.dispatchEvent(new CustomEvent('pwaInstalled'));
  
  // Clear any existing timeout
  if (window.installPromptTimeoutId) {
    clearTimeout(window.installPromptTimeoutId);
    window.installPromptTimeoutId = undefined;
  }
});

// Record if we're in standalone mode
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;

if (isStandalone) {
  console.log('PWA: Running in standalone mode');
  window.isAppInstalled = true;
}

// Check for a saved install prompt (handled by service worker)
const checkServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('PWA: Service worker is ready:', registration.scope);
    } catch (error) {
      console.error('PWA: Service worker not ready:', error);
    }
  }
};

// Execute the service worker check
checkServiceWorker();

console.log('PWA: Early initialization loaded');

// Export initialization status for debugging
export const PWA_INIT_STATUS = {
  isStandalone,
  hasServiceWorker: 'serviceWorker' in navigator,
  isSecureContext: window.isSecureContext,
};
