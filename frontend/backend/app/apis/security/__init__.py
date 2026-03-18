import string
import random
import time
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, BackgroundTasks, APIRouter
from app.libs.email_helper import send_email

logger = logging.getLogger("dicta.security")

# Create APIRouter
router = APIRouter()

# In-memory store for security codes - would ideally be moved to more persistent storage like Firestore
DELETION_CODES = {}
# Security code expiration in seconds
CODE_EXPIRATION = 600  # 10 minutes


def generate_security_code(length=6):
    """Generate a random security code"""
    return ''.join(random.choices(string.digits, k=length))


def store_security_code(user_id: str, session_id: str) -> str:
    """Generate and store a security code for session deletion"""
    # Generate security code
    code = generate_security_code()
    
    # Store code with expiration time and session ID
    DELETION_CODES[user_id] = {
        "code": code,
        "expires": time.time() + CODE_EXPIRATION,
        "session_id": session_id
    }
    
    return code


def send_security_code_email(email: str, code: str, title: str):
    """Send security code via email"""
    try:
        send_email(
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
        logger.error(f"Error sending email: {e}")
        return False


def verify_security_code(user_id: str, session_id: str, code: str) -> bool:
    """Verify a security code for session deletion"""
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
    if user_code_data["session_id"] != session_id:
        raise HTTPException(
            status_code=400, 
            detail="Security code is not valid for this session"
        )
    
    # Check if code matches
    if user_code_data["code"] != code:
        raise HTTPException(
            status_code=400, 
            detail="Invalid security code"
        )
    
    # Code is valid, remove it from storage
    del DELETION_CODES[user_id]
    
    return True

