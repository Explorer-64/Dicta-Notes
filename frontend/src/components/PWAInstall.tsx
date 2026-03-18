 /**
 * Component: PWAInstall
 * 
 * Description:
 * Manages the Progressive Web App (PWA) installation process and provides
 * an install button when the app is installable.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Settings, RefreshCw, X } from "lucide-react";
import { usePWAStore } from "../utils/pwaStore";
import { isPWAInstallable, isPWASupported } from "../utils/pwa-manifest";
import { toast } from "sonner";
import { mode, Mode } from "app";
import { useNavigate } from "react-router-dom";
import { ModuleInstallDialog } from "./ModuleInstallDialog";
import { PWAAndroidInstallGuide } from "./PWAAndroidInstallGuide";
import { useModuleRegistryStore } from "../utils/moduleRegistry";
import { useModuleCheck } from "../utils/moduleCheck";
import { useFCM } from "../utils/fcm";
import { clearPWAInstallationState, refreshInstallState } from "../utils/pwa-reinstall";
import { isAndroidDevice, isIOSDevice, isChromeDevice, getDeviceInfo, isPixelDevice, isPixel7A } from "../utils/deviceDetection";

// Navigation constants
const ROUTE_MODULE_SETTINGS = "/settings";
const SESSION_STORAGE_PWA_DISMISSED = "pwa_install_dismissed";

// Safely extract from functions to avoid errors
function isDevelopment() {
  return mode === Mode.DEV;
}

export function PWAInstall() {
  // Basic state and navigation hooks - NEVER CONDITIONAL
  const navigate = useNavigate();
  const [isInstallable, setIsInstallable] = useState(true); // Force to true for testing
  const [showSettings, setShowSettings] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [dismissedForSession, setDismissedForSession] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_PWA_DISMISSED) === "true";
    } catch {
      return false;
    }
  });
  
  // Try/catch wrapped store access - NEVER ACCESS PROPERTIES DIRECTLY IN RENDER
  const pwStore = usePWAStore();
  const moduleStore = useModuleRegistryStore();
  const moduleCheck = useModuleCheck();
  const fcm = useFCM();
  
  // Single effect for initialization and cleanup
  useEffect(() => {
    let isMounted = true;
    console.log('PWA Install component mounted');
    
    // Log environment
    try {
      console.log('PWA: Environment details', {
        mode: mode,
        isDev: isDevelopment(),
        userAgent: navigator.userAgent,
        standalone: (window.navigator as any).standalone,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
      });
    } catch (e) {
      console.warn('Error logging environment:', e);
    }
    
    // Check installable state safely
    const checkInstallable = () => {
      if (!isMounted) return;
      
      try {
        const isCurrentlyInstallable = isPWAInstallable();
        const isSupported = isPWASupported();
        const hasPrompt = !!pwStore.deferredPrompt;
        
        console.log('PWA: Checking installable state', {
          isCurrentlyInstallable,
          isSupported,
          hasPrompt,
          isDev: isDevelopment()
        });
        
        // Force show in development, otherwise use actual state
        const shouldShow = isDevelopment() || (isCurrentlyInstallable && isSupported);
        setIsInstallable(shouldShow);
      } catch (e) {
        console.warn('Error checking installable state:', e);
        // Fallback to true for development
        setIsInstallable(isDevelopment());
      }
    };
    
    // Initial check
    checkInstallable();
    
    // Add event listener for pwa state refresh
    const handlePWAStateRefresh = () => {
      console.log('PWA: State refresh event received');
      checkInstallable();
    };
    
    // Add event listeners (visibility/focus for re-checking installable status)
    try {
      document.addEventListener('visibilitychange', checkInstallable);
      window.addEventListener('focus', checkInstallable);
      window.addEventListener('pwaStateRefresh', handlePWAStateRefresh);
    } catch (e) {
      console.warn('Error adding event listeners:', e);
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
      try {
        document.removeEventListener('visibilitychange', checkInstallable);
        window.removeEventListener('focus', checkInstallable);
        window.removeEventListener('pwaStateRefresh', handlePWAStateRefresh);
      } catch (e) {
        console.warn('Error removing event listeners:', e);
      }
    };
  }, []);
  
  // Safely wrapped event handlers
  const handleInstallClick = () => {
    try {
      pwStore.syncWithModuleRegistry();
      
      // Check if we have an installation prompt
      const hasInstallPrompt = !!pwStore.deferredPrompt;
      const deviceInfo = getDeviceInfo();
      
      if (hasInstallPrompt) {
        // We have a prompt, show the dialog for one-click install
        console.log('PWA: Found installation prompt, showing install dialog');
        setShowModuleDialog(true);
        return;
      }
      
      // No prompt available - specific guidance based on device
      if (deviceInfo.isAndroid) {
        // For Android devices (including Pixel), optimize the install process
        console.log('PWA: Android device detected, optimizing install experience');
        
        // Special handling for Pixel 7A - one-click install experience
        if (deviceInfo.isPixel || deviceInfo.isPixel7A) {
          console.log('PWA: Pixel device detected, showing visual installation guide');
          // Show custom Android installation guide dialog
          setShowAndroidGuide(true);
          return;
        } else {
          // Force refresh the service worker to ensure it's up to date
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
              for (const registration of registrations) {
                registration.update();
              }
            }).catch(e => console.warn('Error updating service worker:', e));
          }
          
          // Simple instructions for other Android devices
          toast.info('Tap the Chrome menu (⋮) and select "Install app"', {
            duration: 4000,
            position: 'bottom-center'
          });
        }
      } else if (deviceInfo.isIOS) {
        // iOS devices need to use Add to Home Screen
        toast.info('Tap the share icon and select "Add to Home Screen"', {
          duration: 4000,
          position: 'bottom-center'
        });
      } else {
        // Desktop browsers
        if (deviceInfo.isChrome) {
          toast.info('Click the install icon in your browser address bar', {
            duration: 4000,
            position: 'bottom-center'
          });
        } else if (navigator.userAgent.includes('Firefox')) {
          toast.info('Click the menu button and select "Install"', {
            duration: 4000,
            position: 'bottom-center'
          });
        } else {
          toast.info('Installation may not be supported in this browser', {
            duration: 4000,
            position: 'bottom-center'
          });
        }
      }
    } catch (e) {
      console.error('Error preparing installation:', e);
      toast.error('Could not prepare installation');
    }
  };
  
  const handleConfirmInstall = async () => {
    try {
      const deferredPrompt = pwStore.deferredPrompt;
      
      // No prompt available - should never happen as the button should be hidden
      if (!deferredPrompt) {
        const deviceInfo = getDeviceInfo();
        
        toast.info('Installation not available in this browser', {
          description: 'Please try using Chrome on Android or Safari on iOS',
          duration: 4000
        });
        setShowModuleDialog(false);
        return;
      }
      
      // Show installing toast
      toast.loading('Installing app...', { id: 'pwa-install', duration: 3000 });
      
      // Prompt user with native browser install dialog
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        // Clear the prompt from the store
        pwStore.setDeferredPrompt(null);
        toast.success('Installation successful!', { id: 'pwa-install', duration: 3000 });
        
        // Notify service worker about the modules being installed
        try {
          const { notifyModulesPWAInstalled } = await import('../utils/service-worker');
          notifyModulesPWAInstalled(['core', 'persistence']); // Core modules by default
          
          // Store module info for persistence
          localStorage.setItem('pwa_installed_modules', JSON.stringify(['core', 'persistence']));
          localStorage.setItem('pwa_installed', 'true');
          
          // Request notifications permission after a delay
          if (!fcm.notificationsEnabled) {
            setTimeout(() => {
              fcm.requestPermission().catch(e => {
                console.warn('Error requesting notification permission:', e);
              });
            }, 3000);
          }
        } catch (e) {
          console.warn('Error in post-install operations:', e);
        }
      } else {
        toast.info('Installation cancelled', { id: 'pwa-install' });
      }
      
      setShowModuleDialog(false);
    } catch (e) {
      console.error('Error installing PWA:', e);
      toast.error('Installation failed', { id: 'pwa-install' });
      setShowModuleDialog(false);
    }
  };
  
  // Handle Reset Installation State
  const handleResetInstallState = async () => {
    try {
      setIsResetting(true);
      toast.info('Resetting installation state...', {
        duration: 2000
      });
      
      await clearPWAInstallationState();
      
      // Force refresh PWA state
      pwStore.setDeferredPrompt(null);
      refreshInstallState();
      
      toast.success('Installation state reset', {
        description: 'You should now be able to reinstall the app',
        duration: 4000
      });
    } catch (e) {
      console.error('Error resetting PWA state:', e);
      toast.error('Failed to reset installation state');
    } finally {
      setIsResetting(false);
    }
  };
  
  const handleOpenSettings = () => {
    navigate(ROUTE_MODULE_SETTINGS);
    setShowSettings(false);
  };
  
  const handleDismissForSession = () => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_PWA_DISMISSED, "true");
      setDismissedForSession(true);
    } catch {
      setDismissedForSession(true);
    }
  };

  // Determine if we should show the component
  // The component should only render if it's determined to be installable
  // (which already checks if it's NOT in standalone mode)
  if (!isInstallable) {
    console.log('PWAInstall: Not rendering install button (isInstallable=false)');
    return null;
  }
  if (dismissedForSession) {
    return null;
  }
  console.log('PWAInstall: Rendering install button (isInstallable=true)');
  
  // Force show in development for testing
  if (isDevelopment()) {
    console.log('PWA: Development mode, showing install button regardless of installability');
  }
  
  // Get module count - safely
  let enabledModuleCount = 0;
  try {
    const modules = moduleStore.modules || {};
    enabledModuleCount = Object.keys(modules)
      .filter(id => moduleCheck.isModuleEnabled(id))
      .length;
  } catch (e) {
    console.warn('Error counting enabled modules:', e);
  }
  
  // Render our UI
  return (
    <>
      <ModuleInstallDialog 
        open={showModuleDialog} 
        onOpenChange={setShowModuleDialog} 
        onConfirm={handleConfirmInstall} 
      />
      
      <PWAAndroidInstallGuide
        open={showAndroidGuide}
        onOpenChange={setShowAndroidGuide}
      />
      
      <div className="fixed bottom-4 right-4 z-40 flex flex-col space-y-2">
        {showSettings && (
          <Button
            onClick={handleOpenSettings}
            variant="secondary"
            size="sm"
            className="shadow-lg"
          >
            <Settings className="h-4 w-4 mr-2" />
            Module Settings
          </Button>
        )}
        <div className="flex items-center gap-1">
          <Button
            onClick={handleInstallClick}
            onMouseEnter={() => setShowSettings(true)}
            onMouseLeave={() => setShowSettings(false)}
            variant="default"
            size="sm"
            className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white font-medium animate-pulse-slow relative overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shine"></span>
            <Download className="h-4 w-4 mr-2" />
            Install App {enabledModuleCount > 0 && `(${enabledModuleCount} modules)`}
          </Button>
          <Button
            onClick={handleDismissForSession}
            variant="secondary"
            size="icon"
            className="h-8 w-8 shrink-0 shadow-lg rounded-full"
            title="Hide for this session"
            aria-label="Hide install button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}