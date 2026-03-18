import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("dicta.user_preferences")
from app.auth import AuthorizedUser
from firebase_admin import firestore
from app.apis.firebase import get_firestore_db
from typing import Dict, Any

router = APIRouter()

# Pydantic models
class LanguagePreferenceRequest(BaseModel):
    preferred_language: str

class UserPreferencesRequest(BaseModel):
    preferences: Dict[str, Any]

class LanguagePreferenceResponse(BaseModel):
    preferred_language: str
    message: str

class UserPreferencesResponse(BaseModel):
    preferences: Dict[str, Any]
    user_id: str

class CreateDefaultPreferencesResponse(BaseModel):
    message: str
    defaults_created: bool

@router.post("/language")
async def update_language_preference(request: LanguagePreferenceRequest, user: AuthorizedUser) -> LanguagePreferenceResponse:
    """
    Update the user's language preference in Firestore
    """
    try:
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Update user preferences document
        prefs_ref = db.collection('userPreferences').document(user.sub)
        prefs_ref.set({
            'preferredLanguage': request.preferred_language
        }, merge=True)
        
        logger.info("Language preference updated to %s for user %s", request.preferred_language, user.sub)
        
        return LanguagePreferenceResponse(
            preferred_language=request.preferred_language,
            message="Language preference updated successfully"
        )
        
    except Exception as e:
        logger.error("Error updating language preference: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update language preference") from None

@router.get("/language")
async def get_language_preference(user: AuthorizedUser) -> LanguagePreferenceResponse:
    """
    Get the user's language preference from Firestore
    """
    try:
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Get user preferences document
        prefs_ref = db.collection('userPreferences').document(user.sub)
        prefs_doc = prefs_ref.get()
        
        if prefs_doc.exists:
            prefs_data = prefs_doc.to_dict()
            preferred_language = prefs_data.get('preferredLanguage', 'en')  # Default to English
        else:
            preferred_language = 'en'  # Default fallback
            
        return LanguagePreferenceResponse(
            preferred_language=preferred_language,
            message="Language preference retrieved successfully"
        )
            
    except Exception as e:
        logger.error("Error getting language preference: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get language preference") from None

@router.post("/preferences")
async def update_user_preferences(request: UserPreferencesRequest, user: AuthorizedUser) -> UserPreferencesResponse:
    """
    Update general user preferences in Firestore
    """
    try:
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Update user preferences document
        prefs_ref = db.collection('userPreferences').document(user.sub)
        prefs_ref.set(request.preferences, merge=True)
        
        logger.info("User preferences updated for user %s", user.sub)
        
        return UserPreferencesResponse(
            preferences=request.preferences,
            user_id=user.sub
        )
        
    except Exception as e:
        logger.error("Error updating user preferences: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update user preferences") from None

@router.get("/preferences")
async def get_user_preferences(user: AuthorizedUser) -> UserPreferencesResponse:
    """
    Get all user preferences from Firestore
    """
    try:
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Get user preferences document
        prefs_ref = db.collection('userPreferences').document(user.sub)
        prefs_doc = prefs_ref.get()
        
        if prefs_doc.exists:
            preferences = prefs_doc.to_dict()
        else:
            preferences = {}  # Empty dict if no preferences exist
            
        return UserPreferencesResponse(
            preferences=preferences,
            user_id=user.sub
        )
            
    except Exception as e:
        logger.error("Error getting user preferences: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get user preferences") from None

@router.post("/create-defaults")
async def create_default_preferences(user: AuthorizedUser) -> CreateDefaultPreferencesResponse:
    """
    Create default preferences for a user if they don't exist
    """
    try:
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Check if preferences already exist
        prefs_ref = db.collection('userPreferences').document(user.sub)
        prefs_doc = prefs_ref.get()
        
        if not prefs_doc.exists:
            # Create default preferences
            default_prefs = {
                'preferredLanguage': 'en',  # Default to English
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            prefs_ref.set(default_prefs)
            
            logger.info("Default preferences created for user %s", user.sub)
            
            return CreateDefaultPreferencesResponse(
                message="Default preferences created successfully",
                defaults_created=True
            )
        else:
            return CreateDefaultPreferencesResponse(
                message="User preferences already exist",
                defaults_created=False
            )
        
    except Exception as e:
        logger.error("Error creating default preferences: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create default preferences") from None
