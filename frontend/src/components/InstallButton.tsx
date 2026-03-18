import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWAStore } from '../utils/pwaStore';

interface InstallButtonProps {
  className?: string;
}

/**
 * A button that allows users to install the PWA on their device
 */
export const InstallButton = ({ className }: InstallButtonProps) => {
  const { isInstallable, isInstalled, deferredPrompt, installApp, syncWithModuleRegistry } = usePWAStore();
  const [showingPrompt, setShowingPrompt] = useState(false);
  const [moduleCount, setModuleCount] = useState(0);
  
  // Count available modules
  useEffect(() => {
    const countModules = async () => {
      try {
        // Force sync modules first
        syncWithModuleRegistry();
        
        // Dynamically import to avoid circular dependencies
        const { useModuleRegistryStore } = await import('../utils/moduleRegistry');
        const registry = useModuleRegistryStore.getState();
        const modules = registry.modules;
        const availableModules = Object.values(modules).filter(m => m.enabled).length;
        setModuleCount(availableModules);
      } catch (error) {
        console.error('Error counting modules:', error);
        setModuleCount(1); // Fallback to at least 1 module
      }
    };
    
    countModules();
  }, []);
  
  // Check if app is already installed - run this check more frequently
  useEffect(() => {
    const checkInstallState = () => {
      // Multiple detection methods for better cross-platform compatibility
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   window.matchMedia('(display-mode: fullscreen)').matches || 
                   window.matchMedia('(display-mode: minimal-ui)').matches;
      
      if (isStandalone || isPWA) {
        console.log('PWA: Detected app is running in standalone/PWA mode');
        usePWAStore.getState().setIsInstalled(true);
      }
    };
    
    // Check immediately and on visibility changes
    checkInstallState();
    
    // Also check when app comes back to foreground (important for mobile)
    document.addEventListener('visibilitychange', checkInstallState);
    window.addEventListener('focus', checkInstallState);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', checkInstallState);
      window.removeEventListener('focus', checkInstallState);
    };
  }, []);

  // If not installable or already installed, don't show button
  if (!isInstallable || isInstalled) return null;
  
  const handleInstall = async () => {
    if (showingPrompt) return;
    
    setShowingPrompt(true);
    try {
      // Check for iOS devices and provide specialized instructions
      const isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent);
      if (isIOS) {
        console.log('PWA: iOS device detected, showing manual installation instructions');
        // Import dynamically to avoid circular dependencies
        const { toast } = await import('sonner');
        toast.info('To install on iOS, tap the share button and select "Add to Home Screen"', {
          duration: 5000,
          position: 'bottom-center'
        });
        return;
      }
      
      // Force module sync before installation
      await syncWithModuleRegistry();
      
      // For Android Chrome, use streamlined installation
      const userAgent = navigator.userAgent.toLowerCase();
      const isAndroid = /android/.test(userAgent);
      const isChrome = userAgent.indexOf('chrome') > -1 && userAgent.indexOf('firefox') === -1;
      
      if (isAndroid && isChrome && deferredPrompt) {
        console.log('PWA: Android Chrome detected, using direct installation');
        try {
          // This triggers a direct installation flow without additional prompts
          await deferredPrompt.prompt();
          const choiceResult = await deferredPrompt.userChoice;
          
          if (choiceResult.outcome === 'accepted') {
            console.log('PWA: Installation accepted');
            usePWAStore.getState().setIsInstalled(true);
          }
        } catch (error) {
          console.error('PWA: Error during installation:', error);
        }
        return;
      }
      
      // Default flow for desktop browsers
      await installApp();
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setShowingPrompt(false);
    }
  };

  return (
    <Button 
      onClick={handleInstall} 
      className={className || "flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 transition-all"}
      variant="outline"
      size="sm"
      disabled={showingPrompt || !deferredPrompt}
    >
      <Download className="mr-2 h-4 w-4" />
      Install App ({moduleCount} modules)
    </Button>
  );
};
