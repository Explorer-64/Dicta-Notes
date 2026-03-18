import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

/**
 * PWA Installation Preview Page
 * 
 * This page provides a preview of the app as a PWA with installation instructions.
 * It's shown when the user is directed from the PWA install prompt.
 */
const PWAInstallPreviewPage = () => {
  const navigate = useNavigate();
  const [isInstallable, setIsInstallable] = useState(false);
  
  // Check if the app is installable
  useEffect(() => {
    // Simple check - more robust checking is done in PWAInstall component
    const checkInstallable = () => {
      if (window.deferredPrompt) {
        setIsInstallable(true);
      } else {
        // Check if running in standalone mode (already installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true;
          
        setIsInstallable(!isStandalone);
      }
    };
    
    checkInstallable();
    
    // Listen for installation events
    const handleInstallAvailable = () => setIsInstallable(true);
    const handleInstalled = () => setIsInstallable(false);
    
    window.addEventListener('pwaInstallAvailable', handleInstallAvailable);
    window.addEventListener('pwaInstalled', handleInstalled);
    
    return () => {
      window.removeEventListener('pwaInstallAvailable', handleInstallAvailable);
      window.removeEventListener('pwaInstalled', handleInstalled);
    };
  }, []);
  
  // Trigger installation
  const handleInstall = async () => {
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
      setIsInstallable(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Dicta-Notes as a Desktop App</CardTitle>
          <CardDescription className="text-blue-50">
            Install Dicta-Notes to your device for an enhanced experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Why install Dicta-Notes as an app?</h3>
              <ScrollArea className="h-[200px] mt-3 p-4 rounded-md border">
                <ul className="space-y-2 list-disc pl-5">
                  <li>Faster access - open Dicta-Notes directly from your desktop or home screen</li>
                  <li>Improved performance with offline capabilities</li>
                  <li>Quick access to your meeting transcripts even without internet</li>
                  <li>More screen space without browser controls</li>
                  <li>Seamless audio recording with better system integration</li>
                  <li>Notifications for important updates (when enabled)</li>
                  <li>Integration with your device's file system</li>
                </ul>
              </ScrollArea>
            </div>
            
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
              <h3 className="text-lg font-medium mb-2">Installation Status</h3>
              {isInstallable ? (
                <p>Your browser supports installing Dicta-Notes as an app. Click the button below to install.</p>
              ) : (
                <p>You've already installed Dicta-Notes or your browser doesn't support PWA installation.</p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-end bg-slate-50 rounded-b-lg p-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Return to App
          </Button>
          
          {isInstallable && (
            <Button 
              onClick={handleInstall}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
            >
              Install Dicta-Notes
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PWAInstallPreviewPage;
