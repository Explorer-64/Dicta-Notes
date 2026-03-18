export * from './types';
export * from './core';
export * from './query';
export * from './document';
export * from './access';
export * from './company';

import { SessionCore } from './core';
import { SessionQuery } from './query';
import { SessionDocument } from './document';
import { SessionAccess } from './access';
import { SessionCompany } from './company';

// Main SessionRepository that combines all operations
export const SessionRepository = {
  // Core session operations
  createSession: SessionCore.createSession,
  updateSession: SessionCore.updateSession,
  
  // Query operations
  getSession: SessionQuery.getSession,
  listSessions: SessionQuery.listSessions,
  
  // Document operations
  addDocument: SessionDocument.addDocument,
  
  // Access control operations
  deleteSession: SessionAccess.deleteSession,
  
  // Company operations
  createCompanySession: SessionCompany.createCompanySession,
  getCompanySessions: SessionCompany.getCompanySessions
};
