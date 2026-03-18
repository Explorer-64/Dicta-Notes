import { firebaseApp } from 'app';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import brain from 'brain';

export interface CompanyInvitation {
  id: string;
  email: string;
  companyId: string;
  status: 'pending' | 'accepted' | 'invalid';
  role: string;
  createdAt: number;
  companyName?: string;
}

export interface InvitationRequest {
  email: string;
  role: string;
  permissions?: string[];
}

export interface InvitationResponse {
  success: boolean;
  message?: string;
  invitation_id?: string;
}

export const CompanyInvitations = {
  /**
   * Send an invitation to join a company
   * 
   * @param companyId The company ID
   * @param invitation The invitation data
   * @returns The invitation response
   */
  sendInvitation: async (companyId: string, invitation: InvitationRequest): Promise<InvitationResponse> => {
    try {
      const response = await brain.send_invitation({
        email: invitation.email,
        company_id: companyId,
        role: invitation.role,
        permissions: invitation.permissions || []
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message,
        invitation_id: data.invitation_id
      };
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw new Error('Failed to send invitation');
    }
  },
  
  /**
   * Check the status of an invitation
   * 
   * @param invitationId The invitation ID
   * @returns The invitation status and details
   */
  checkInvitation: async (invitationId: string): Promise<CompanyInvitation> => {
    try {
      const response = await brain.check_invitation({
        invitation_id: invitationId
      });
      
      const data = await response.json();
      
      return {
        id: invitationId,
        email: data.email,
        companyId: data.company.id,
        companyName: data.company.name,
        status: data.status,
        role: data.role,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error checking invitation:', error);
      throw new Error('Failed to check invitation');
    }
  },
  
  /**
   * Accept an invitation to join a company
   * 
   * @param invitationId The invitation ID
   * @returns The result of accepting the invitation
   */
  acceptInvitation: async (invitationId: string): Promise<{ success: boolean; message: string; companyId?: string }> => {
    try {
      const response = await brain.accept_invitation({
        invitation_id: invitationId
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message,
        companyId: data.company_id
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw new Error('Failed to accept invitation');
    }
  },
};
