import logging
from fastapi import Header, HTTPException, Depends, APIRouter

logger = logging.getLogger("dicta.user")
from typing import Optional, Dict, Any, List
from app.apis.firebase import verify_id_token
from pydantic import BaseModel

router = APIRouter()

class AuthorizedUser:
    """Authorized user from Firebase"""
    def __init__(self, claims: Dict[str, Any]):
        self.claims = claims
        self.sub = claims.get("sub")  # user_id
        self.email = claims.get("email")
        self.name = claims.get("name")
        self.picture = claims.get("picture")
        self.email_verified = claims.get("email_verified")

def get_authorized_user(authorization: Optional[str] = Header(None)) -> AuthorizedUser:
    """Get authorized user from Firebase ID token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = authorization.replace("Bearer ", "")
    claims = verify_id_token(token)
    
    if not claims:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return AuthorizedUser(claims)

class VerifyTokenRequest(BaseModel):
    token: str

class VerifyTokenResponse(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    claims: Optional[Dict[str, Any]] = None

@router.post("/verify-token-user")
def verify_token_user(request: VerifyTokenRequest) -> VerifyTokenResponse:
    """Verify a Firebase ID token"""
    try:
        claims = verify_id_token(request.token)
        if claims:
            return VerifyTokenResponse(
                valid=True,
                user_id=claims.get("sub"),
                claims=claims
            )
    except Exception as e:
        logger.warning("Token verification error: %s", e)
        pass
        
    return VerifyTokenResponse(valid=False)

__all__ = ["AuthorizedUser", "get_authorized_user"]

