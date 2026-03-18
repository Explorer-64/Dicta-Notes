import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.apis.firebase import get_firestore_db, FIREBASE_ADMIN_AVAILABLE, initialize_firebase
from app.auth import AuthorizedUser
from app.libs.email_helper import send_email
from firebase_admin import auth
import time
import secrets
import string
from google.cloud.firestore_v1.base_query import FieldFilter

logger = logging.getLogger("dicta.invitations")

# Create router
router = APIRouter(prefix="/invitations")

# Import Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import auth
    from firebase_admin.auth import ActionCodeSettings
except ImportError:
    logger.warning("firebase_admin module not available. Invitations will not work.")

# Models
class InvitationRequest(BaseModel):
    email: EmailStr
    company_id: str
    role: str
    permissions: Optional[List[str]] = None

class InvitationResponse(BaseModel):
    success: bool
    invitation_id: Optional[str] = None
    message: Optional[str] = None

@router.post("/send")
async def send_invitation(request: InvitationRequest, user: AuthorizedUser):
    """Send an invitation to join a company
    
    Args:
        request: The invitation request containing email and company details
        user: The authorized user making the request
        
    Returns:
        InvitationResponse: The result of the invitation attempt
    """
    # TIER GATE: Check if user can use team sharing features
    from app.libs.tier_management import TierManager
    tier_manager = TierManager()
    can_share, gate_message = tier_manager.can_use_team_sharing(user.sub)
    
    if not can_share:
        logger.error(f"Team sharing blocked for {user.sub}: {gate_message}")
        raise HTTPException(
            status_code=403,
            detail=gate_message or "Team sharing is only available on Professional and Business plans."
        )
    logger.info(f"Team sharing allowed for {user.sub}")
    
    # Check team size limit
    tier_data = tier_manager.get_user_tier_data(user.sub)
    tier = tier_data['tier']
    team_size_limit = tier_manager.get_team_size_limit(tier)
    
    # Only enforce limit if not None (unlimited)
    if team_size_limit is not None:
        # Check if Firebase Admin SDK is available
        if not FIREBASE_ADMIN_AVAILABLE:
            raise HTTPException(status_code=500, detail="Firebase Admin SDK not available")
        
        # Initialize Firebase Admin
        initialize_firebase()
        
        # Get Firestore DB
        db_firestore = get_firestore_db()
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore not available")
        
        # Count existing members in company
        company_users_ref = db_firestore.collection('companyUsers')
        existing_members = company_users_ref.where(
            filter=FieldFilter('companyId', '==', request.company_id)
        ).get()
        
        current_member_count = len(existing_members) if existing_members else 0
        
        if current_member_count >= team_size_limit:
            logger.error(f"Team size limit reached for {user.sub}: {current_member_count}/{team_size_limit}")
            raise HTTPException(
                status_code=403,
                detail=f"Team size limit reached ({current_member_count}/{team_size_limit}). Upgrade your plan or purchase additional seats to add more members."
            )
        logger.info(f"Team size OK for {user.sub}: {current_member_count}/{team_size_limit}")

    # Check if Firebase Admin SDK is available
    if not FIREBASE_ADMIN_AVAILABLE:
        raise HTTPException(status_code=500, detail="Firebase Admin SDK not available")
    
    # Initialize Firebase Admin
    initialize_firebase()
    
    # Get Firestore DB
    db_firestore = get_firestore_db()
    if not db_firestore:
        raise HTTPException(status_code=500, detail="Firestore not available")
    
    try:
        # Check if user is an admin of the company
        company_ref = db_firestore.collection('companies').document(request.company_id)
        company = company_ref.get()
        
        if not company.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check user role in company
        company_users_ref = db_firestore.collection('companyUsers')
        user_query = company_users_ref.where(
            filter=FieldFilter('companyId', '==', request.company_id)
        ).where(
            filter=FieldFilter('userId', '==', user.sub)
        ).limit(1).get()
        
        if not user_query or len(user_query) == 0:
            raise HTTPException(status_code=403, detail="You do not have access to this company")
        
        user_role = user_query[0].to_dict().get('role')
        if user_role != 'admin':
            raise HTTPException(status_code=403, detail="Only company admins can send invitations")
        
        # Check if user already exists
        try:
            existing_user = auth.get_user_by_email(request.email)
            # User exists, check if already in company
            existing_member_query = company_users_ref.where(
                filter=FieldFilter('companyId', '==', request.company_id)
            ).where(
                filter=FieldFilter('email', '==', request.email)
            ).limit(1).get()
            
            if existing_member_query and len(existing_member_query) > 0:
                raise HTTPException(status_code=400, detail="User is already a member of this company")
            
            # Add existing user to company
            company_user_data = {
                'userId': existing_user.uid,
                'email': request.email,
                'companyId': request.company_id,
                'role': request.role,
                'permissions': request.permissions or [],
                'created_at': time.time()
            }
            
            # Add to company but don't assign variable since we don't use it
            company_users_ref.add(company_user_data)
            
            # Create invitation record for tracking
            invitation_id = f"{request.company_id}_{existing_user.uid}_{int(time.time())}"
            invitation_ref = db_firestore.collection('invitations').document(invitation_id)
            invitation_ref.set({
                'email': request.email,
                'companyId': request.company_id,
                'role': request.role,
                'permissions': request.permissions or [],
                'status': 'accepted',  # Auto-accepted for existing users
                'invitedBy': user.sub,
                'created_at': time.time(),
                'userId': existing_user.uid
            })
            
            # Send email notification to existing user
            try:
                company_name = company.to_dict().get('name', 'a company')
                inviter_email = auth.get_user(user.sub).email or "A company admin"
                
                email_subject = f"You've been added to {company_name} on Dicta-Notes"
                email_content_html = f"""
                <h2>You've been added to {company_name}</h2>
                <p>{inviter_email} has added you to their company on Dicta-Notes.</p>
                <p>You can now collaborate and share transcription sessions with your team.</p>
                <p><a href="https://dicta-notes.com/companies">View Your Companies</a></p>
                <p>Your role: {request.role}</p>
                """
                
                email_content_text = f"""
                You've been added to {company_name}
                
                {inviter_email} has added you to their company on Dicta-Notes.
                
                You can now collaborate and share transcription sessions with your team.
                
                View your companies: https://dicta-notes.com/companies
                
                Your role: {request.role}
                """

                send_email(
                    to=request.email,
                    subject=email_subject,
                    html=email_content_html,
                    skip_translation=True,
                )

                logger.info(f"Email notification sent to existing user {request.email}")
                
            except Exception as email_error:
                logger.error(f"Error sending email to existing user: {email_error}")
                # Continue anyway - user was added successfully
            
            return InvitationResponse(
                success=True,
                invitation_id=invitation_id,
                message="User already has an account and was added to the company"
            )
            
        except auth.UserNotFoundError:
            # User doesn't exist, create new user with email link
            # Generate a random password (user will reset it)
            import random
            import string
            temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
            
            # Create the user
            user_record = auth.create_user(
                email=request.email,
                password=temp_password,
                email_verified=False,
                disabled=False
            )
            
            # Create invitation record
            invitation_id = f"{request.company_id}_{user_record.uid}_{int(time.time())}"
            invitation_ref = db_firestore.collection('invitations').document(invitation_id)
            invitation_ref.set({
                'email': request.email,
                'companyId': request.company_id,
                'role': request.role,
                'permissions': request.permissions or [],
                'status': 'pending',
                'invitedBy': user.sub,
                'created_at': time.time(),
                'userId': user_record.uid
            })
            
            # Generate password reset link
            action_code_settings = auth.ActionCodeSettings(
                url=f"https://dicta-notes.com/accept-invitation?invitationId={invitation_id}",
                handle_code_in_app=False  # Changed to false for better cross-device support
            )
            
            # Send password reset email
            reset_link = auth.generate_password_reset_link(
                request.email,
                action_code_settings
            )
            
            # Send email with invitation
            try:
                company_name = company.to_dict().get('name', 'a company')
                inviter_email = auth.get_user(user.sub).email or "A company admin"
                
                email_subject = f"Invitation to join {company_name} on Dicta-Notes"
                email_content_html = f"""
                <h2>You've been invited to join {company_name} on Dicta-Notes</h2>
                <p>{inviter_email} has invited you to join their company on Dicta-Notes, the real-time transcription application.</p>
                <p>To accept this invitation and set up your account, please click the link below:</p>
                <p><a href="{reset_link}">Accept Invitation & Set Password</a></p>
                <p>This link will expire in 24 hours.</p>
                <p>If you did not request this invitation, you can safely ignore this email.</p>
                """
                
                email_content_text = f"""
                You've been invited to join {company_name} on Dicta-Notes
                
                {inviter_email} has invited you to join their company on Dicta-Notes, the real-time transcription application.
                
                To accept this invitation and set up your account, please use this link:
                {reset_link}
                
                This link will expire in 24 hours.
                
                If you did not request this invitation, you can safely ignore this email.
                """

                send_email(
                    to=request.email,
                    subject=email_subject,
                    html=email_content_html,
                    skip_translation=True,
                )

                return InvitationResponse(
                    success=True,
                    invitation_id=invitation_id,
                    message="Invitation sent successfully"
                )
                
            except Exception as email_error:
                logger.error(f"Error sending invitation email: {email_error}")
                # If email fails, still return success but with a warning
                return InvitationResponse(
                    success=True,
                    invitation_id=invitation_id,
                    message="User created but there was an error sending the email invitation"
                )
                
    except Exception as e:
        logger.error(f"Error sending invitation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send invitation: {str(e)}") from e

@router.get("/check/{invitation_id}")
async def check_invitation(invitation_id: str):
    """Check the status of an invitation
    
    Args:
        invitation_id: The ID of the invitation to check
        
    Returns:
        dict: The invitation status and details
    """
    # Check if Firebase Admin SDK is available
    if not FIREBASE_ADMIN_AVAILABLE:
        raise HTTPException(status_code=500, detail="Firebase Admin SDK not available")
    
    # Get Firestore DB
    db_firestore = get_firestore_db()
    if not db_firestore:
        raise HTTPException(status_code=500, detail="Firestore not available")
    
    try:
        # Get invitation record
        invitation_ref = db_firestore.collection('invitations').document(invitation_id)
        invitation = invitation_ref.get()
        
        if not invitation.exists:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        invitation_data = invitation.to_dict()
        
        # Get company details
        company_ref = db_firestore.collection('companies').document(invitation_data.get('companyId'))
        company = company_ref.get()
        
        if not company.exists:
            return {
                'status': 'invalid',
                'message': 'Company no longer exists'
            }
        
        company_data = company.to_dict()
        
        return {
            'status': invitation_data.get('status'),
            'email': invitation_data.get('email'),
            'company': {
                'id': invitation_data.get('companyId'),
                'name': company_data.get('name')
            },
            'role': invitation_data.get('role'),
            'created_at': invitation_data.get('created_at')
        }
        
    except Exception as e:
        logger.error(f"Error checking invitation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check invitation: {str(e)}") from e

@router.post("/accept/{invitation_id}")
async def accept_invitation(invitation_id: str, user: AuthorizedUser):
    """Accept an invitation to join a company
    
    Args:
        invitation_id: The ID of the invitation to accept
        user: The authorized user accepting the invitation
        
    Returns:
        dict: The result of accepting the invitation
    """
    # Import tier manager for team size limit checks
    from app.libs.tier_management import TierManager
    tier_manager = TierManager()
    
    # Check if Firebase Admin SDK is available
    if not FIREBASE_ADMIN_AVAILABLE:
        raise HTTPException(status_code=500, detail="Firebase Admin SDK not available")
    
    # Get Firestore DB
    db_firestore = get_firestore_db()
    if not db_firestore:
        raise HTTPException(status_code=500, detail="Firestore not available")
    
    try:
        # Get invitation record
        invitation_ref = db_firestore.collection('invitations').document(invitation_id)
        invitation = invitation_ref.get()
        
        if not invitation.exists:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        invitation_data = invitation.to_dict()
        
        # Check if invitation is already accepted or expired
        if invitation_data.get('status') == 'accepted':
            return {
                'success': False,
                'message': 'Invitation has already been accepted'
            }
        
        # Check if user matches the invitation
        user_record = auth.get_user(user.sub)
        if user_record.email != invitation_data.get('email'):
            raise HTTPException(status_code=403, detail="This invitation was sent to a different email address")
        
        # Check team size limit before accepting
        # Get company owner's tier to check limits
        company_ref = db_firestore.collection('companies').document(invitation_data.get('companyId'))
        company = company_ref.get()
        
        if not company.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company_data = company.to_dict()
        company_owner_id = company_data.get('ownerId')
        
        if company_owner_id:
            tier_data = tier_manager.get_user_tier_data(company_owner_id)
            tier = tier_data['tier']
            team_size_limit = tier_manager.get_team_size_limit(tier)
            
            # Only enforce limit if not None (unlimited)
            if team_size_limit is not None:
                # Count existing members in company
                company_users_ref = db_firestore.collection('companyUsers')
                existing_members = company_users_ref.where(
                    filter=FieldFilter('companyId', '==', invitation_data.get('companyId'))
                ).get()
                
                current_member_count = len(existing_members) if existing_members else 0
                
                if current_member_count >= team_size_limit:
                    logger.error(f"Team size limit reached when accepting invitation: {current_member_count}/{team_size_limit}")
                    raise HTTPException(
                        status_code=403,
                        detail=f"Team size limit reached ({current_member_count}/{team_size_limit}). The company owner needs to upgrade their plan or purchase additional seats."
                    )
                logger.info(f"Team size OK for accepting invitation: {current_member_count}/{team_size_limit}")
        
        # Add user to company
        company_users_ref = db_firestore.collection('companyUsers')
        
        # Check if already a member
        existing_member_query = company_users_ref.where(
            filter=FieldFilter('companyId', '==', invitation_data.get('companyId'))
        ).where(
            filter=FieldFilter('userId', '==', user.sub)
        ).limit(1).get()
        
        if existing_member_query and len(existing_member_query) > 0:
            # Update invitation status
            invitation_ref.update({
                'status': 'accepted',
                'accepted_at': time.time()
            })
            
            return {
                'success': True,
                'message': 'You are already a member of this company',
                'company_id': invitation_data.get('companyId')
            }
        
        # Add to company
        company_user_data = {
            'userId': user.sub,
            'email': user_record.email,
            'companyId': invitation_data.get('companyId'),
            'role': invitation_data.get('role'),
            'permissions': invitation_data.get('permissions') or [],
            'created_at': time.time()
        }
        
        # Add to company but don't assign variable since we don't use it
        company_users_ref.add(company_user_data)
        
        # Update invitation status
        invitation_ref.update({
            'status': 'accepted',
            'accepted_at': time.time()
        })
        
        return {
            'success': True,
            'message': 'Invitation accepted successfully',
            'company_id': invitation_data.get('companyId')
        }
        
    except Exception as e:
        logger.error("Error accepting invitation: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to accept invitation: {str(e)}") from e
