import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUserId } from './core';
import { FirestoreSession, FirestoreDocument } from './types';

// Document operations
export const SessionDocument = {
  // Add a document to a session
  addDocument: async (sessionId: string, documentData: {
    document_data: string;
    document_type?: string | null;
  }): Promise<string> => {
    const userId = getCurrentUserId();
    
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnapshot = await getDoc(sessionRef);
      
      if (!sessionSnapshot.exists()) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      const sessionData = sessionSnapshot.data() as FirestoreSession;
      
      // If this is a personal session, only allow owner
      if (!sessionData.companyId && sessionData.userId !== userId) {
        throw new Error('Unauthorized to modify this session');
      }
      
      // For company sessions, verify the user has access
      if (sessionData.companyId && sessionData.userId !== userId) {
        const CompanyMod = await import('../company');
        try {
          await CompanyMod.CompanyRepository.verifyCompanyAccess(sessionData.companyId);
        } catch (error) {
          throw new Error('Unauthorized to modify company session');
        }
      }
      
      // Create new document
      const newDocument: FirestoreDocument = {
        id: crypto.randomUUID(),
        document_data: documentData.document_data,
        metadata: documentData.document_type ? { document_type: documentData.document_type } : null,
        created_at: serverTimestamp() as any
      };
      
      // Add document to session
      const documents = sessionData.documents || [];
      documents.push(newDocument);
      
      // Update session
      await updateDoc(sessionRef, { 
        documents, 
        has_documents: true 
      });
      
      return newDocument.id;
    } catch (error) {
      console.error(`Error adding document to session ${sessionId}:`, error);
      throw error;
    }
  }
};
