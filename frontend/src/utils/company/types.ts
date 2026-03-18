import { Timestamp } from 'firebase/firestore';

// Organization types enum
export enum OrganizationType {
  COMPANY = 'company',
  STRATA = 'strata',
  UNION = 'union',
  NONPROFIT = 'nonprofit',
  ASSOCIATION = 'association',
  OTHER = 'other'
}

// Company types (generalized for all organization types)
export interface Company {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: any; // Firestore timestamp
  updated_at: any; // Firestore timestamp
  owner_id: string; // User ID of the company owner/creator
  settings?: CompanySettings;
  organizationType?: OrganizationType;
  
  // Extended organization information
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  taxId?: string;
  registrationId?: string;
  industry?: string;
  foundedDate?: string;
}

export interface CompanySettings {
  auto_save_interval?: number; // Interval in seconds for auto-saving transcripts
  default_permissions?: {
    can_view_all?: boolean;
    can_edit_all?: boolean;
  };
  organizationLabel?: string; // Custom label for the organization type
}

// User-Company relationship
export enum CompanyUserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
}

export interface CompanyUser {
  id: string; // Auto-generated
  userId: string;
  companyId: string;
  role: CompanyUserRole;
  displayName?: string;
  email?: string;
  joinedAt: any; // Firestore timestamp
  permissions?: {
    // Global permissions
    canViewAll?: boolean;
    canEditAll?: boolean;
    canManageUsers?: boolean;
    
    // Transcript-specific permissions
    canCreateTranscripts?: boolean;
    canEditTranscripts?: boolean;
    canDeleteTranscripts?: boolean;
    canShareTranscripts?: boolean;
    
    // Recording-specific permissions
    canAccessRecordings?: boolean;
    canShareRecordings?: boolean;
  };
}
