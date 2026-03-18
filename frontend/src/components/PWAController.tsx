import { useEffect } from "react";
import { registerServiceWorker } from "utils/pwa-register";
import { usePWAStore } from "utils/pwaStore";
import { toast } from "sonner";
import { isRecordingActive, onRecordingStopOnce } from "utils/recording/navigationGuards";
import { mode, Mode } from "app";

// Global declaration for the deferred prompt
declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

/**
 * Controller component for PWA functionality
 * Manages service worker registration and lifecycle
 */
export const PWAController = () => {
  const { setServiceWorkerRegistration, setUpdateAvailable, setDeferredPrompt } = usePWAStore();

  useEffect(() => {
    // Install a high-priority controllerchange guard BEFORE registering SW.
    // This ensures we can stopImmediatePropagation() and prevent any unguarded
    // listeners (like the one inside registerServiceWorker) from forcing reloads
    // during an active recording.
    let refreshing = false;
    const controllerChangeGuard = (e: Event) => {
      try {
        // Prevent subsequent listeners from running
        if (typeof (e as any).stopImmediatePropagation === 'function') {
          (e as any).stopImmediatePropagation();
        }
      } catch (err) {
        // No-op if stopping propagation fails
      }

      if (refreshing) return;

      // In development mode, don't auto-reload to prevent interruptions during testing
      if (mode === Mode.DEV) {
        console.log('PWA: Controller changed in development — skipping auto-reload');
        toast.info('Service worker updated (reload skipped in dev mode)');
        return;
      }

      if (isRecordingActive()) {
        console.log('PWA: Controller changed but recording is active — deferring reload');
        toast.info("Update ready; will apply after you stop recording.");
        onRecordingStopOnce(() => {
          console.log('PWA: Recording stopped — applying deferred reload');
          refreshing = true;
          window.location.reload();
        });
        return;
      }

      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker?.addEventListener("controllerchange", controllerChangeGuard);

    // Check if we already have a captured prompt from early initialization
    if (window.deferredPrompt) {
      console.log('PWA: Found existing deferred prompt, storing in app state');
      setDeferredPrompt(window.deferredPrompt);
    }

    // Store event handler references for proper cleanup
    const handlePWAInstallAvailable = (e: Event) => {
      console.log('PWA: Received pwaInstallAvailable event in controller');
      // Ensure the event detail is the correct type before setting
      if (e instanceof CustomEvent && e.detail) {
         // Check if detail has prompt method before setting
         if (typeof e.detail.prompt === 'function') {
            setDeferredPrompt(e.detail as any); // Cast needed due to custom event type
         } else {
            console.warn('PWA: pwaInstallAvailable event detail missing prompt method');
         }
      } else {
        console.warn('PWA: pwaInstallAvailable event received without valid detail');
      }
    };

    const handleAppInstalled = (e: Event) => {
      console.log('PWA: App was installed', e);
      toast.success("App installed successfully!");
      window.deferredPrompt = null;
    };

    // Register service worker when the app loads
    const initPWA = async () => {
      try {
        // Listen for custom event dispatched by global init script
        window.addEventListener('pwaInstallAvailable', handlePWAInstallAvailable);

        // Only register in production or specific environments where HTTPS is available
        if (window.isSecureContext || window.location.protocol === 'https:' || 
            window.location.hostname === 'localhost') {
          console.log('PWA: Registering service worker');
          const registration = await registerServiceWorker();
          
          // Store registration in global state
          if (registration && 'update' in registration) {
            setServiceWorkerRegistration(registration);
            console.log('PWA: Service worker registration successful', registration);
            
            // Store a timestamp in localStorage to avoid false update notifications
            const lastUpdateCheck = localStorage.getItem('pwa_last_update_check');
            const now = Date.now();
            
            // Only check for updates if we haven't checked in the last 12 hours
            if (!lastUpdateCheck || (now - parseInt(lastUpdateCheck)) > (12 * 60 * 60 * 1000)) {
              localStorage.setItem('pwa_last_update_check', now.toString());
              
              // Check if there's an update waiting
              if (registration.waiting) {
                setUpdateAvailable(true);
                toast.info("App update available", {
                  duration: 5000,
                  action: {
                    label: "Update",
                    onClick: () => {
                      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
                    }
                  }
                });
              }
            }
            
            // Listen for new updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Store the update timestamp to avoid duplicate notifications
                    const lastUpdateNotification = localStorage.getItem('pwa_last_update_notification');
                    const now = Date.now();
                    
                    // Only show notification if we haven't shown one in the last hour
                    if (!lastUpdateNotification || (now - parseInt(lastUpdateNotification)) > (60 * 60 * 1000)) {
                      localStorage.setItem('pwa_last_update_notification', now.toString());
                      
                      // New version is ready
                      setUpdateAvailable(true);
                      toast.info("App update ready", {
                        duration: 5000,
                        action: {
                          label: "Update",
                          onClick: () => {
                            newWorker.postMessage({ type: "SKIP_WAITING" });
                          }
                        }
                      });
                    }
                  }
                });
              }
            });
          }
        } else {
          console.warn("PWA: Not registering service worker in insecure context");
        }
      } catch (err) {
        console.error("PWA: Failed to initialize:", err);
        
        // Log diagnostic information
        console.error("PWA: Service worker error details:", {
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          pathname: window.location.pathname,
          serviceWorkerSupported: 'serviceWorker' in navigator,
          errorMessage: err instanceof Error ? err.message : String(err)
        });
      }
    };

    initPWA();

    // Track installed state
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup function
    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", controllerChangeGuard);
      // Clean up custom event listeners using the stored references
      window.removeEventListener('pwaInstallAvailable', handlePWAInstallAvailable); 
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setServiceWorkerRegistration, setUpdateAvailable, setDeferredPrompt]);

  // This is a controller component, it doesn't render anything
  return null;
};

export default PWAController;
