import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { CompanyUser, CompanyUserRole } from './types';
import { CompanyPermissions, getCurrentUserId } from './permissions';

// Company membership operations
export const CompanyMembership = {
  // Add a user to a company
  addCompanyUser: async (companyId: string, userData: {
    email: string,
    role: CompanyUserRole,
    permissions?: CompanyUser['permissions']
  }): Promise<string> => {
    try {
      // Verify the current user is an admin of this company
      await CompanyPermissions.verifyCompanyAdmin(companyId);
      
      // For now, we'll assume the user with this email exists
      // In a real implementation, you might need to verify the user exists or create an invitation
      
      const companyUsersCollection = collection(db, 'companyUsers');
      const companyUserData: Partial<CompanyUser> = {
        companyId,
        email: userData.email,
        role: userData.role,
        joinedAt: serverTimestamp(),
        permissions: userData.permissions || {
          canViewAll: userData.role === CompanyUserRole.ADMIN,
          canEditAll: userData.role === CompanyUserRole.ADMIN,
          canManageUsers: userData.role === CompanyUserRole.ADMIN
        }
      };
      
      // If we have the userId, add it. Otherwise we'll need to update this later
      // when the user accepts the invitation
      // This would require a more complex invitation system
      
      const companyUserRef = await addDoc(companyUsersCollection, companyUserData);
      return companyUserRef.id;
    } catch (error) {
      console.error(`Error adding user to company ${companyId}:`, error);
      throw error;
    }
  },
  
  // Update a company user's role or permissions
  updateCompanyUser: async (companyUserId: string, updates: {
    role?: CompanyUserRole,
    permissions?: CompanyUser['permissions']
  }): Promise<void> => {
    try {
      const companyUserRef = doc(db, 'companyUsers', companyUserId);
      const companyUserSnapshot = await getDoc(companyUserRef);
      
      if (!companyUserSnapshot.exists()) {
        throw new Error(`Company user relationship ${companyUserId} not found`);
      }
      
      const companyUser = companyUserSnapshot.data() as CompanyUser;
      
      // Verify the current user is an admin of this company
      await CompanyPermissions.verifyCompanyAdmin(companyUser.companyId);
      
      await updateDoc(companyUserRef, updates);
    } catch (error) {
      console.error(`Error updating company user ${companyUserId}:`, error);
      throw error;
    }
  },
  
  // Remove a user from a company
  removeCompanyUser: async (companyUserId: string): Promise<void> => {
    try {
      const companyUserRef = doc(db, 'companyUsers', companyUserId);
      const companyUserSnapshot = await getDoc(companyUserRef);
      
      if (!companyUserSnapshot.exists()) {
        throw new Error(`Company user relationship ${companyUserId} not found`);
      }
      
      const companyUser = companyUserSnapshot.data() as CompanyUser;
      
      // Verify the current user is an admin of this company
      await CompanyPermissions.verifyCompanyAdmin(companyUser.companyId);
      
      // NOTE: We'd need to check if user is company owner in a real implementation
      // This is currently handled in the main repository
      
      await deleteDoc(companyUserRef);
    } catch (error) {
      console.error(`Error removing company user ${companyUserId}:`, error);
      throw error;
    }
  },
  
  // List users in a company
  listCompanyUsers: async (companyId: string): Promise<CompanyUser[]> => {
    try {
      // Verify the user has access to this company
      await CompanyPermissions.verifyCompanyAccess(companyId);
      
      const companyUsersCollection = collection(db, 'companyUsers');
      const q = query(companyUsersCollection, where('companyId', '==', companyId));
      const companyUsersSnapshot = await getDocs(q);
      
      const companyUsers: CompanyUser[] = [];
      
      companyUsersSnapshot.forEach(doc => {
        const data = doc.data() as CompanyUser;
        companyUsers.push({
          ...data,
          id: doc.id
        });
      });
      
      return companyUsers;
    } catch (error) {
      console.error(`Error listing users for company ${companyId}:`, error);
      throw error;
    }
  }
};
