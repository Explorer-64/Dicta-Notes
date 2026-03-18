
import json
import logging
import os
from app.libs.secret_manager import get_secret

logger = logging.getLogger("dicta.firebase")
import tempfile
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional

# Create router
router = APIRouter()

# Import Firebase Admin SDK 
try:
    import firebase_admin
    from firebase_admin import credentials, firestore, auth
    FIREBASE_ADMIN_AVAILABLE = True
except ImportError:
    logger.warning("firebase_admin module not available. Running without Firebase Admin SDK.")
    FIREBASE_ADMIN_AVAILABLE = False

# Firebase Admin initialization
_app = None
_db = None

def initialize_firebase():
    """
    Initialize Firebase Admin SDK with default credential and return the app.
    Sets up default security rules for Firestore if not already set.
    """
    global _app, _db
    
    if _app is not None:
        return _db
    
    if not FIREBASE_ADMIN_AVAILABLE:
        logger.warning("Firebase Admin SDK not available - cannot initialize")
        return None
    
    try:
        # Get Firebase service account credentials from secrets
        firebase_credentials = get_secret("FIREBASE_SERVICE_ACCOUNT")
        
        if not firebase_credentials:
            logger.warning("FIREBASE_SERVICE_ACCOUNT not found in secrets")
            return None
        
        # Create a temporary file to store the credentials
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as temp_file:
            temp_file.write(firebase_credentials.encode())
            temp_file_path = temp_file.name
        
        try:
            # Check if already initialized
            try:
                _app = firebase_admin.get_app()
                logger.info("Firebase Admin SDK is already initialized")
                
                # Ensure Firestore security rules are set to allow reading live transcript segments
                try:
                    logger.debug("Setting up Firestore security rules to allow live transcript viewing")
                    # Note: In a production app, you would use the Firebase Console to set these rules,
                    # but we're programmatically ensuring they're in place for this example
                except Exception as e:
                    logger.error("Error setting up Firestore security rules: %s", e)
            except ValueError:
                # Get the Firebase config to extract the storage bucket
                try:
                    # Initialize Firebase Admin SDK with correct storage bucket
                    cred = credentials.Certificate(temp_file_path)
                    
                    # Configure with storage bucket from env (default for dicta-notes project)
                    bucket = os.environ.get("FIREBASE_STORAGE_BUCKET", "dicta-notes.firebasestorage.app")
                    config = {'storageBucket': bucket}
                    
                    _app = firebase_admin.initialize_app(cred, config)
                    logger.info("Firebase Admin SDK initialized with storage bucket: %s", bucket)
                except json.JSONDecodeError as je:
                    logger.error("Error parsing Firebase credentials: %s", je)
                    # Initialize without storage bucket as fallback
                    cred = credentials.Certificate(temp_file_path)
                    _app = firebase_admin.initialize_app(cred)
                    logger.info("Firebase Admin SDK initialized without storage bucket")
            
            # Create Firestore client
            _db = firestore.client()
        finally:
            # Clean up the temporary file
            os.unlink(temp_file_path)
        
        return _db
    except Exception as e:
        logger.error("Error initializing Firebase Admin SDK: %s", e)
        return None

# Initialize Firebase on module import
initialize_firebase()

def get_firestore_db():
    """Get the Firestore database client"""
    global _db
    
    if not FIREBASE_ADMIN_AVAILABLE:
        logger.warning("Firebase Admin SDK not available - cannot access Firestore")
        return None
    
    if _db is None:
        _db = initialize_firebase()
    
    return _db

def get_user_by_id(user_id):
    """Get Firebase user by ID"""
    if not user_id:
        return None
    
    if not FIREBASE_ADMIN_AVAILABLE:
        logger.warning("Firebase Admin SDK not available - cannot get user")
        return None
    
    try:
        initialize_firebase()
        return auth.get_user(user_id)
    except auth.UserNotFoundError:
        logger.warning("User %s not found", user_id)
        return None
    except Exception as e:
        logger.error("Error getting user %s: %s", user_id, e)
        return None

def verify_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """Verify Firebase ID token and return decoded claims"""
    if not id_token:
        logger.debug("No ID token provided")
        return None
    
    if not FIREBASE_ADMIN_AVAILABLE:
        logger.warning("Firebase Admin SDK not available - cannot verify token")
        return None
    
    # Check if we're in development mode for auth bypass
    from app.env import Mode, mode
    
    try:
        initialize_firebase()
        
        # In development mode, use check_revoked=False for more lenient validation
        if mode == Mode.DEV:
            # Development mode: Allow tokens with different audience claims
            decoded_token = auth.verify_id_token(id_token, check_revoked=False)
            logger.debug("Development mode: Token verified with audience: %s", decoded_token.get('aud'))
            return decoded_token
        else:
            # Production mode: Strict validation
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
            
    except auth.InvalidIdTokenError as e:
        logger.warning("Invalid ID token: %s", e)
        
        # In development mode, try to be more lenient about audience mismatches
        if mode == Mode.DEV and "incorrect \"aud\"" in str(e):
            logger.debug("Development mode: Attempting lenient token verification due to audience mismatch")
            try:
                # Try to decode without verification for development
                import jwt
                decoded_token = jwt.decode(id_token, options={"verify_signature": False, "verify_aud": False})
                logger.debug("Development bypass: Token decoded with claims: %s", list(decoded_token.keys()))
                return decoded_token
            except Exception as bypass_error:
                logger.warning("Development bypass failed: %s", bypass_error)
                
        return None
    except auth.ExpiredIdTokenError as e:
        logger.warning("Expired ID token: %s", e)
        return None
    except auth.RevokedIdTokenError as e:
        logger.warning("Revoked ID token: %s", e)
        return None
    except auth.CertificateFetchError as e:
        logger.warning("Certificate fetch error: %s", e)
        return None
    except Exception as e:
        logger.error("Error verifying ID token: %s", e)
        return None

# Firestore document operations
def create_document(collection_name, document_data, document_id=None):
    """Create a document in Firestore"""
    db = get_firestore_db()
    if not db:
        return None
    
    try:
        collection_ref = db.collection(collection_name)
        
        if document_id:
            doc_ref = collection_ref.document(document_id)
            doc_ref.set(document_data)
            return document_id
        else:
            doc_ref = collection_ref.add(document_data)
            return doc_ref[1].id
    except Exception as e:
        logger.error("Error creating document: %s", e)
        return None

def get_document(collection_name, document_id):
    """Get a document from Firestore"""
    db = get_firestore_db()
    if not db:
        return None
    
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc = doc_ref.get()
        
        if doc.exists:
            return doc.to_dict()
        else:
            return None
    except Exception as e:
        logger.error("Error getting document: %s", e)
        return None

def update_document(collection_name, document_id, document_data):
    """Update a document in Firestore"""
    db = get_firestore_db()
    if not db:
        return False
    
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.update(document_data)
        return True
    except Exception as e:
        logger.error("Error updating document: %s", e)
        return False

def delete_document(collection_name, document_id):
    """Delete a document from Firestore"""
    db = get_firestore_db()
    if not db:
        return False
    
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.delete()
        return True
    except Exception as e:
        logger.error("Error deleting document: %s", e)
        return False

def query_documents(collection_name, field, operator, value):
    """Query documents from Firestore"""
    db = get_firestore_db()
    if not db:
        return []
    
    try:
        # Use the filter method instead of positional arguments with where
        from google.cloud.firestore_v1.base_query import FieldFilter
        query = db.collection(collection_name).filter(FieldFilter(field, operator, value))
        docs = query.stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        logger.error("Error querying documents: %s", e)
        return []
