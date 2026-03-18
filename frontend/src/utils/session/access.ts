import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUserId } from './core';
import { FirestoreSession } from './types';

// Access control operations
export const SessionAccess = {
  // Delete a session with access control
  deleteSession: async (sessionId: string): Promise<void> => {
    const userId = getCurrentUserId();
    
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnapshot = await getDoc(sessionRef);
      
      if (!sessionSnapshot.exists()) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      const sessionData = sessionSnapshot.data() as FirestoreSession;
      
      // If this is a personal session, only allow deletion by owner
      if (!sessionData.companyId && sessionData.userId !== userId) {
        throw new Error('Unauthorized to delete this session');
      }
      
      // For company sessions, verify the user is an admin if not the owner
      if (sessionData.companyId && sessionData.userId !== userId) {
        const CompanyMod = await import('../company');
        try {
          await CompanyMod.CompanyRepository.verifyCompanyAdmin(sessionData.companyId);
        } catch (error) {
          throw new Error('Only company admins can delete company sessions');
        }
      }
      
      // Delete the session
      await SessionAccess.performDeleteSession(sessionRef);
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  },
  
  // Actual deletion (separated for testing)
  performDeleteSession: async (sessionRef: any): Promise<void> => {
    try {
      await deleteDoc(sessionRef);
    } catch (error) {
      console.error('Error during session deletion:', error);
      throw error;
    }
  }
};
