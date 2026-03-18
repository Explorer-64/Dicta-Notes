"""Unsubscribe API for marketing emails - Legal compliance."""

import logging
from fastapi import APIRouter, HTTPException

logger = logging.getLogger("dicta.unsubscribe")
from pydantic import BaseModel, EmailStr
from datetime import datetime
import firebase_admin
from firebase_admin import firestore

router = APIRouter()

# Get Firestore client
db = firestore.client()


class UnsubscribeRequest(BaseModel):
    """Request to unsubscribe from marketing emails."""
    email: EmailStr
    reason: str | None = None


class UnsubscribeResponse(BaseModel):
    """Response after unsubscribe."""
    success: bool
    message: str


class UnsubscribeStatusResponse(BaseModel):
    """Response for checking unsubscribe status."""
    is_unsubscribed: bool
    unsubscribed_at: str | None = None


@router.post("/unsubscribe")
async def unsubscribe_from_emails(request: UnsubscribeRequest) -> UnsubscribeResponse:
    """
    Unsubscribe a user from marketing emails.
    
    This endpoint allows users to opt out of marketing communications
    as required by CAN-SPAM Act, GDPR, and other regulations.
    """
    try:
        # Store unsubscribe in Firestore
        unsubscribe_ref = db.collection("email_unsubscribes").document(request.email)
        
        unsubscribe_data = {
            "email": request.email,
            "unsubscribed_at": datetime.utcnow().isoformat(),
            "reason": request.reason,
            "ip_address": None,  # Could be added if needed
        }
        
        unsubscribe_ref.set(unsubscribe_data)
        
        logger.info("User %s unsubscribed from marketing emails", request.email)
        if request.reason:
            logger.debug("Reason: %s", request.reason)
        
        return UnsubscribeResponse(
            success=True,
            message="You have been successfully unsubscribed from marketing emails. You will still receive important account-related notifications."
        )
        
    except Exception as e:
        logger.error("Error unsubscribing %s: %s", request.email, str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to process unsubscribe request. Please try again."
        )


@router.get("/unsubscribe/status/{email}")
async def check_unsubscribe_status(email: str) -> UnsubscribeStatusResponse:
    """
    Check if an email address has unsubscribed from marketing emails.
    
    This is used internally before sending marketing emails.
    """
    try:
        unsubscribe_ref = db.collection("email_unsubscribes").document(email)
        doc = unsubscribe_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            return UnsubscribeStatusResponse(
                is_unsubscribed=True,
                unsubscribed_at=data.get("unsubscribed_at")
            )
        
        return UnsubscribeStatusResponse(
            is_unsubscribed=False,
            unsubscribed_at=None
        )
        
    except Exception as e:
        logger.error("Error checking unsubscribe status for %s: %s", email, str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to check unsubscribe status"
        )


@router.post("/unsubscribe/resubscribe")
async def resubscribe_to_emails(request: UnsubscribeRequest) -> UnsubscribeResponse:
    """
    Allow users to resubscribe to marketing emails if they change their mind.
    """
    try:
        unsubscribe_ref = db.collection("email_unsubscribes").document(request.email)
        unsubscribe_ref.delete()
        
        logger.info("User %s resubscribed to marketing emails", request.email)
        
        return UnsubscribeResponse(
            success=True,
            message="You have been resubscribed to marketing emails."
        )
        
    except Exception as e:
        logger.error("Error resubscribing %s: %s", request.email, str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to process resubscribe request"
        )
