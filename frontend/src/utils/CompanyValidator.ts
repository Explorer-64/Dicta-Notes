import { CompanyRepository } from './company';
import { toast } from 'sonner';

/**
 * Utility for validating company existence and access
 * This centralizes company error handling to avoid repetition
 */
export const CompanyValidator = {
  /**
   * Validates if a company exists and user has access
   * Returns the company data if valid, null if invalid
   * Handles errors gracefully with appropriate messages
   */
  validateCompanyAccess: async (companyId: string | null | undefined) => {
    if (!companyId) return null;
    
    try {
      // Attempt to get company data which also verifies access
      const companyData = await CompanyRepository.getCompany(companyId);
      return companyData;
    } catch (error) {
      console.error('Error validating company access:', error);
      
      // Handle non-existence without showing error toast
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('does not exist')) {
        toast.error('Error accessing company data');
      }
      
      return null;
    }
  },
  
  /**
   * Checks if current user is an admin for the specified company
   * Returns true if admin, false otherwise
   * Handles errors gracefully without showing error messages for non-existent companies
   */
  isCompanyAdmin: async (companyId: string | null | undefined) => {
    if (!companyId) return false;
    
    try {
      const userRole = await CompanyRepository.getUserCompanyRole(companyId);
      return userRole === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      
      // Don't show error for non-existent companies
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('does not exist')) {
        toast.error('Error checking company permissions', { id: 'admin-check-error' });
      }
      
      return false;
    }
  },
  
  /**
   * Removes invalid company ID from URL
   * Useful when a non-existent company ID is present in URL parameters
   */
  removeCompanyFromUrl: (companyId: string) => {
    if (!companyId) return;
    
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('companyId');
      window.history.replaceState({}, '', newUrl);
    } catch (error) {
      console.error('Error removing company from URL:', error);
    }
  }
};
