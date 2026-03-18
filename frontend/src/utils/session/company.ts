import { Session } from '../../brain/data-contracts';
import { SessionCore } from './core';
import { SessionQuery } from './query';

// Company-related session operations
export const SessionCompany = {
  // Create a session for a specific company
  createCompanySession: async (companyId: string, data: Partial<Session>): Promise<string> => {
    try {
      // Verify user has access to this company
      const CompanyMod = await import('../company');
      await CompanyMod.CompanyRepository.verifyCompanyAccess(companyId);
      
      // Create session with company ID
      return SessionCore.createSession(data, companyId);
    } catch (error) {
      console.error(`Error creating company session:`, error);
      throw error;
    }
  },
  
  // Get all sessions for a company
  getCompanySessions: async (companyId: string, options?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ sessions: any[]; total_count: number }> => {
    try {
      return SessionQuery.listSessions({
        ...options,
        companyId
      });
    } catch (error) {
      console.error(`Error listing company sessions:`, error);
      throw error;
    }
  }
};
