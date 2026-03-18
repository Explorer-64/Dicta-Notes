/**
 * Component: PWAOfflineIndicator
 * 
 * Description:
 * Displays a notification banner when the app is offline.
 * Provides information about offline capabilities.
 */

import { useEffect, useState } from "react";
import { usePWAStore } from "../utils/pwaStore";
import { useSessionsOfflineState } from "../utils/useSessionsOfflineState";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PWAOfflineIndicator() {
  const { isInstalled } = usePWAStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const { offlineSessionsCount } = useSessionsOfflineState();
  const navigate = useNavigate();

  // Track online/offline status with a slight delay to avoid flicker
  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);
    
    // Handlers for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Keep showing the indicator for a moment after reconnection
      setTimeout(() => setShowOfflineMessage(false), 2000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Navigate to sessions page
  const handleViewOfflineSessions = () => {
    navigate("/sessions");
  };

  // Only show when offline or just after coming back online
  if (!showOfflineMessage) return null;

  // Different message for recently reconnected vs still offline
  const isReconnected = isOnline && showOfflineMessage;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in fade-in slide-in-from-top duration-300">
      <Alert 
        variant={isReconnected ? "default" : "destructive"} 
        className="rounded-none border-t-0 border-x-0"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {isReconnected ? (
              <RotateCw className="h-4 w-4 text-green-500 animate-spin" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <AlertTitle>
              {isReconnected ? "Connection restored" : "You're offline"}
            </AlertTitle>
          </div>
          {isReconnected && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowOfflineMessage(false)}
              className="h-6 px-2"
            >
              Dismiss
            </Button>
          )}
        </div>
        <AlertDescription className="pt-1">
          {isReconnected ? (
            <>Your connection is back. Any pending changes will now sync.</>  
          ) : offlineSessionsCount > 0 ? (
            <div className="flex flex-col gap-2">
              <div>You can still access {offlineSessionsCount} previously viewed sessions.</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewOfflineSessions}
                className="self-start mt-1 bg-white/10 border-white/20 hover:bg-white/20"
              >
                View available sessions
              </Button>
            </div>
          ) : (
            <>Some features are unavailable until your connection is restored.</>  
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}