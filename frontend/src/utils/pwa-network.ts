import { create } from 'zustand';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: number | null;
  setOnline: (online: boolean) => void;
  resetWasOffline: () => void;
}

/**
 * Network status store for tracking online/offline state
 */
export const useNetworkStatus = create<NetworkStatus>((set) => ({
  isOnline: navigator.onLine,
  wasOffline: false,
  lastOnlineTime: navigator.onLine ? Date.now() : null,
  
  setOnline: (online: boolean) => set((state) => {
    // If we're going from offline to online, set wasOffline to true
    const wasOffline = !online ? false : !state.isOnline;
    
    return {
      isOnline: online,
      wasOffline: wasOffline || state.wasOffline,
      lastOnlineTime: online ? Date.now() : state.lastOnlineTime,
    };
  }),
  
  resetWasOffline: () => set({ wasOffline: false }),
}));

/**
 * Initializes network status listeners
 * Call this function in the app entry point
 */
export const initNetworkListeners = () => {
  const { setOnline } = useNetworkStatus.getState();
  
  // Set initial state
  setOnline(navigator.onLine);
  
  // Add event listeners
  window.addEventListener('online', () => {
    console.log('Network: Online');
    setOnline(true);
  });
  
  window.addEventListener('offline', () => {
    console.log('Network: Offline');
    setOnline(false);
  });
  
  return () => {
    // Remove event listeners
    window.removeEventListener('online', () => setOnline(true));
    window.removeEventListener('offline', () => setOnline(false));
  };
};
