


import { useState, useEffect, useRef } from "react";
import { firebaseApp } from "app";
import { getFirestore, collection, query, orderBy, onSnapshot, Timestamp, DocumentData } from "firebase/firestore";
import { toast } from "sonner";

export interface LiveFirestoreSegment {
  id: string;
  text: string;
  speaker: string;  // Changed from speakerId and speakerName to single speaker field
  timestamp: any;
  startTime?: number;
  endTime?: number;
  language?: string;
  isFinal?: boolean;
  translation?: string;
}

/**
 * Hook to listen to live transcript segments from Firestore
 * Supports real-time updates for shared meeting viewing
 */
export const useLiveTranscriptSegments = (sessionId: string | null) => {
  const [liveTranscriptSegments, setLiveTranscriptSegments] = useState<LiveFirestoreSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const fallbackUnsubscribeRef = useRef<(() => void) | null>(null);

  // Immediate state cleanup on sessionId change or null
  useEffect(() => {
    if (!sessionId) {
      console.log('Session ID is null - clearing transcript segments immediately');
      setLiveTranscriptSegments([]);
      setIsLoading(false);
      // Cleanup any existing listeners
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (fallbackUnsubscribeRef.current) {
        fallbackUnsubscribeRef.current();
        fallbackUnsubscribeRef.current = null;
      }
      return;
    }

    console.log(`Session changed to ${sessionId} - clearing previous data and setting up new listeners`);
    // Clear previous session data immediately
    setLiveTranscriptSegments([]);
    setIsLoading(true);

    // Cleanup any existing listeners before setting up new ones
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (fallbackUnsubscribeRef.current) {
      fallbackUnsubscribeRef.current();
      fallbackUnsubscribeRef.current = null;
    }

    console.log("Setting up live transcript segments listener for session:", sessionId);
    setIsLoading(true);

    // Make sure we're using the correctly initialized Firebase app
    const db = getFirestore(firebaseApp);
    console.log("Using Firestore instance:", db);
    
    // Try primary collection path first: sessions/{sessionId}/live_transcript_segments
    const primarySegmentsRef = collection(db, "sessions", sessionId, "live_transcript_segments");
    const primaryQuery = query(primarySegmentsRef, orderBy("timestamp", "asc"));
    
    // Try fallback collection path: geminiLiveSessions/{sessionId}/multilingualSegments
    const fallbackSegmentsRef = collection(db, "geminiLiveSessions", sessionId, "multilingualSegments");
    const fallbackQuery = query(fallbackSegmentsRef, orderBy("timestamp", "asc"));

    console.log(`Subscribing to primary path: sessions/${sessionId}/live_transcript_segments`);
    console.log(`Will fallback to: geminiLiveSessions/${sessionId}/multilingualSegments`);

    let primaryHasData = false;
    let fallbackUnsubscribe: (() => void) | null = null;

    const primaryUnsubscribe = onSnapshot(primaryQuery, (querySnapshot) => {
      const segments: LiveFirestoreSegment[] = [];
      
      console.log(`Primary path received ${querySnapshot.size} segments from Firestore`, 
                  querySnapshot.metadata.hasPendingWrites ? '(has pending writes)' : '(from server)');

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Primary segment data for ${doc.id}:`, data);
        
        // Handle both old and new speaker data formats for transition period
        let speaker = data.speaker;
        if (!speaker) {
          // Fallback to old format during transition
          speaker = data.speakerName || (data.speakerId ? `Speaker ${data.speakerId}` : 'Unknown Speaker');
        }
        
        segments.push({
          id: doc.id,
          text: data.text || '',
          speaker: speaker || 'Unknown Speaker',  // Now using single speaker field
          timestamp: data.timestamp,
          startTime: data.startTime,
          endTime: data.endTime,
          language: data.language,
          isFinal: data.isFinal
        });
      });

      if (segments.length > 0) {
        primaryHasData = true;
        console.log(`Processed ${segments.length} live segments from primary path:`, 
                    segments.map(s => ({ id: s.id, text: s.text.substring(0, 50) + '...', speaker: s.speaker })));
        setLiveTranscriptSegments(segments);
        setIsLoading(false);
        
        // If we have data from primary, cancel fallback listener
        if (fallbackUnsubscribe) {
          fallbackUnsubscribe();
          fallbackUnsubscribe = null;
        }
      } else if (!primaryHasData) {
        // No data in primary collection, try fallback
        console.log("No segments in primary collection, trying fallback path...");
        
        if (!fallbackUnsubscribe) {
          fallbackUnsubscribe = onSnapshot(fallbackQuery, (fallbackSnapshot) => {
            const fallbackSegments: LiveFirestoreSegment[] = [];
            
            console.log(`Fallback path received ${fallbackSnapshot.size} segments from Firestore`);

            fallbackSnapshot.forEach((doc) => {
              const data = doc.data();
              console.log(`Fallback segment data for ${doc.id}:`, data);
              
              // Handle multilingual segment format
              const text = data.originalText || data.text || '';
              const speakerId = data.speakerId || 'unknown';
              const speaker = data.speakerName || data.speaker || `Speaker ${speakerId}`;
              
              fallbackSegments.push({
                id: doc.id,
                text,
                speaker,  // Now using single speaker field
                timestamp: data.timestamp,
                startTime: data.startTime,
                endTime: data.endTime,
                language: data.originalLanguage || data.language,
                isFinal: true // Multilingual segments are typically final
              });
            });

            if (fallbackSegments.length > 0) {
              console.log(`Processed ${fallbackSegments.length} segments from fallback path`);
              setLiveTranscriptSegments(fallbackSegments);
            }
            setIsLoading(false);
          }, (error) => {
            console.error("Error in fallback listener:", error);
            setIsLoading(false);
          });
        }
      }
      
      if (segments.length === 0 && primaryHasData === false) {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Firestore error details:", { 
        code: error.code,
        name: error.name, 
        message: error.message, 
        stack: error.stack 
      });
      console.error("Error in primary listener:", error);
      toast.error("Error fetching live transcript: " + error.message);
      setIsLoading(false);
    });

    // Store unsubscribe functions in refs for cleanup
    unsubscribeRef.current = primaryUnsubscribe;
    fallbackUnsubscribeRef.current = fallbackUnsubscribe;

    // Cleanup both subscriptions
    return () => {
      console.log(`Unsubscribing from both Firestore paths for session ${sessionId}`);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (fallbackUnsubscribeRef.current) {
        fallbackUnsubscribeRef.current();
        fallbackUnsubscribeRef.current = null;
      }
    };
  }, [sessionId]);

  // Component unmount protection - ensures cleanup even if sessionId doesn't change
  useEffect(() => {
    return () => {
      console.log('Component unmounting - ensuring all Firestore listeners are cleaned up');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (fallbackUnsubscribeRef.current) {
        fallbackUnsubscribeRef.current();
        fallbackUnsubscribeRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs on unmount

  return {
    segments: liveTranscriptSegments,
    isLoading
  };
};
