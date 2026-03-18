import logging
import os
import tempfile
from app.libs.secret_manager import get_secret
from app.libs.storage_manager import put_binary

logger = logging.getLogger("dicta.storage")
import io
import json
from urllib.parse import quote
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter

# Create router
router = APIRouter()

# Import Firebase modules
try:
    import firebase_admin
    from firebase_admin import storage
    FIREBASE_STORAGE_AVAILABLE = True
except ImportError:
    logger.warning("firebase_admin.storage module not available.")
    FIREBASE_STORAGE_AVAILABLE = False

# Firebase Storage bucket
_bucket = None

def initialize_storage():
    """Initialize Firebase Storage"""
    global _bucket

    if _bucket is not None:
        logger.info("Firebase Storage already initialized, reusing existing bucket")
        return _bucket

    if not FIREBASE_STORAGE_AVAILABLE:
        logger.warning("Firebase Storage not available - cannot initialize")
        return None

    try:
        # Make sure Firebase Admin SDK is initialized
        from app.apis.firebase import initialize_firebase, firebase_admin
        firestore_db = initialize_firebase()

        if not firestore_db:
            logger.warning("Firebase initialization failed, cannot initialize storage")
            return None

        # Get the project id from the Firebase app
        try:
            app = firebase_admin.get_app()
            logger.debug("Got Firebase app: %s", app.name)

            # Get the project ID from the app options
            project_id = app.options.get('projectId')
            if not project_id:
                logger.debug("Could not determine project ID from Firebase app options")

                # Try to get project ID from credential file as fallback
                firebase_credentials = get_secret("FIREBASE_SERVICE_ACCOUNT")
                if firebase_credentials:
                    try:
                        creds_data = json.loads(firebase_credentials)
                        project_id = creds_data.get("project_id")
                        logger.debug("Retrieved project ID from credentials: %s", project_id)
                    except Exception as je:
                        logger.warning("Failed to parse credentials: %s", je)

                # Note: Firebase default bucket REQUIRES a specific name
                # Even though it shows as "(default)" in the Firebase Console
                try:
                    # Get default bucket directly
                    _bucket = storage.bucket(app=app)
                    
                    # Test if bucket exists and we have access
                    _ = list(_bucket.list_blobs(max_results=1))
                    logger.info("Successfully connected to default bucket: %s", _bucket.name)
                    return _bucket
                except Exception as e:
                    logger.warning("Failed to access default bucket: %s", e)
                    # If bucket doesn't exist (404), don't try alternate bucket names
                    if "bucket does not exist" in str(e).lower() or "404" in str(e):
                        logger.info("Firebase Storage bucket not configured - will use databutton storage as fallback")
                        _bucket = None
                        return None

        except Exception as bucket_error:
            logger.error("Error getting storage bucket: %s", bucket_error)
            return None

        return _bucket
    except Exception as e:
        logger.error("Error initializing Firebase Storage: %s", e)
        return None

# Initialize Firebase Storage on module import
initialize_storage()

def get_storage_bucket():
    """Get the Firebase Storage bucket"""
    global _bucket

    if not FIREBASE_STORAGE_AVAILABLE:
        logger.warning("Firebase Storage not available - cannot get bucket")
        return None

    if _bucket is None:
        _bucket = initialize_storage()

    return _bucket

def upload_to_firebase_storage(file_data: bytes, file_path: str, content_type: Optional[str] = None) -> Optional[str]:
    """Upload a file to Firebase Storage

    Args:
        file_data: The file data (bytes)
        file_path: The path to store the file in Firebase Storage (e.g. 'audio/file.mp3')
        content_type: The content type of the file (e.g. 'audio/mp3')

    Returns:
        The download URL of the uploaded file or None if upload failed
    """
    bucket = get_storage_bucket()
    if not bucket:
        logger.info("Firebase Storage bucket not available - falling back to databutton storage")
        return None

    try:
        # Create a blob in the Firebase Storage bucket
        blob = bucket.blob(file_path)

        # Set content type if provided
        if content_type:
            blob.content_type = content_type

        # Upload the file data
        blob.upload_from_string(file_data, content_type=content_type)

        # Make the blob publicly accessible
        blob.make_public()

        # Get the download URL
        download_url = blob.public_url
        logger.info("File uploaded to Firebase Storage: %s", file_path)
        logger.debug("Download URL: %s", download_url)

        return download_url
    except Exception as e:
        logger.error("Error uploading to Firebase Storage: %s", e)
        return None

def upload_audio_to_firebase(audio_data: bytes, file_name: str, user_id: str, content_type: str = 'audio/mp3') -> Optional[Dict[str, Any]]:
    """Upload audio to Firebase Storage with user-specific path

    Args:
        audio_data: The audio data (bytes)
        file_name: The file name to use (e.g. 'meeting_recording.mp3')
        user_id: The user ID to include in the path
        content_type: The content type of the audio file

    Returns:
        Dict containing the Firebase Storage URL and path, or None if upload failed
    """
    try:
        # Generate a clean file path using the user ID for organization
        safe_filename = file_name.replace(' ', '_').lower()
        storage_path = f"audio/{user_id}/{safe_filename}"

        # Print debugging info
        logger.debug("Attempting to upload %d bytes to Firebase Storage at path: %s", len(audio_data), storage_path)

        # Upload to Firebase Storage
        firebase_url = upload_to_firebase_storage(audio_data, storage_path, content_type)

        if firebase_url:
            logger.info("Successfully uploaded to Firebase Storage URL: %s", firebase_url)
            return {
                "firebase_url": firebase_url,
                "firebase_path": storage_path,
                "content_type": content_type,
                "size": len(audio_data)
            }
        else:
            logger.warning("Failed to upload to Firebase Storage - using fallback storage")
            # Fallback to unified storage
            audio_key = f"audio_{user_id}_{safe_filename}"
            put_binary(audio_key, audio_data)
            logger.info("Saved audio to fallback storage with key: %s", audio_key)
            return {
                "databutton_key": audio_key,
                "content_type": content_type,
                "size": len(audio_data)
            }
    except Exception as e:
        logger.error("Error uploading audio to storage: %s", e)
        return None

def get_audio_from_firebase(storage_path: str) -> Optional[bytes]:
    """Get audio file from Firebase Storage

    Args:
        storage_path: The path to the file in Firebase Storage

    Returns:
        The file data (bytes) or None if retrieval failed
    """
    bucket = get_storage_bucket()
    if not bucket:
        logger.warning("Firebase Storage bucket not available")
        return None

    try:
        blob = bucket.blob(storage_path)
        if not blob.exists():
            logger.warning("File not found in Firebase Storage: %s", storage_path)
            return None

        # Download as bytes
        return blob.download_as_bytes()
    except Exception as e:
        logger.error("Error retrieving from Firebase Storage: %s", e)
        return None

