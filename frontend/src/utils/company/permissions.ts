import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { CompanyUser, CompanyUserRole } from './types';

// Get current user ID or throw if not authenticated
export const getCurrentUserId = (): string => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to access company data');
  }
  return currentUser.uid;
};

// Helper function to convert Firestore timestamp to seconds
export const timestampToSeconds = (timestamp: any) => {
  if (!timestamp) return 0;
  return typeof timestamp.seconds === 'number' ? timestamp.seconds : Math.floor(Date.now() / 1000);
};

// Permission operations
export const CompanyPermissions = {
  // Check if user has access to a company
  verifyCompanyAccess: async (companyId: string | null | undefined): Promise<CompanyUser> => {
    // Early return if companyId is null or undefined
    if (!companyId) {
      throw new Error('Company ID is required');
    }
    
    const userId = getCurrentUserId();
    
    try {
      // First check if the company exists
      const companyRef = doc(db, 'companies', companyId);
      const companyDoc = await getDoc(companyRef);
      
      if (!companyDoc.exists()) {
        console.error(`Company ${companyId} does not exist`);
        throw new Error(`Company ${companyId} does not exist`);
      }
      
      const companyUsersCollection = collection(db, 'companyUsers');
      const q = query(
        companyUsersCollection, 
        where('userId', '==', userId),
        where('companyId', '==', companyId)
      );
      
      const companyUsersSnapshot = await getDocs(q);
      
      if (companyUsersSnapshot.empty) {
        throw new Error(`User does not have access to company ${companyId}`);
      }
      
      // Return the company user relationship
      const userCompanyData = companyUsersSnapshot.docs[0].data() as CompanyUser;
      return {
        ...userCompanyData,
        id: companyUsersSnapshot.docs[0].id
      };
    } catch (error) {
      console.error(`Error verifying company access for ${companyId}:`, error);
      throw error;
    }
  },
  
  // Check if user is an admin of a company
  verifyCompanyAdmin: async (companyId: string | null | undefined): Promise<boolean> => {
    // Early return if companyId is null or undefined
    if (!companyId) {
      return false;
    }
    try {
      const companyUser = await CompanyPermissions.verifyCompanyAccess(companyId);
      
      if (companyUser.role !== CompanyUserRole.ADMIN) {
        throw new Error('User is not an admin of this company');
      }
      
      return true;
    } catch (error) {
      console.error(`Error verifying admin access for company ${companyId}:`, error);
      throw error;
    }
  },

  // Get user's role in a specific company
  getUserCompanyRole: async (companyId: string | null | undefined): Promise<CompanyUserRole> => {
    // Early return if companyId is null or undefined
    if (!companyId) {
      throw new Error('Company ID is required');
    }
    try {
      const companyUser = await CompanyPermissions.verifyCompanyAccess(companyId);
      return companyUser.role;
    } catch (error) {
      console.error(`Error getting user role for company ${companyId}:`, error);
      throw error;
    }
  },
  
  // Check if current user is the owner of a company
  isCompanyOwner: async (companyId: string): Promise<boolean> => {
    try {
      if (!companyId) {
        console.error('Company ID is required to check ownership');
        return false;
      }
      
      const userId = getCurrentUserId();
      
      // Get the company document to check the owner ID
      const companyRef = doc(db, 'companies', companyId);
      const companyDoc = await getDoc(companyRef);
      
      if (!companyDoc.exists()) {
        console.error(`Company ${companyId} does not exist`);
        return false;
      }
      
      const companyData = companyDoc.data();
      return companyData.owner_id === userId;
    } catch (error) {
      console.error(`Error checking company ownership for ${companyId}:`, error);
      return false;
    }
  }
};
