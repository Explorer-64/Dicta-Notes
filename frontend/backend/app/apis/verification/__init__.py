import logging
import time
import random
import string
from typing import Dict, Any, Optional

logger = logging.getLogger("dicta.verification")
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.apis.firebase import get_firestore_db, FIREBASE_ADMIN_AVAILABLE
from app.apis.helpers import get_current_user, get_session_key
from app.auth import AuthorizedUser
from app.libs.storage_manager import exists as storage_exists, get_json as storage_get_json
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter()

# In-memory store for security codes - would be better in a database
DELETION_CODES = {}
# Security code expiration time in seconds
CODE_EXPIRATION = 600  # 10 minutes

# Models for verification
class VerificationRequest(BaseModel):
    code: str
    
class VerificationResponse(BaseModel):
    success: bool
    message: str
    
class DeleteVerificationResponse(BaseModel):
    message: str
    expiresIn: int
    isAuthorized: bool

def generate_security_code(length=6):
    """Generate a random security code"""
    return ''.join(random.choices(string.digits, k=length))

@router.post("/request_deletion_code/{sessionId}", response_model=DeleteVerificationResponse)
async def request_deletion_code(
    sessionId: str,
    background_tasks: BackgroundTasks,
    current_user: AuthorizedUser # Use FastAPI dependency injection
):
    """Request a security code for session deletion"""
    try:
        # Get user ID and email from authenticated token
        user_id = current_user.sub # AuthorizedUser uses .sub for user ID
        user_email = current_user.email # AuthorizedUser provides email directly
        
        if not user_email:
            raise HTTPException(status_code=400, detail="User email not found")
        
        # Check permissions (reuse same authorization logic as delete_session)
        is_authorized = False
        session_found = False
        session_title = "Session"
        
        # Try to use Firestore first
        firestore_db = get_firestore_db()
        
        if firestore_db:
            try:
                # Get session from Firestore
                doc_ref = firestore_db.collection('sessions').document(sessionId)
                session_doc = doc_ref.get()
                
                if session_doc.exists:
                    session_found = True
                    session_data = session_doc.to_dict()
                    session_title = session_data.get("title", "Session")
                    
                    # Direct ownership check
                    if session_data.get("userId") == user_id:
                        is_authorized = True
                    # Company permission check for company sessions
                    elif session_data.get("companyId"):
                        try:
                            # Get user's role in the company
                            company_id = session_data.get("companyId")
                            q = firestore_db.collection('companyUsers').where(
                                filter=FieldFilter('userId', '==', user_id)
                            ).where(
                                filter=FieldFilter('companyId', '==', company_id)
                            )
                            company_user_docs = q.get()
                            
                            if company_user_docs and len(company_user_docs) > 0:
                                company_user_data = company_user_docs[0].to_dict()
                                user_role = company_user_data.get("role")
                                
                                # Check if user is admin
                                if user_role == "admin" or company_user_data.get("permissions", {}).get("canDeleteTranscripts", False):
                                    is_authorized = True
                        except Exception as e:
                            logger.warning("Error checking company permissions: %s", e)
            except Exception as e:
                logger.warning("Error getting session from Firestore: %s", e)
        
        # Fall back to storage if not found or authorized in Firestore
        if not session_found:
            try:
                # Get session from storage
                session_key = get_session_key(sessionId)
                if storage_exists(session_key):
                    session_found = True
                    session_data = storage_get_json(session_key) or {}
                    session_title = session_data.get("title", "Session")
                    
                    # Check if user is the owner
                    if session_data.get("userId") == user_id:
                        is_authorized = True
            except Exception as e:
                logger.warning("Error checking storage session: %s", e)
                
        if not session_found:
            raise HTTPException(status_code=404, detail="Session not found")
            
        # If user is not authorized, return early with authorization status
        if not is_authorized:
            return DeleteVerificationResponse(
                message="You do not have permission to delete this session. Only owners or admins can delete sessions.",
                expiresIn=0,
                isAuthorized=False
            )
        
        # Generate security code
        code = generate_security_code()
        
        # Store code with expiration time and session ID
        DELETION_CODES[user_id] = {
            "code": code,
            "expires": time.time() + CODE_EXPIRATION,
            "session_id": sessionId
        }
        
        # Send email with code
        from app.libs.email_helper import send_email as send_email_helper

        def send_security_code_email(email, code, title):
            try:
                send_email_helper(
                    to=email,
                    subject="DictaNotes - Security Code for Session Deletion",
                    html=f"""
                    <h2>Session Deletion Verification</h2>
                    <p>You've requested to delete the session: <strong>{title}</strong></p>
                    <p>To verify this request, please use the following security code:</p>
                    <h3 style="font-size: 24px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; display: inline-block;">{code}</h3>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you did not request this deletion, please ignore this email and consider changing your password.</p>
                    <p>Thank you,<br>DictaNotes Team</p>
                    """,
                    skip_translation=True,
                )
                return True
            except Exception as e:
                logger.error("Error sending deletion code email to %s: %s", email, e)
                try:
                    from app.libs.storage_manager import get_json as _get_json, put_json as _put_json
                    from datetime import datetime
                    logs = _get_json("admin_error_logs", default=[]) or []
                    logs.insert(0, {
                        "id": f"err_{int(time.time())}",
                        "timestamp": datetime.utcnow().isoformat(),
                        "level": "error",
                        "message": f"Failed to send deletion verification code: {e}",
                        "component": "verification",
                        "source": "backend",
                        "errorType": "email_send_failure",
                        "metadata": {"recipient": email, "session_title": title},
                    })
                    _put_json("admin_error_logs", logs[:1000])
                except Exception as log_err:
                    logger.error("Failed to write to error log: %s", log_err)
                return False
        
        # Send email in background task to avoid blocking
        background_tasks.add_task(send_security_code_email, user_email, code, session_title)
        
        return DeleteVerificationResponse(
            message=f"Security code sent to {user_email}",
            expiresIn=CODE_EXPIRATION,
            isAuthorized=True
        )
    except HTTPException as he:
        logger.debug("HTTP Exception in request_deletion_code: %s", he.detail)
        raise he
    except Exception as e:
        logger.error("Error requesting deletion code: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to send verification code: {str(e)}") from e

@router.post("/verify_deletion_code/{sessionId}", response_model=VerificationResponse)
async def verify_deletion_code(
    sessionId: str,
    verification: VerificationRequest,
    current_user: AuthorizedUser # Use FastAPI dependency injection
):
    """Verify a security code for session deletion"""
    # Current user is already provided by the dependency
    try:
        # Get user ID from authenticated token
        user_id = current_user.sub # AuthorizedUser uses .sub for user ID
        
        # Check if user has a valid code
        user_code_data = DELETION_CODES.get(user_id)
        if not user_code_data:
            raise HTTPException(
                status_code=400, 
                detail="No security code found. Please request a verification code first."
            )
        
        # Check if code is expired
        if time.time() > user_code_data["expires"]:
            # Remove expired code
            del DELETION_CODES[user_id]
            raise HTTPException(
                status_code=400, 
                detail="Security code has expired. Please request a new code."
            )
        
        # Check if code is for the correct session
        if user_code_data["session_id"] != sessionId:
            raise HTTPException(
                status_code=400, 
                detail="Security code is not valid for this session"
            )
        
        # Check if code matches
        if user_code_data["code"] != verification.code:
            raise HTTPException(
                status_code=400, 
                detail="Invalid security code"
            )
            
        # Code is valid, but we'll leave it in the store for now so it can be used for the actual deletion
        # We'll remove it after the deletion is complete
        
        return VerificationResponse(
            success=True,
            message="Code verified successfully. You can now delete the session."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error verifying code: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to verify code: {str(e)}") from e

