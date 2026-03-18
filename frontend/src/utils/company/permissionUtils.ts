import { CompanyUser, CompanyUserRole } from "./types";

// Permission utility functions
export const PermissionUtils = {
  // Transcript permissions
  canCreateTranscript: (user: CompanyUser | null): boolean => {
    if (!user) return false;
    
    // Admins can always create transcripts
    if (user.role === CompanyUserRole.ADMIN) return true;
    
    // Check specific permissions
    return !!user.permissions?.canCreateTranscripts || !!user.permissions?.canEditAll;
  },
  
  canEditTranscript: (user: CompanyUser | null, transcriptOwnerId?: string): boolean => {
    if (!user) return false;
    
    // Admins can always edit transcripts
    if (user.role === CompanyUserRole.ADMIN) return true;
    
    // Owner can always edit their own transcripts
    if (transcriptOwnerId && transcriptOwnerId === user.userId) return true;
    
    // Check specific permissions
    return !!user.permissions?.canEditTranscripts || !!user.permissions?.canEditAll;
  },
  
  canDeleteTranscript: (user: CompanyUser | null, transcriptOwnerId?: string): boolean => {
    if (!user) return false;
    
    // Admins can always delete transcripts
    if (user.role === CompanyUserRole.ADMIN) return true;
    
    // Owner can always delete their own transcripts
    if (transcriptOwnerId && transcriptOwnerId === user.userId) return true;
    
    // Check specific permissions
    return !!user.permissions?.canDeleteTranscripts || !!user.permissions?.canEditAll;
  },
  
  canShareTranscript: (user: CompanyUser | null, transcriptOwnerId?: string): boolean => {
    if (!user) return false;
    
    // Admins can always share transcripts
    if (user.role === CompanyUserRole.ADMIN) return true;
    
    // Owner can always share their own transcripts
    if (transcriptOwnerId && transcriptOwnerId === user.userId) return true;
    
    // Check specific permissions
    return !!user.permissions?.canShareTranscripts;
  },
  
  // Recording permissions
  canAccessRecording: (user: CompanyUser | null): boolean => {
    if (!user) return false;
    
    // Admins and owners can always access recordings
    if (user.role === CompanyUserRole.ADMIN) return true;
    
    // Check specific permissions
    return !!user.permissions?.canAccessRecordings || !!user.permissions?.canViewAll;
  },
  
  canShareRecording: (user: CompanyUser | null, recordingOwnerId?: string): boolean => {
    if (!user) return false;
    
    // Admins can always share recordings
    if (user.role === CompanyUserRole.ADMIN) return true;
    
    // Owner can always share their own recordings
    if (recordingOwnerId && recordingOwnerId === user.userId) return true;
    
    // Check specific permissions
    return !!user.permissions?.canShareRecordings;
  },
  
  // Management permissions
  canManageUsers: (user: CompanyUser | null): boolean => {
    if (!user) return false;
    
    // Only admins can manage users
    if (user.role === CompanyUserRole.ADMIN) return true;
    
    // Check specific permissions
    return !!user.permissions?.canManageUsers;
  }
};
