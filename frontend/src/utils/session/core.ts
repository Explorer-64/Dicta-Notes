import { doc, collection, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { Session } from '../../brain/data-contracts';
import { FirestoreSession, FirestoreDocument, convertToApiSession, convertToSessionListItem } from './types';

// Helper function to get current user ID
export const getCurrentUserId = (): string => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to access sessions');
  }
  return currentUser.uid;
};

// Core session operations
export const SessionCore = {
  // Create a new session
  createSession: async (data: Partial<Session>, companyId?: string): Promise<string> => {
    const userId = getCurrentUserId();
    
    try {
      const sessionData: Partial<FirestoreSession> = {
        title: data.title || 'Untitled Session',
        transcript_id: data.transcript_id || null,
        full_text: data.full_text || null,
        audio_key: data.audio_key || null,
        duration: data.duration || null,
        speakers: data.speakers || null,
        segments: data.segments || null,
        userId,
        companyId: companyId || null,
        has_documents: false,
        metadata: {
          moduleFeatures: {},
          ...(data.metadata || {})
        }
      };
      
      const sessionRef = await addDoc(collection(db, 'sessions'), {
        ...sessionData,
        created_at: serverTimestamp()
      });
      
      return sessionRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },
  
  // Update a session
  updateSession: async (sessionId: string, data: Partial<Session>): Promise<void> => {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, { ...data });
    } catch (error) {
      console.error(`Error updating session ${sessionId}:`, error);
      throw error;
    }
  },
  
  // Delete a session
  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await deleteDoc(sessionRef);
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }
};
