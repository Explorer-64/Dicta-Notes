from fastapi import APIRouter, Depends
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.apis.firebase import verify_id_token
from app.apis.user import AuthorizedUser, get_authorized_user
import logging

logger = logging.getLogger("dicta.auth")

router = APIRouter()

class VerifyTokenRequest(BaseModel):
    token: str

class VerifyTokenResponse(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    claims: Optional[Dict[str, Any]] = None

@router.post("/verify-token")
def verify_token(request: VerifyTokenRequest):
    """Verify a Firebase ID token"""
    try:
        claims = verify_id_token(request.token)
        if claims:
            return VerifyTokenResponse(
                valid=True,
                user_id=claims.get("sub"),
                claims=claims
            )
        return VerifyTokenResponse(valid=False)
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        return VerifyTokenResponse(valid=False)
