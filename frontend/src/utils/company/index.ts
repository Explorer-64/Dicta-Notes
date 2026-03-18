export * from './types';
export * from './permissions';
export * from './membership';
export * from './operations';
export * from './permissionUtils';

import { CompanyOperations } from './operations';
import { CompanyPermissions } from './permissions';
import { CompanyMembership } from './membership';
import { PermissionUtils } from './permissionUtils';
import { CompanyInvitations } from './invitations';

// Main CompanyRepository that combines all operations
export const CompanyRepository = {
  // Core company operations
  createCompany: CompanyOperations.createCompany,
  getCompany: CompanyOperations.getCompany,
  listUserCompanies: CompanyOperations.listUserCompanies,
  updateCompany: CompanyOperations.updateCompany,
  deleteCompany: CompanyOperations.deleteCompany,
  transferOwnership: CompanyOperations.transferOwnership,
  
  // Permission operations
  verifyCompanyAccess: CompanyPermissions.verifyCompanyAccess,
  verifyCompanyAdmin: CompanyPermissions.verifyCompanyAdmin,
  getUserCompanyRole: CompanyPermissions.getUserCompanyRole,
  isCompanyOwner: CompanyPermissions.isCompanyOwner,
  
  // Membership operations
  addCompanyUser: CompanyMembership.addCompanyUser,
  updateCompanyUser: CompanyMembership.updateCompanyUser,
  removeCompanyUser: CompanyMembership.removeCompanyUser,
  listCompanyUsers: CompanyMembership.listCompanyUsers,
  
  // Permission utilities
  canCreateTranscript: PermissionUtils.canCreateTranscript,
  canEditTranscript: PermissionUtils.canEditTranscript,
  canDeleteTranscript: PermissionUtils.canDeleteTranscript,
  canShareTranscript: PermissionUtils.canShareTranscript,
  canAccessRecording: PermissionUtils.canAccessRecording,
  canShareRecording: PermissionUtils.canShareRecording,
  canManageUsers: PermissionUtils.canManageUsers,
  
  // Invitation operations
  sendInvitation: CompanyInvitations.sendInvitation,
  checkInvitation: CompanyInvitations.checkInvitation,
  acceptInvitation: CompanyInvitations.acceptInvitation
};
