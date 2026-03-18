import { firebaseApp } from 'app';
import { getFirestore, collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';

/**
 * Helper to verify that segments are being saved to Firestore
 * Use this to test that the unified transcription system is working
 */
export async function verifyFirestoreSegments(sessionId: string) {
  if (!sessionId) {
    console.log('❌ No sessionId provided for verification');
    return;
  }

  try {
    const db = getFirestore(firebaseApp);
    const segmentsRef = collection(db, 'sessions', sessionId, 'live_transcript_segments');
    const q = query(segmentsRef, orderBy('timestamp', 'desc'), limit(10));
    
    console.log('🔍 Checking Firestore for session:', sessionId);
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('📝 No segments found in Firestore yet for this session');
      return [];
    }
    
    const segments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Found ${segments.length} segments in Firestore:`);
    segments.forEach((segment, index) => {
      console.log(`${index + 1}. Speaker: ${segment.speakerName} | Text: ${segment.text?.substring(0, 50)}...`);
    });
    
    return segments;
  } catch (error) {
    console.error('❌ Error checking Firestore:', error);
    return [];
  }
}

/**
 * Real-time listener to watch segments being added to Firestore
 * Use this to see live updates as transcription happens
 */
export function watchFirestoreSegments(sessionId: string, callback: (count: number) => void) {
  if (!sessionId) {
    console.log('❌ No sessionId provided for watching');
    return () => {};
  }

  try {
    const db = getFirestore(firebaseApp);
    const segmentsRef = collection(db, 'sessions', sessionId, 'live_transcript_segments');
    const q = query(segmentsRef, orderBy('timestamp', 'desc'));
    
    console.log('👀 Watching Firestore segments for session:', sessionId);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.size;
      console.log(`📊 Firestore segments count: ${count}`);
      callback(count);
      
      // Log new segments
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          console.log('🆕 New segment saved to Firestore:', {
            speaker: data.speakerName,
            text: data.text?.substring(0, 100) + '...'
          });
        }
      });
    }, (error) => {
      console.error('❌ Error watching Firestore:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up Firestore watcher:', error);
    return () => {};
  }
}
