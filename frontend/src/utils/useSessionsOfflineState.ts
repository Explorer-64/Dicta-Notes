/**
 * Hook: useSessionsOfflineState
 * 
 * This hook provides offline session storage capabilities for PWA functionality.
 * It synchronizes sessions between Firestore and local storage for offline access.
 */

import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { SessionRepository } from './SessionRepository';
import brain from 'brain';

// Define session item interface aligned with both API and Firestore
interface SessionListItem {
  id: string;
  title: string;
  created_at: number;
  duration?: number;
  has_documents: boolean;
  speakers_count?: number;
  metadata?: {
    clientName?: string | null;
    projectName?: string | null;
    tags?: string[] | null;
    notes?: string | null;
    timeSpent?: number | null;
  } | null;
}

const LOCAL_STORAGE_SESSIONS_KEY = 'dicta-notes-offline-sessions';

export function useSessionsOfflineState() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const { user, loading } = useCurrentUser();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached sessions from localStorage on mount
  useEffect(() => {
    try {
      const cachedSessionsJson = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
      if (cachedSessionsJson) {
        const cachedSessions = JSON.parse(cachedSessionsJson) as SessionListItem[];
        setSessions(cachedSessions);
      }
    } catch (error) {
      console.error('Failed to load cached sessions:', error);
    } finally {
      // Don't set loading to false here - we'll still try to load from API/Firestore
    }
  }, []);

  // Fetch sessions and sync with local storage
  const fetchAndSyncSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let sessions: SessionListItem[] = [];
      
      // Try to fetch from Firestore first if user is authenticated
      if (user) {
        try {
          const firestoreSessions = await SessionRepository.listSessions();
          if (firestoreSessions && firestoreSessions.sessions && firestoreSessions.sessions.length > 0) {
            sessions = firestoreSessions.sessions;
          }
        } catch (firestoreError) {
          console.log("Firestore fetch failed, falling back to API", firestoreError);
          // Fall through to API fetch below
        }
      }
      
      // If Firestore didn't return results or failed, try the API
      if (sessions.length === 0) {
        try {
          const response = await brain.list_sessions({
            limit: 50,
            offset: 0,
            sort_by: "created_at",
            sort_order: "desc"
          });
          
          if (response.ok) {
            const data = await response.json();
            sessions = data.sessions;
          } else {
            throw new Error("API request failed");
          }
        } catch (apiError) {
          console.error("API fetch failed", apiError);
          // If both Firestore and API fail, we'll use whatever is in offline storage
        }
      }
      
      // If we got sessions from either source, update local storage
      if (sessions.length > 0) {
        setSessions(sessions);
        localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to load sessions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sessions on mount or when online status changes
  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;
    
    // Only fetch if we're online and user is authenticated
    if (navigator.onLine && user) {
      fetchAndSyncSessions();
    } else {
      // If offline or not logged in, just use what we have in local storage
      setIsLoading(false);
    }
  }, [user, isOffline, loading]);

  return {
    sessions,
    isLoading,
    isOffline,
    error,
    refreshSessions: fetchAndSyncSessions
  };
}