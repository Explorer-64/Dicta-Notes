
import { Timestamp } from 'firebase/firestore';
import { Session, SessionListItem } from '../../brain/data-contracts';

// Firestore session types
export interface FirestoreSession {
  id: string;
  title: string;
  transcript_id?: string | null;
  full_text?: string | null;
  audio_key?: string | null;
  duration?: number | null;
  speakers?: string[] | null;
  segments?: any[] | null;
  created_at: any; // Firestore timestamp
  userId: string;
  companyId?: string | null;
  has_documents?: boolean;
  documents?: FirestoreDocument[] | null;
  metadata?: Record<string, any> | null;
}

export interface FirestoreDocument {
  id: string;
  document_data: string;
  metadata?: Record<string, any> | null;
  created_at: any; // Firestore timestamp
}

// Helper function to convert Firestore timestamp to seconds
export const timestampToSeconds = (timestamp: any) => {
  if (!timestamp) return 0;
  return typeof timestamp.seconds === 'number' ? timestamp.seconds : Math.floor(Date.now() / 1000);
};

// Convert Firestore session to API Session format
export const convertToApiSession = (fsSession: FirestoreSession): Session => {
  // Check for transcript in both locations: root level and transcript_data
  const fullText = fsSession.full_text || fsSession.transcript_data?.full_text || null;
  
  return {
    id: fsSession.id,
    title: fsSession.title,
    transcript_id: fsSession.transcript_id || null,
    full_text: fullText,
    audio_key: fsSession.audio_key || null,
    duration: fsSession.duration || null,
    speakers: fsSession.speakers || null,
    segments: fsSession.segments || null,
    created_at: timestampToSeconds(fsSession.created_at),
    documents: fsSession.documents?.map(doc => ({
      id: doc.id,
      document_data: doc.document_data,
      metadata: doc.metadata || null,
      created_at: timestampToSeconds(doc.created_at)
    })) || null,
    metadata: fsSession.metadata || null
  };
};

// Convert Firestore session to SessionListItem
export const convertToSessionListItem = (fsSession: FirestoreSession): SessionListItem => {
  return {
    id: fsSession.id,
    title: fsSession.title,
    created_at: timestampToSeconds(fsSession.created_at),
    duration: fsSession.duration || null,
    has_documents: fsSession.has_documents || false,
    speakers_count: fsSession.speakers?.length || null
  };
};
