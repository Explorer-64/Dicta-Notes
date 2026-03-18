import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth import AuthorizedUser
from firebase_admin import firestore
from app.apis.firebase import get_firestore_db

logger = logging.getLogger("dicta.user_profile")
router = APIRouter()

# Pydantic models
class UserTypeRequest(BaseModel):
    user_type: str

class UserTypeResponse(BaseModel):
    user_type: str
    message: str

class UserProfileResponse(BaseModel):
    user_type: str | None = None
    email: str | None = None
    user_id: str

@router.post("/update-user-type")
async def update_user_type(request: UserTypeRequest, user: AuthorizedUser) -> UserTypeResponse:
    """
    Update the user's type in Firestore
    """
    try:
        if request.user_type not in ['standard', 'freelancer']:
            raise HTTPException(status_code=400, detail="Invalid user type. Must be 'standard' or 'freelancer'")
        
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Update user document
        user_ref = db.collection('users').document(user.sub)
        user_ref.set({
            'userType': request.user_type
        }, merge=True)
        
        return UserTypeResponse(
            user_type=request.user_type,
            message="User type updated successfully"
        )
        
    except Exception as e:
        logger.error("Error updating user type: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update user type") from e

@router.get("/profile")
async def get_user_profile(user: AuthorizedUser) -> UserProfileResponse:
    """
    Get the user's profile from Firestore
    """
    try:
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Get user document
        user_ref = db.collection('users').document(user.sub)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            return UserProfileResponse(
                user_type=user_data.get('userType'),
                email=user.email,
                user_id=user.sub
            )
        else:
            # Return default profile if document doesn't exist
            return UserProfileResponse(
                user_type='standard',  # Default type
                email=user.email,
                user_id=user.sub
            )
            
    except Exception as e:
        logger.error("Error getting user profile: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get user profile") from e
