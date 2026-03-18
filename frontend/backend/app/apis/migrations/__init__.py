import logging
import time
import re
from fastapi import APIRouter, HTTPException

logger = logging.getLogger("dicta.migrations")
from pydantic import BaseModel
from app.apis.firebase import get_firestore_db, FIREBASE_ADMIN_AVAILABLE
from app.auth import AuthorizedUser
from app.libs.storage_manager import list_files, get_json as storage_get_json
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore_v1 import aggregation

router = APIRouter(prefix="/migrations")

class MigrationRequest(BaseModel):
    user_id: str

class MigrationResponse(BaseModel):
    success: bool
    total: int = 0
    migrated: int = 0
    failed: int = 0
    skipped: int = 0
    errors: list = []
    error: str = None

class MigrationStatusResponse(BaseModel):
    firestore_available: bool
    storage_session_count: int
    firestore_session_count: int

@router.post("/migrate_sessions")
async def migrate_sessions(body: MigrationRequest, user: AuthorizedUser) -> MigrationResponse:
    """Migrate user sessions from db.storage to Firestore"""
    # Ensure the requesting user is the same as the user_id in the request
    # or allow admin users to migrate any user's sessions
    if user.sub != body.user_id:
        return MigrationResponse(
            success=False,
            error="You can only migrate your own sessions"
        )
    
    result = migrate_sessions_to_firestore(body.user_id)
    return MigrationResponse(**result)

@router.get("/migration_status")
async def check_migration_status(user: AuthorizedUser) -> MigrationStatusResponse:
    """Check the status of migrations between storage systems"""
    status = get_migration_status()
    return MigrationStatusResponse(**status)

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def migrate_sessions_to_firestore(user_id: str):
    """Migrate sessions from db.storage to Firestore
    
    Args:
        user_id: The user ID to associate with the migrated sessions
        
    Returns:
        dict: Migration statistics
    """
    # Check if Firestore is available
    if not FIREBASE_ADMIN_AVAILABLE:
        return {
            "success": False,
            "error": "Firebase Admin SDK not available",
            "migrated": 0,
            "failed": 0
        }
    
    db_firestore = get_firestore_db()
    if not db_firestore:
        return {
            "success": False,
            "error": "Could not connect to Firestore",
            "migrated": 0,
            "failed": 0
        }
    
    # Get all session keys from storage
    try:
        all_files = list_files("")
        session_keys = [name for name in all_files if name.startswith("session_")]
    except Exception as e:
        return {
            "success": False,
            "error": f"Error listing session keys: {str(e)}",
            "migrated": 0,
            "failed": 0
        }
    
    # Migration stats
    stats = {
        "success": True,
        "total": len(session_keys),
        "migrated": 0,
        "failed": 0,
        "skipped": 0,
        "errors": []
    }
    
    # Process each session
    for key in session_keys:
        try:
            # Get session data from storage
            session_data = storage_get_json(key)
            
            if not session_data:
                stats["skipped"] += 1
                continue
            
            # Extract session ID from the key
            session_id = key.replace("session_", "")
            
            # Set the user ID if not present
            if "userId" not in session_data:
                session_data["userId"] = user_id
            
            # Check if session already exists in Firestore
            session_ref = db_firestore.collection("sessions").document(session_id)
            session_doc = session_ref.get()
            
            if session_doc.exists:
                # Skip if already migrated
                stats["skipped"] += 1
                continue
            
            # Set creation timestamp if not present
            if "created_at" not in session_data:
                session_data["created_at"] = time.time()
            
            # Set the session ID if not present
            if "id" not in session_data:
                session_data["id"] = session_id
            
            # Save to Firestore
            session_ref.set(session_data)
            stats["migrated"] += 1
            
        except Exception as e:
            stats["failed"] += 1
            stats["errors"].append({
                "key": key,
                "error": str(e)
            })
    
    return stats

def get_migration_status():
    """Get the status of the migration"""
    if not FIREBASE_ADMIN_AVAILABLE:
        return {
            "firestore_available": False,
            "storage_session_count": get_storage_session_count(),
            "firestore_session_count": 0
        }
    
    return {
        "firestore_available": True,
        "storage_session_count": get_storage_session_count(),
        "firestore_session_count": get_firestore_session_count()
    }

def get_storage_session_count():
    """Count sessions in storage"""
    try:
        all_files = list_files("")
        return len([name for name in all_files if name.startswith("session_")])
    except Exception:
        return 0

def get_firestore_session_count():
    """Count sessions in Firestore using aggregation query for better performance"""
    if not FIREBASE_ADMIN_AVAILABLE:
        return 0
    
    db_firestore = get_firestore_db()
    if not db_firestore:
        return 0
    
    try:
        sessions_ref = db_firestore.collection("sessions")
        # Use aggregation query for better performance instead of streaming all documents
        aggregate_query = aggregation.AggregationQuery(sessions_ref)
        aggregate_query.count(alias="session_count")
        results = aggregate_query.get()
        return results[0][0].value
    except Exception as e:
        logger.warning("Error counting Firestore sessions with aggregation: %s", e)
        # Fallback to streaming count if aggregation fails
        try:
            count = 0
            for _ in sessions_ref.stream():
                count += 1
            return count
        except Exception as fallback_error:
            logger.warning("Error counting Firestore sessions with fallback: %s", fallback_error)
            return 0

