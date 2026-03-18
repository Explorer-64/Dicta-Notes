

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  DocumentData,
  addDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { useUserGuardContext } from 'app';
import { Session, SessionListItem, Speaker, TranscriptionSegment, DocumentMetadata } from '../brain/data-contracts';
import brain from 'brain';

// Interface for Firestore session document
export interface FirestoreSession {
  id: string;
  title: string;
  transcript_id?: string | null;
  full_text?: string | null;
  audio_key?: string | null;
  duration?: number | null;
  speakers?: Speaker[] | null;
  segments?: TranscriptionSegment[] | null;
  created_at: Timestamp;
  userId: string;
  companyId?: string | null;
  has_documents: boolean;
  documents?: FirestoreDocument[] | null;
  metadata?: Record<string, any> | null;
}

// Interface for Firestore document
export interface FirestoreDocument {
  id: string;
  document_data: string; // base64 encoded image
  metadata?: DocumentMetadata | null;
  created_at: Timestamp;
}

// Convert Firestore session to API Session model
export const convertToApiSession = (fsSession: FirestoreSession): Session => {
  return {
    id: fsSession.id,
    title: fsSession.title,
    transcript_id: fsSession.transcript_id || null,
    full_text: fsSession.full_text || null,
    audio_key: fsSession.audio_key || null,
    duration: fsSession.duration || null,
    speakers: fsSession.speakers || null,
    segments: fsSession.segments || null,
    created_at: fsSession.created_at.seconds,
    documents: fsSession.documents?.map(doc => ({
      id: doc.id,
      document_data: doc.document_data,
      metadata: doc.metadata || null,
      created_at: doc.created_at.seconds
    })) || null,
    metadata: fsSession.metadata || null
  };
};

// Convert Firestore session to SessionListItem
export const convertToSessionListItem = (fsSession: FirestoreSession): SessionListItem => {
  return {
    id: fsSession.id,
    title: fsSession.title,
    created_at: fsSession.created_at.seconds,
    duration: fsSession.duration || null,
    has_documents: fsSession.has_documents,
    speakers_count: fsSession.speakers?.length || null
  };
};

// Hook for session operations
export const useSessions = () => {
  const { user } = useUserGuardContext();
  
  // Create a new session
  const createSession = async (sessionData: Partial<FirestoreSession>): Promise<string> => {
    if (!user) throw new Error('User must be authenticated');
    
    try {
      const sessionsCollection = collection(db, 'sessions');
      const sessionRef = await addDoc(sessionsCollection, {
        ...sessionData,
        userId: user.uid,
        created_at: serverTimestamp(),
        has_documents: sessionData.documents?.length ? true : false
      });
      
      return sessionRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  };
  
  // Get a session by ID
  const getSession = async (sessionId: string): Promise<FirestoreSession> => {
    if (!user) throw new Error('User must be authenticated');
    
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnapshot = await getDoc(sessionRef);
      
      if (!sessionSnapshot.exists()) {
        throw new Error('Session not found');
      }
      
      const sessionData = sessionSnapshot.data() as FirestoreSession;
      
      // Security check - only allow access to own sessions
      if (sessionData.userId !== user.uid) {
        throw new Error('Unauthorized access to session');
      }
      
      return {
        ...sessionData,
        id: sessionSnapshot.id
      };
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  };
  
  // List sessions with pagination and sorting
  const listSessions = async (options?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ sessions: FirestoreSession[]; totalCount: number }> => {
    if (!user) throw new Error('User must be authenticated');
    
    try {
      const { 
        limit = 20, 
        sortBy = 'created_at', 
        sortOrder = 'desc' 
      } = options || {};
      
      // Create query for the user's sessions
      let q = query(
        collection(db, 'sessions'),
        where('userId', '==', user.uid),
        orderBy(sortBy, sortOrder),
        firestoreLimit(limit)
      );
      
      // Execute query
      const querySnapshot = await getDocs(q);
      const sessions: FirestoreSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreSession;
        sessions.push({
          ...data,
          id: doc.id
        });
      });
      
      // Get total count (in a real app, you might want to use a counter or a separate query)
      // For simplicity, we're just using the sessions count here
      const totalCount = sessions.length;
      
      return { sessions, totalCount };
    } catch (error) {
      console.error('Error listing sessions:', error);
      throw error;
    }
  };
  
  // Update a session
  const updateSession = async (sessionId: string, data: Partial<FirestoreSession>): Promise<void> => {
    if (!user) throw new Error('User must be authenticated');
    
    try {
      // Get session to verify ownership
      await getSession(sessionId);
      
      const sessionRef = doc(db, 'sessions', sessionId);
      
      // Remove id from the update data if present
      const { id, ...updateData } = data;
      
      await updateDoc(sessionRef, updateData);
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  };
  
  // Delete a session
  const deleteSession = async (sessionId: string): Promise<void> => {
    if (!user) throw new Error('User must be authenticated');
    
    try {
      // Get session to verify ownership
      await getSession(sessionId);
      
      const sessionRef = doc(db, 'sessions', sessionId);
      await deleteDoc(sessionRef);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };
  
  // Add document to a session
  const addDocument = async (sessionId: string, documentData: {
    document_data: string;
    metadata?: DocumentMetadata | null;
  }): Promise<string> => {
    if (!user) throw new Error('User must be authenticated');
    
    try {
      // Get session to verify ownership
      const session = await getSession(sessionId);
      
      // Create new document
      const newDocument: FirestoreDocument = {
        id: crypto.randomUUID(), // Generate a new UUID
        document_data: documentData.document_data,
        metadata: documentData.metadata || null,
        created_at: Timestamp.now()
      };
      
      // Add document to session documents array
      const documents = session.documents || [];
      documents.push(newDocument);
      
      // Update session
      await updateSession(sessionId, { 
        documents, 
        has_documents: true 
      });
      
      return newDocument.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };
  
  // Set up a real-time listener for a session
  const subscribeToSession = (sessionId: string, callback: (session: FirestoreSession | null) => void) => {
    if (!user) {
      console.error('User must be authenticated');
      callback(null);
      return () => {};
    }
    
    const sessionRef = doc(db, 'sessions', sessionId);
    
    return onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as FirestoreSession;
        
        // Check if this session belongs to the current user
        if (data.userId === user.uid) {
          callback({
            ...data,
            id: snapshot.id
          });
        } else {
          console.error('Unauthorized access to session');
          callback(null);
        }
      } else {
        console.error('Session not found');
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to session:', error);
      callback(null);
    });
  };
  
  // Set up a real-time listener for sessions list
  const subscribeToSessions = (callback: (sessions: FirestoreSession[]) => void, options?: {
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    if (!user) {
      console.error('User must be authenticated');
      callback([]);
      return () => {};
    }
    
    const { 
      limit = 20, 
      sortBy = 'created_at', 
      sortOrder = 'desc' 
    } = options || {};
    
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy(sortBy, sortOrder),
      firestoreLimit(limit)
    );
    
    return onSnapshot(q, (snapshot) => {
      const sessions: FirestoreSession[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as FirestoreSession;
        sessions.push({
          ...data,
          id: doc.id
        });
      });
      callback(sessions);
    }, (error) => {
      console.error('Error listening to sessions:', error);
      callback([]);
    });
  };
  
  return {
    createSession,
    getSession,
    listSessions,
    updateSession,
    deleteSession,
    addDocument,
    subscribeToSession,
    subscribeToSessions
  };
};

// User preferences operations
export const useUserPreferences = () => {
  const { user } = useUserGuardContext();
  
  // Get user preferences
  const getUserPreferences = async () => {
    if (!user) throw new Error('User must be authenticated');
    
    try {
      // Use User Preferences API instead of direct Firestore read
      const response = await brain.get_user_preferences();
      if (response.ok) {
        const data = await response.json();
        return data.preferences;
      } else {
        throw new Error('Failed to get user preferences from API');
      }
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  };
  
  // Update user preferences
  const updateUserPreferences = async (preferences: Record<string, any>) => {
    if (!user) throw new Error('User must be authenticated');
    
    try {
      // Use User Preferences API instead of direct Firestore write
      const response = await brain.update_user_preferences({ preferences });
      if (!response.ok) {
        throw new Error('Failed to update user preferences via API');
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  };
  
  // Subscribe to user preferences changes
  const subscribeToPreferences = (callback: (preferences: Record<string, any> | null) => void) => {
    if (!user) {
      console.error('User must be authenticated to subscribe to preferences');
      return () => {}; // Return empty unsubscribe function
    }
    
    const prefRef = doc(db, 'userPreferences', user.uid);
    return onSnapshot(prefRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to preferences:', error);
      callback(null);
    });
  };
  
  return {
    getUserPreferences,
    updateUserPreferences,
    subscribeToPreferences
  };
};
