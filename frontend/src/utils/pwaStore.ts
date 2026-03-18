/**
 * PWA Store
 * 
 * State management for Progressive Web App functionality, including:
 * - Installation state
 * - Installation prompt
 * - PWA status
 * - Service worker registration
 * - Update management
 */

import { create } from 'zustand';

// Global declaration for the deferred prompt
declare global {
  interface Window {
    deferredPrompt?: any;
    pwaInstallInProgress?: boolean;
  }
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

interface PWAState {
  // Whether the app is installed as a PWA
  isInstalled: boolean;
  setIsInstalled: (value: boolean) => void;
  
  // Whether the app can be installed (install prompt available)
  isInstallable: boolean;
  setIsInstallable: (value: boolean) => void;
  
  // The deferred install prompt event
  deferredPrompt: BeforeInstallPromptEvent | null;
  setDeferredPrompt: (value: BeforeInstallPromptEvent | null) => void;
  
  // Service worker registration
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
  setServiceWorkerRegistration: (reg: ServiceWorkerRegistration | null) => void;
  
  // Update available status
  updateAvailable: boolean;
  setUpdateAvailable: (value: boolean) => void;
  
  // Module installation options
  installOptions: Array<{
    moduleId: string;
    name: string;
    description?: string;
    required: boolean;
    selected: boolean;
  }>;
  syncWithModuleRegistry: () => void;
  toggleModuleInstallOption: (moduleId: string) => void;
  
  // Methods
  checkForUpdates: () => Promise<boolean>;
  applyUpdate: () => Promise<void>;
  installApp: () => Promise<boolean>;
}

export const usePWAStore = create<PWAState>((set, get) => ({
  isInstalled: false,
  setIsInstalled: (value) => set({ isInstalled: value }),
  
  isInstallable: true, // Default to true in development for easier debugging
  setIsInstallable: (value) => {
    console.log('PWA: Setting isInstallable to', value);
    set({ isInstallable: value });
  },
  
  deferredPrompt: null,
  setDeferredPrompt: (value) => {
    // Always sync with global prompt
    if (value) {
      window.deferredPrompt = value;
    }
    set({ deferredPrompt: value });
  },
  
  serviceWorkerRegistration: null,
  setServiceWorkerRegistration: (reg) => set({ serviceWorkerRegistration: reg }),
  
  updateAvailable: false,
  setUpdateAvailable: (value) => set({ updateAvailable: value }),
  
  // Module installation options
  installOptions: [],
  
  syncWithModuleRegistry: () => {
    try {
      // Dynamically import to avoid circular dependencies
      import('./moduleRegistry').then(({ useModuleRegistryStore }) => {
        const moduleRegistry = useModuleRegistryStore.getState();
        const modules = moduleRegistry.modules;
        
        // Convert to install options format
        const options = Object.values(modules).map(module => ({
          moduleId: module.id,
          name: module.name,
          description: module.description,
          required: module.required || false,
          selected: module.required || module.enabled,
        }));
        
        set({ installOptions: options });
      }).catch(err => {
        console.error('PWA: Error syncing with module registry:', err);
        set({ installOptions: [] });
      });
    } catch (error) {
      console.error('PWA: Error syncing with module registry:', error);
      set({ installOptions: [] });
    }
  },
  
  toggleModuleInstallOption: (moduleId) => {
    set(state => {
      const options = [...state.installOptions];
      const index = options.findIndex(o => o.moduleId === moduleId);
      
      if (index >= 0 && !options[index].required) {
        options[index] = {
          ...options[index],
          selected: !options[index].selected
        };
      }
      
      return { installOptions: options };
    });
  },
  
  // Install the app using available prompt
  installApp: async () => {
    console.log('PWA: installApp method called');
    
    // Signal installation in progress to service worker
    window.pwaInstallInProgress = true;
    
    try {
      // Check if already installed
      if (get().isInstalled) {
        console.log('PWA: App is already installed');
        return true;
      }
      
      // Detect browser environment
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isFirefox = userAgent.indexOf('firefox') > -1;
      const isChrome = userAgent.indexOf('chrome') > -1 && !isFirefox; // Chrome but not Firefox
      const isSafari = /safari/.test(userAgent) && !isChrome;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      console.log('PWA: Browser detection:', { isIOS, isFirefox, isChrome, isSafari, isMobile });
      
      // iOS requires manual installation through Safari's "Add to Home Screen"
      if (isIOS) {
        console.log('PWA: iOS detected, cannot trigger installation programmatically');
        // Show toast with instructions instead
        try {
          const { toast } = await import('sonner');
          toast.info('To install, tap the share icon and select "Add to Home Screen"', {
            duration: 5000
          });
        } catch (e) {
          console.error('PWA: Could not show toast:', e);
        }
        return false;
      }
      
      // For Chrome on Android, use the most reliable method
      if (isChrome && isMobile && window.deferredPrompt) {
        console.log('PWA: Chrome on Android detected, using direct installation');
        try {
          await window.deferredPrompt.prompt();
          const choiceResult = await window.deferredPrompt.userChoice;
          
          // Clear the prompt
          window.deferredPrompt = null;
          get().setDeferredPrompt(null);
          
          if (choiceResult.outcome === 'accepted') {
            console.log('PWA: Installation accepted on Chrome mobile');
            get().setIsInstalled(true);
            return true;
          }
          return false;
        } catch (error) {
          console.error('PWA: Error during Chrome mobile installation:', error);
          // Continue with other methods
        }
      }
      
      // Firefox has its own implementation, slightly different from Chrome
      if (isFirefox && window.deferredPrompt) {
        console.log('PWA: Firefox detected, using Firefox-specific approach');
        try {
          // Firefox may handle the prompt differently
          await window.deferredPrompt.prompt();
          const choiceResult = await window.deferredPrompt.userChoice;
          window.deferredPrompt = null;
          get().setDeferredPrompt(null);
          
          return choiceResult.outcome === 'accepted';
        } catch (error) {
          console.error('PWA: Error during Firefox installation:', error);
          // Continue with other methods
        }
      }
    
    // Try all possible installation prompts
    const methods = [
      // 1. Use global prompt first
      async () => {
        if (!window.deferredPrompt || typeof window.deferredPrompt.prompt !== 'function') {
          return false;
        }
        
        try {
          console.log('PWA: Trying window.deferredPrompt');
          // Detach prompt event from network operations
          await Promise.resolve().then(() => window.deferredPrompt.prompt());
          const { outcome } = await window.deferredPrompt.userChoice;
          
          // Clear global prompt
          window.deferredPrompt = null;
          
          return outcome === 'accepted';
        } catch (error) {
          console.error('PWA: Error with global prompt:', error);
          return false;
        }
      },
      
      // 1.5. If Chrome, try to show the installation banner manually via special manifest access
      async () => {
        // Check if Chrome or Chromium-based browser
        const isChrome = /Chrome|Chromium/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent);
        if (!isChrome) return false;
        
        try {
          console.log('PWA: Trying Chrome-specific installation method');
          
          // Manually trigger installation
          const manifestElement = document.querySelector('link[rel="manifest"]');
          if (!manifestElement) return false;
          
          // Force a manifest reload in case it was cached
          const manifestUrl = manifestElement.getAttribute('href');
          if (!manifestUrl) return false;
          
          // Try to get a fresh manifest to trigger installation banner
          const response = await fetch(manifestUrl, { cache: 'reload' });
          if (!response.ok) return false;
          
          // Wait a bit and check if app got installed
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                   (window.navigator as any).standalone === true;
          return isInStandaloneMode;
        } catch (error) {
          console.error('PWA: Error with Chrome-specific method:', error);
          return false;
        }
      },
      
      
      // 2. Then try store prompt if different
      async () => {
        const storePrompt = get().deferredPrompt;
        if (!storePrompt || typeof storePrompt.prompt !== 'function' || storePrompt === window.deferredPrompt) {
          return false;
        }
        
        try {
          console.log('PWA: Trying store.deferredPrompt');
          await Promise.resolve().then(() => storePrompt.prompt());
          const { outcome } = await storePrompt.userChoice;
          return outcome === 'accepted';
        } catch (error) {
          console.error('PWA: Error with store prompt:', error);
          return false;
        }
      },
      
      // 3. Try standalone mode detection (iOS PWA installed but no event)
      async () => {
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                 (window.navigator as any).standalone === true;
        
        if (isInStandaloneMode) {
          console.log('PWA: Already in standalone mode');
          return true;
        }
        
        return false;
      }
    ];
    
    // Try each method in sequence
    for (const method of methods) {
      try {
        const success = await method();
        if (success) {
          // Update state for successful installation
          set({ 
            isInstalled: true, 
            isInstallable: false,
            deferredPrompt: null 
          });
          console.log('PWA: Installation succeeded');
          return true;
        }
      } catch (error) {
        console.error('PWA: Installation method failed:', error);
        // Continue to next method
      }
    }
    
    } catch (error) {
      console.error('PWA: All installation methods failed:', error);
      return false;
    } finally {
      // Reset installation flag
      window.pwaInstallInProgress = false;
    }
  },
  
  checkForUpdates: async () => {
    const { serviceWorkerRegistration } = get();
    if (!serviceWorkerRegistration) return false;
    
    try {
      await serviceWorkerRegistration.update();
      const hasUpdate = !!serviceWorkerRegistration.waiting;
      set({ updateAvailable: hasUpdate });
      return hasUpdate;
    } catch (error) {
      console.error('PWA: Error checking for updates:', error);
      return false;
    }
  },
  
  applyUpdate: async () => {
    const { serviceWorkerRegistration } = get();
    if (!serviceWorkerRegistration || !serviceWorkerRegistration.waiting) return;
    
    // Send message to waiting service worker to skip waiting and become active
    serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  },
}));
