
import { toast } from 'sonner';
import { firebaseApp } from 'app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

/**
 * Parameters required for clearing all transcription data
 */
export interface ClearTranscriptionDataParams {
  sessionId: string | null;
  clearTranscription: () => void;
  setSessionId: (id: string) => void;
  onClearAll?: () => void;
}

/**
 * Enhanced clear function that clears ALL data sources:
 * - Gemini Live segments (local state)
 * - Session storage
 * - PWA service worker caches (background)
 * - Firestore segments from old session (background)
 * - Parent component input fields
 * 
 * Extracted from DualRecordingController for reusability and better organization
 * PERFORMANCE OPTIMIZED: Heavy operations run in background to prevent UI blocking
 */
export async function clearAllTranscriptionData({
  sessionId,
  clearTranscription,
  setSessionId,
  onClearAll
}: ClearTranscriptionDataParams): Promise<void> {
  console.log('🧹 Clearing ALL transcription data - fast local clear + background cleanup');
  
  try {
    // === IMMEDIATE UI OPERATIONS (fast, non-blocking) ===
    
    // 1. Clear Gemini Live segments (this clears local state immediately)
    clearTranscription();
    console.log('✅ Cleared local Gemini segments');
    
    // 2. Clear session storage
    try {
      sessionStorage.removeItem('dicta_transcription_state');
      console.log('✅ Session storage cleared');
    } catch (e) {
      console.warn('Session storage clear failed:', e);
    }
    
    // 3. Generate new session ID FIRST to break Firestore connections immediately
    const newSessionId = `dual-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    console.log('✅ Generated new session ID to break Firestore connection:', newSessionId);
    
    // 4. Call the parent component to clear all input fields
    if (onClearAll) {
      onClearAll();
      console.log('✅ Called parent to clear all input fields');
    }
    
    // Show immediate success feedback
    toast.success('Screen cleared! Starting fresh...', { duration: 1500 });
    
    // === BACKGROUND CLEANUP (non-blocking, async) ===
    
    // 5. PWA cache cleanup in background (don't await)
    if ('serviceWorker' in navigator && 'caches' in window) {
      setTimeout(async () => {
        try {
          const cacheNames = await caches.keys();
          // Only clear specific caches, not all
          const dictaCaches = cacheNames.filter(name => 
            name.includes('dicta') || name.includes('workbox')
          );
          
          for (const cacheName of dictaCaches) {
            console.log('🗑️ Background: Deleting PWA cache:', cacheName);
            await caches.delete(cacheName);
          }
          console.log('✅ Background: PWA caches cleared');
        } catch (cacheError) {
          console.warn('Background cache cleanup failed:', cacheError);
        }
      }, 100); // Small delay to not block UI
    }
    
    // 6. Firestore cleanup in background (don't await)
    if (sessionId && sessionId !== newSessionId) {
      setTimeout(async () => {
        try {
          const db = getFirestore(firebaseApp);
          
          // Delete live transcript segments from old session
          const liveSegmentsRef = collection(db, 'sessions', sessionId, 'live_transcript_segments');
          const liveSnapshot = await getDocs(liveSegmentsRef);
          
          if (liveSnapshot.docs.length > 0) {
            const deletePromises = liveSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log(`✅ Background: Cleaned up ${liveSnapshot.docs.length} live segments from Firestore`);
          } else {
            console.log('✅ Background: No Firestore segments to clean up');
          }
        } catch (firestoreError) {
          console.warn('Background Firestore cleanup failed:', firestoreError);
        }
      }, 500); // Delay to not block UI
    }
    
    // 7. Page reload with delay (optional, user can manually refresh if needed)
    setTimeout(() => {
      // Only reload if user hasn't navigated away
      if (window.location.pathname === window.location.pathname) {
        window.location.reload();
      }
    }, 2000); // Longer delay to allow background cleanup
    
  } catch (error) {
    console.error('Error during clear operation:', error);
    toast.error('Failed to clear screen completely');
  }
}
