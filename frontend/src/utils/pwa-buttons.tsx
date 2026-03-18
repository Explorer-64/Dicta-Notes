import { Button } from "@/components/ui/button";
import { create } from "zustand";

interface PWAButtonsState {
  isHidden: boolean;
  hideButton: () => void;
  showButton: () => void;
}

/**
 * Store to manage visibility of PWA install buttons
 */
export const usePWAButtonsStore = create<PWAButtonsState>((set) => ({
  isHidden: false,
  hideButton: () => set({ isHidden: true }),
  showButton: () => set({ isHidden: false }),
}));

interface PWAInstallButtonProps {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  className?: string;
}

/**
 * PWA Install Button Component
 * 
 * A reusable button that handles PWA installation
 */
export function PWAInstallButton({ 
  variant = "default", 
  className = ""
}: PWAInstallButtonProps) {
  const installPWA = async () => {
    if (!window.deferredPrompt) {
      console.log('Installation prompt not available');
      return;
    }
    
    try {
      // Show the installation prompt
      await window.deferredPrompt.prompt();
      
      // Wait for the user's choice
      const choiceResult = await window.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the installation prompt');
      } else {
        console.log('User dismissed the installation prompt');
      }
      
      // Clear the prompt reference
      window.deferredPrompt = undefined;
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };
  
  return (
    <Button
      variant={variant}
      className={className}
      onClick={installPWA}
    >
      Install App
    </Button>
  );
}
