import { doc, collection, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { Company, CompanyUserRole } from './types';
import { CompanyPermissions, getCurrentUserId } from './permissions';

// Company core operations
export const CompanyOperations = {
  // Create a new company
  createCompany: async (data: Partial<Company>): Promise<string> => {
    const userId = getCurrentUserId();
    
    try {
      const companyData: Partial<Company> = {
        name: data.name || 'Untitled Company',
        description: data.description || '',
        logo_url: data.logo_url || null,
        owner_id: userId,
        settings: data.settings || {
          auto_save_interval: 60, // Default to 60 seconds
          default_permissions: {
            can_view_all: true,
            can_edit_all: false,
          }
        },
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      // Create company document
      const companiesCollection = collection(db, 'companies');
      const companyRef = await addDoc(companiesCollection, companyData);
      
      // Add creator as admin in companyUsers collection
      const companyUsersCollection = collection(db, 'companyUsers');
      await addDoc(companyUsersCollection, {
        userId,
        companyId: companyRef.id,
        role: CompanyUserRole.ADMIN,
        displayName: auth.currentUser?.displayName || '',
        email: auth.currentUser?.email || '',
        joinedAt: serverTimestamp(),
        permissions: {
          canViewAll: true,
          canEditAll: true,
          canManageUsers: true
        }
      });
      
      return companyRef.id;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },
  
  // Get a company by ID
  getCompany: async (companyId: string): Promise<Company> => {
    try {
      // First verify user has access to this company
      await CompanyPermissions.verifyCompanyAccess(companyId);
      
      const companyRef = doc(db, 'companies', companyId);
      const companySnapshot = await getDoc(companyRef);
      
      if (!companySnapshot.exists()) {
        throw new Error(`Company ${companyId} not found`);
      }
      
      const companyData = companySnapshot.data() as Company;
      
      return {
        ...companyData,
        id: companySnapshot.id
      };
    } catch (error) {
      console.error(`Error getting company ${companyId}:`, error);
      throw error;
    }
  },
  
  // List all companies user has access to
  listUserCompanies: async (): Promise<Company[]> => {
    const userId = getCurrentUserId();
    
    try {
      // Get all company relationships for this user
      const companyUsersCollection = collection(db, 'companyUsers');
      const q = query(companyUsersCollection, where('userId', '==', userId));
      const companyUsersSnapshot = await getDocs(q);
      
      if (companyUsersSnapshot.empty) {
        return [];
      }
      
      // Get the company IDs the user has access to
      const companyIds = companyUsersSnapshot.docs.map(doc => {
        const data = doc.data();
        return data.companyId;
      });
      
      // Get the company details for each ID
      const companies: Company[] = [];
      
      for (const companyId of companyIds) {
        try {
          const companyRef = doc(db, 'companies', companyId);
          const companySnapshot = await getDoc(companyRef);
          
          if (companySnapshot.exists()) {
            const companyData = companySnapshot.data() as Company;
            companies.push({
              ...companyData,
              id: companySnapshot.id
            });
          }
        } catch (innerError) {
          console.error(`Error fetching company ${companyId}:`, innerError);
          // Continue with other companies
        }
      }
      
      // Sort companies by name
      return companies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error listing user companies:', error);
      throw error;
    }
  },
  
  // Update a company
  updateCompany: async (companyId: string, data: Partial<Company>): Promise<void> => {
    try {
      // Verify the user is an admin of this company
      await CompanyPermissions.verifyCompanyAdmin(companyId);
      
      const companyRef = doc(db, 'companies', companyId);
      const updateData: Partial<Company> = {
        ...data,
        updated_at: serverTimestamp()
      };
      
      await updateDoc(companyRef, updateData);
    } catch (error) {
      console.error(`Error updating company ${companyId}:`, error);
      throw error;
    }
  },
  
  // Delete a company
  deleteCompany: async (companyId: string): Promise<void> => {
    try {
      // Verify the user is the owner of this company
      const company = await CompanyOperations.getCompany(companyId);
      const userId = getCurrentUserId();
      
      if (company.owner_id !== userId) {
        throw new Error('Only the company owner can delete a company');
      }
      
      const companyRef = doc(db, 'companies', companyId);
      await deleteDoc(companyRef);
      
      // Delete all company user relationships
      const companyUsersCollection = collection(db, 'companyUsers');
      const q = query(companyUsersCollection, where('companyId', '==', companyId));
      const companyUsersSnapshot = await getDocs(q);
      
      const deletePromises = companyUsersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Note: This doesn't delete sessions. That would need a batch operation or
      // could be handled by a separate function for data cleanup
    } catch (error) {
      console.error(`Error deleting company ${companyId}:`, error);
      throw error;
    }
  },
  
  // Transfer ownership of a company to another user
  transferOwnership: async (companyId: string, newOwnerId: string): Promise<void> => {
    try {
      // Verify current user is the owner
      const company = await CompanyOperations.getCompany(companyId);
      const currentUserId = getCurrentUserId();
      
      if (company.owner_id !== currentUserId) {
        throw new Error('Only the company owner can transfer ownership');
      }
      
      // Verify the new owner is a company member
      const companyUsersCollection = collection(db, 'companyUsers');
      const q = query(
        companyUsersCollection, 
        where('companyId', '==', companyId),
        where('userId', '==', newOwnerId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('New owner must be a member of the company');
      }
      
      // Update company owner_id
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        owner_id: newOwnerId,
        updated_at: serverTimestamp()
      });
      
      // Ensure new owner has admin role
      const userDoc = snapshot.docs[0];
      if (userDoc.data().role !== CompanyUserRole.ADMIN) {
        await updateDoc(userDoc.ref, {
          role: CompanyUserRole.ADMIN
        });
      }
      
      return;
    } catch (error) {
      console.error(`Error transferring ownership of company ${companyId}:`, error);
      throw error;
    }
  }
};
