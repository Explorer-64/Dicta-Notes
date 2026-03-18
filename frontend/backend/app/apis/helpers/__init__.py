import re
import time
import string
import random
import logging
from fastapi import Header, HTTPException, APIRouter
from typing import Dict, Any, List, Optional
from app.apis.firebase import verify_id_token
from app.libs.storage_manager import list_files

logger = logging.getLogger("dicta.helpers")

# Create router
router = APIRouter()

# In-memory store for security codes - would ideally be moved to more persistent storage like Firestore
DELETION_CODES = {}
# Security code expiration in seconds
CODE_EXPIRATION = 600  # 10 minutes

def generate_security_code(length=6):
    """Generate a random security code"""
    return ''.join(random.choices(string.digits, k=length))

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Helper function to create a session storage key
def get_session_key(session_id: str) -> str:
    return sanitize_storage_key(f"session_{session_id}")

# Helper function for consistent audio key generation
def get_audio_key(transcription_id: str) -> str:
    """Create consistent audio file key from transcription ID"""
    return sanitize_storage_key(f"audio_{transcription_id}")

# Helper function for consistent transcription key generation
def get_transcription_key(transcription_id: str) -> str:
    """Create consistent transcription data key from transcription ID"""
    return sanitize_storage_key(f"transcription_{transcription_id}")

# Helper function to list all session keys
def list_session_keys() -> List[str]:
    try:
        all_files = list_files("")
        return [name for name in all_files if name.startswith("session_")]
    except Exception as e:
        logger.error(f"Error listing session keys: {e}")
        return []

# Authentication dependency
async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Verify Firebase ID token and return user info"""
    auth_str = str(authorization) if authorization else None
    if not auth_str or not auth_str.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_str.replace("Bearer ", "")
    claims = verify_id_token(token)
    
    if not claims:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return claims
