import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
// import { isPWAInstallable } from '@/utils/pwa-register'; // No longer directly used here
import { usePWAStore } from '@/utils/pwaStore';
import { Download } from 'lucide-react';
// import { toast } from 'sonner'; // Toasts for install success/dismissal are moved
import { useNavigate } from "react-router-dom";

// Define the BeforeInstallPromptEvent interface inline to avoid import issues
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend Window interface to include our properties
declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}

export function PWAInstallButton() {
  const navigate = useNavigate();
  const {
    deferredPrompt, // Still used by useEffect to determine if a prompt is available
    setDeferredPrompt, // Used to store the prompt event
    isInstalled,       // Used to determine if button should be shown
    setIsInstalled,    // Used by event handlers
    // installApp // No longer called directly from this component
  } = usePWAStore();

  // Local state primarily to reflect PWA store's installability and control button visibility
  const [isInstallable, setIsInstallable] = useState(usePWAStore.getState().isInstallable); // Initialize from store
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const checkIfAlreadyInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone === true;
      const isPWADisplayMode = window.matchMedia('(display-mode: fullscreen)').matches ||
                               window.matchMedia('(display-mode: minimal-ui)').matches;
      const hasInstalledFlag = localStorage.getItem('pwa-installed') === 'true';

      if (isStandalone || isPWADisplayMode || hasInstalledFlag) {
        console.log('PWA: App appears to be already installed (PWAInstallButton effect)');
        if (!isInstalled) setIsInstalled(true); // Ensure store reflects this
        setShowButton(false);
        localStorage.setItem('pwa-installed', 'true');
        return true;
      }
      return false;
    };

    if (checkIfAlreadyInstalled()) {
      return; // Stop if already installed
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired (PWAInstallButton listener)');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.deferredPrompt = promptEvent; // Keep global reference
      setDeferredPrompt(promptEvent);    // Update store
      setIsInstallable(true);            // Update local & store state (via setDeferredPrompt potentially)
      setShowButton(true);               // Show button now
      console.log('PWA Install Button - captured prompt:', { hasPrompt: typeof promptEvent.prompt === 'function' });
    };

    const handleAppInstalled = () => {
      console.log('PWA: App was installed (appinstalled event in PWAInstallButton)');
      setDeferredPrompt(null);
      window.deferredPrompt = undefined; // Clear global prompt
      setIsInstallable(false);
      setShowButton(false);
      setIsInstalled(true); // This will also update the store via the hook
      localStorage.setItem('pwa-installed', 'true');
    };

    // Determine initial button visibility logic
    const storeState = usePWAStore.getState();
    const canShowButtonLogic = !storeState.isInstalled && 
                               (storeState.isInstallable || !!storeState.deferredPrompt || !!window.deferredPrompt);
    
    setShowButton(canShowButtonLogic);

    if (canShowButtonLogic) {
      // Sync local isInstallable if store indicates installable
      if (storeState.isInstallable && !isInstallable) {
        setIsInstallable(true);
      }
      // Sync store's deferredPrompt if global one exists and store is out of sync
      if (window.deferredPrompt && !storeState.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    }
    
    console.log('PWA: PWAInstallButton useEffect initial state check:', {
      canShowButtonLogic,
      isInstalledStore: storeState.isInstalled,
      isInstallableStore: storeState.isInstallable,
      isInstallableLocal: isInstallable, // Current local state
      hasWindowPrompt: !!window.deferredPrompt,
      hasStorePrompt: !!storeState.deferredPrompt,
    });

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', checkIfAlreadyInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', checkIfAlreadyInstalled);
    };
  // Rerun if store's isInstalled or deferredPrompt changes, or local isInstallable state.
  // isInstalled from usePWAStore is reactive, so changes will trigger re-renders.
  // deferredPrompt from usePWAStore is also reactive.
  // The local isInstallable state is added as a dependency.
  }, [isInstalled, deferredPrompt, setDeferredPrompt, setIsInstalled, isInstallable]);


  const handleInstallClick = () => {
    console.log('PWA: PWAInstallButton clicked, navigating to /install-options');
    navigate("/install-options");
  };

  if (!showButton) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50 shadow-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      variant="default"
      size="sm"
      title="Install Dicta-Notes app on your device"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
}
