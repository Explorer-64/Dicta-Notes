from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth import AuthorizedUser
from datetime import datetime, timedelta
import time
import logging

logger = logging.getLogger("dicta.agenda_flow_auth")

# Import Firebase Admin SDK
try:
    from firebase_admin import auth as firebase_auth
    from app.apis.firebase import initialize_firebase
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("Firebase Admin SDK not available for Agenda Flow auth")

router = APIRouter(prefix="/auth")

class AgendaFlowTokenResponse(BaseModel):
    token: str
    userId: str
    expiresIn: int
    connectUrl: str

@router.post("/generate-agenda-flow-token")
async def generate_agenda_flow_token(user: AuthorizedUser) -> AgendaFlowTokenResponse:
    """
    Generate a Firebase custom token for Agenda Flow PWA authentication.
    
    This endpoint allows authenticated Dicta-Notes users to securely connect
    to the Agenda Flow PWA by generating a custom token that can be used
    to sign in with the same Firebase user identity.
    
    Args:
        user: The authenticated user from Dicta-Notes
        
    Returns:
        AgendaFlowTokenResponse with token, userId, expiration, and connect URL
        
    Raises:
        HTTPException: If Firebase is not available or token generation fails
    """
    
    if not FIREBASE_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Firebase Admin SDK not available. Cannot generate authentication token."
        )
    
    try:
        # Ensure Firebase is initialized
        initialize_firebase()
        
        # Generate custom token for the user
        # The user.sub contains the Firebase UID
        custom_token = firebase_auth.create_custom_token(user.sub)
        
        # Custom tokens are valid for 1 hour (Firebase limitation)
        expires_in = 3600  # 1 hour in seconds
        
        # Decode token to string if it's bytes
        token_str = custom_token.decode('utf-8') if isinstance(custom_token, bytes) else custom_token
        
        # Build the Agenda Flow connection URL
        # In production, this would be the actual Agenda Flow domain
        # For now, using a placeholder that can be configured
        agenda_flow_base_url = "https://agenda-flow.com"
        connect_url = f"{agenda_flow_base_url}/auth?token={token_str}"
        
        return AgendaFlowTokenResponse(
            token=token_str,
            userId=user.sub,
            expiresIn=expires_in,
            connectUrl=connect_url
        )
        
    except Exception as e:
        logger.error(f"Error generating Agenda Flow token: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate authentication token: {str(e)}"
        )
