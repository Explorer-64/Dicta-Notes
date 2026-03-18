import { doc, collection, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUserId } from './core';
import { SessionListItem } from '../../brain/data-contracts';
import { FirestoreSession, convertToApiSession, convertToSessionListItem } from './types';

// Query operations
export const SessionQuery = {
  // Get a session by ID
  getSession: async (sessionId: string) => {
    const userId = getCurrentUserId();
    
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnapshot = await getDoc(sessionRef);
      
      if (!sessionSnapshot.exists()) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      const sessionData = sessionSnapshot.data() as FirestoreSession;
      
      // If this is a personal session (not company-related), only allow access to owner
      if (!sessionData.companyId && sessionData.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }
      
      // If this is a company session, verify user has access through company membership
      if (sessionData.companyId && sessionData.userId !== userId) {
        // Load company repository dynamically to avoid circular dependencies
        const CompanyMod = await import('../company');
        try {
          await CompanyMod.CompanyRepository.verifyCompanyAccess(sessionData.companyId);
        } catch (error) {
          throw new Error('Unauthorized access to company session');
        }
      }
      
      return convertToApiSession({
        ...sessionData,
        id: sessionSnapshot.id
      });
    } catch (error) {
      console.error(`Error getting session ${sessionId}:`, error);
      throw error;
    }
  },
  
  // List sessions with pagination and sorting
  listSessions: async (options?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
    companyId?: string;
  }): Promise<{ sessions: SessionListItem[]; total_count: number }> => {
    const userId = getCurrentUserId();
    const companyId = options?.companyId;
    
    try {
      const sessionsCollection = collection(db, 'sessions');
      let sessionsSnapshot;
      
      // If company ID is provided, get all sessions for that company
      // Otherwise, get user's personal sessions
      if (companyId) {
        // Verify user has access to this company
        const CompanyMod = await import('../company');
        await CompanyMod.CompanyRepository.verifyCompanyAccess(companyId);
        
        // Query company sessions
        const q = query(
          sessionsCollection,
          where('companyId', '==', companyId)
        );
        sessionsSnapshot = await getDocs(q);
      } else {
        // Query personal sessions
        const q = query(
          sessionsCollection,
          where('userId', '==', userId),
          where('companyId', '==', null)
        );
        sessionsSnapshot = await getDocs(q);
      }
      
      // Process sessions
      const sessions: SessionListItem[] = [];
      sessionsSnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreSession;
        sessions.push(convertToSessionListItem({
          ...data,
          id: doc.id
        }));
      });
      
      // Sort sessions
      const sortBy = options?.sortBy || 'created_at';
      const sortOrder = options?.sortOrder || 'desc';
      
      sessions.sort((a, b) => {
        if (sortBy === 'created_at') {
          return sortOrder === 'desc' ? b.created_at - a.created_at : a.created_at - b.created_at;
        } else if (sortBy === 'title') {
          return sortOrder === 'desc' ? 
            b.title.localeCompare(a.title) : 
            a.title.localeCompare(b.title);
        } else if (sortBy === 'duration' && a.duration && b.duration) {
          return sortOrder === 'desc' ? b.duration - a.duration : a.duration - b.duration;
        }
        return 0;
      });
      
      // Apply pagination
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      const paginatedSessions = sessions.slice(offset, offset + limit);
      
      return {
        sessions: paginatedSessions,
        total_count: sessions.length
      };
    } catch (error) {
      console.error('Error listing sessions:', error);
      throw error;
    }
  }
};
