/**
 * PWA Store Implementation - zustand
 * 
 * This file contains the PWA store for managing PWA state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionsOfflineState {
  offlineSessionsCount: number;
  pendingSyncIds: string[];
  addPendingSync: (sessionId: string) => void;
  removePendingSync: (sessionId: string) => void;
  resetPendingSyncs: () => void;
  getOfflineSessionsCount: () => number;
}

/**
 * Store for tracking offline sessions that need to be synchronized
 */
export const useSessionsOfflineState = create<SessionsOfflineState>(
  persist(
    (set, get) => ({
      offlineSessionsCount: 0,
      pendingSyncIds: [],
      
      addPendingSync: (sessionId: string) => {
        set((state) => {
          // Only add if not already present
          if (!state.pendingSyncIds.includes(sessionId)) {
            return {
              pendingSyncIds: [...state.pendingSyncIds, sessionId],
              offlineSessionsCount: state.pendingSyncIds.length + 1
            };
          }
          return state;
        });
      },
      
      removePendingSync: (sessionId: string) => {
        set((state) => {
          const newPendingSyncIds = state.pendingSyncIds.filter(id => id !== sessionId);
          return {
            pendingSyncIds: newPendingSyncIds,
            offlineSessionsCount: newPendingSyncIds.length
          };
        });
      },
      
      resetPendingSyncs: () => {
        set({ pendingSyncIds: [], offlineSessionsCount: 0 });
      },
      
      getOfflineSessionsCount: () => {
        return get().pendingSyncIds.length;
      }
    }),
    {
      name: 'dicta-notes-offline-sessions',
      partialize: (state) => ({ 
        pendingSyncIds: state.pendingSyncIds 
      }),
    }
  )
);

/**
 * Execute background sync for offline sessions
 */
export const triggerBackgroundSync = async () => {
  // Check if we have the necessary APIs
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('Background sync not supported');
    return false;
  }
  
  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Request background sync
    await registration.sync.register('sync-sessions');
    console.log('Background sync registered');
    return true;
  } catch (error) {
    console.error('Background sync registration failed:', error);
    return false;
  }
};
