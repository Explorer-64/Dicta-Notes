from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import time
from app.apis.firebase import get_firestore_db, FIREBASE_ADMIN_AVAILABLE
from app.libs.secret_manager import get_secret
from app.libs.storage_manager import can_connect

router = APIRouter(prefix="/health")

class SystemHealthResponse(BaseModel):
    firestore_connected: bool
    firebase_admin_available: bool
    storage_accessible: bool
    secrets_accessible: bool
    timestamp: float
    details: Dict[str, Any]

@router.get("/system")
async def check_system_health() -> SystemHealthResponse:
    """
    Comprehensive system health check from the backend
    Tests critical system components with proper admin access
    """
    details = {}
    
    # Test Firestore connectivity
    firestore_connected = False
    if FIREBASE_ADMIN_AVAILABLE:
        try:
            db_firestore = get_firestore_db()
            if db_firestore:
                # Try to read from a collection to test connectivity
                sessions_ref = db_firestore.collection('sessions')
                # Just get a reference to test connection, don't actually query data
                _ = sessions_ref.limit(1).get()  # Use underscore to indicate intentionally unused
                firestore_connected = True
                details['firestore'] = 'Connected successfully'
            else:
                details['firestore'] = 'Failed to get Firestore client'
        except Exception as e:
            details['firestore'] = f'Connection failed: {str(e)}'
    else:
        details['firestore'] = 'Firebase Admin SDK not available'
    
    # Test storage accessibility (read-only, no writes - safe for frequent health checks)
    storage_accessible = False
    try:
        storage_accessible = can_connect()
        details['storage'] = 'Accessible' if storage_accessible else 'Not accessible'
    except Exception as e:
        details['storage'] = f'Not accessible: {str(e)}'
    
    # Test secrets accessibility
    secrets_accessible = False
    try:
        # Try to access a known secret (don't expose the value)
        gemini_key = get_secret('GEMINI_API_KEY')
        secrets_accessible = gemini_key is not None and len(str(gemini_key)) > 0
        details['secrets'] = 'Accessible' if secrets_accessible else 'No secrets found or empty'
    except Exception as e:
        details['secrets'] = f'Not accessible: {str(e)}'
    
    return SystemHealthResponse(
        firestore_connected=firestore_connected,
        firebase_admin_available=FIREBASE_ADMIN_AVAILABLE,
        storage_accessible=storage_accessible,
        secrets_accessible=secrets_accessible,
        timestamp=time.time(),
        details=details
    )

@router.get("/firestore")
async def check_firestore_health() -> Dict[str, Any]:
    """
    Detailed Firestore health check
    """
    if not FIREBASE_ADMIN_AVAILABLE:
        return {
            'connected': False,
            'error': 'Firebase Admin SDK not available',
            'collections_accessible': [],
            'timestamp': time.time()
        }
    
    try:
        db_firestore = get_firestore_db()
        if not db_firestore:
            return {
                'connected': False,
                'error': 'Could not get Firestore client',
                'collections_accessible': [],
                'timestamp': time.time()
            }
        
        # Test access to key collections
        collections_to_test = ['sessions', 'users', 'translation_cache']
        accessible_collections = []
        
        for collection_name in collections_to_test:
            try:
                collection_ref = db_firestore.collection(collection_name)
                # Just test if we can get a reference and do a limited query
                docs = collection_ref.limit(1).get()
                accessible_collections.append({
                    'name': collection_name,
                    'accessible': True,
                    'doc_count': len(docs)
                })
            except Exception as e:
                accessible_collections.append({
                    'name': collection_name,
                    'accessible': False,
                    'error': str(e)
                })
        
        return {
            'connected': True,
            'collections_accessible': accessible_collections,
            'timestamp': time.time()
        }
        
    except Exception as e:
        return {
            'connected': False,
            'error': str(e),
            'collections_accessible': [],
            'timestamp': time.time()
        }

