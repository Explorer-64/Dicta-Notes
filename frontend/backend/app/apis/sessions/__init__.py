import datetime
import json
import time
import uuid
import time
import base64
import logging
from pydantic import BaseModel

from app.auth import AuthorizedUser
from app.apis.helpers import get_session_key  # Only import what exists in helpers
from app.apis.modules import module_access
from app.apis.firebase import get_firestore_db, FIREBASE_ADMIN_AVAILABLE  # Import from firebase module
from app.apis.migrations import migrate_sessions_to_firestore, get_migration_status
from app.libs.storage_manager import get_json as storage_get_json, put_json as storage_put_json, get_binary, put_binary, list_files as storage_list_files
from app.libs.secret_manager import get_secret
from app.apis.models import (
    Session, SessionList, SaveSessionRequest, SaveSessionResponse,
    AddDocumentRequest, AddDocumentResponse, VerificationRequest,
    SessionDocument, DocumentMetadata, SessionListItem,
    Speaker, TranscriptionSegment, TranscriptionResponse
)
from app.apis.helpers import (
    get_current_user, get_session_key, list_session_keys, sanitize_storage_key,
    get_audio_key, get_transcription_key
)
from app.apis.verification import DELETION_CODES
from google.cloud.firestore_v1.base_query import FieldFilter

from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks, Request
from typing import Optional, List, Dict, Any

logger = logging.getLogger("dicta.sessions")

# Define user dependency
user_dependency = Depends(get_current_user)

# Helper function to detect and block automated agent requests
def check_for_automated_request(request: Request):
    """Block requests that appear to be from automated agents/tools"""
    user_agent = request.headers.get("user-agent", "").lower()
    
    # Log ALL request details for debugging
    logger.debug("=== AUTOMATED REQUEST DETECTION ===")
    logger.debug(f"User-Agent: {user_agent}")
    logger.debug(f"All Headers: {dict(request.headers)}")
    logger.debug(f"Client Host: {request.client.host if request.client else 'Unknown'}")
    logger.debug("========================================")
    
    # Comprehensive list of patterns to block
    blocked_patterns = [
        "python",
        "requests",
        "httpx",
        "curl",
        "wget",
        "bot",
        "crawler",
        "spider",
        "databutton",
        "agent",
        "claude",
        "anthropic",
        "openai",
        "gpt",
        "ai",
        "automation",
        "tool",
        "mcp",
        "assistant"
    ]
    
    # Check each pattern
    for pattern in blocked_patterns:
        if pattern in user_agent:
            logger.warning(f"BLOCKED: User-agent contains '{pattern}': {user_agent}")
            raise HTTPException(
                status_code=403, 
                detail=f"Automated requests blocked (pattern: {pattern})"
            )
    
    # Block missing or suspicious user agents
    if not user_agent or user_agent.strip() == "" or user_agent in ["none", "-", "unknown"]:
        logger.warning(f"BLOCKED: Missing/suspicious user-agent: '{user_agent}'")
        raise HTTPException(
            status_code=403, 
            detail="Missing or invalid user-agent"
        )
    
    # Block non-browser requests (browsers typically have 'mozilla' in user-agent)
    if "mozilla" not in user_agent and "browser" not in user_agent and "safari" not in user_agent:
        logger.warning(f"BLOCKED: Non-browser user-agent: {user_agent}")
        raise HTTPException(
            status_code=403, 
            detail="Only browser requests allowed"
        )
    
    logger.info(f"ALLOWED: Browser request detected: {user_agent}")

GEMINI_AVAILABLE = True

router = APIRouter()

class CreateShareableSessionRequest(BaseModel):
    title: str
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    tags: Optional[List[str]] = None

class CreateShareableSessionResponse(BaseModel):
    session_id: str
    message: str

@router.post("/save_session", response_model=SaveSessionResponse)
def save_session(request: SaveSessionRequest, current_user: Dict[str, Any] = user_dependency) -> SaveSessionResponse:
    """Save a new session or update an existing one"""
    # This endpoint handles both creating new sessions and updating existing ones
    try:
        user_id = current_user.get("uid")
        firestore_db = get_firestore_db()
        session_id_to_use = request.session_id
        existing_session_data = {}

        # TIER GATE: Check if user can create new session (quota + session count)
        if not session_id_to_use:
            # Only check for NEW sessions, not updates
            from app.libs.tier_management import TierManager
            tier_manager = TierManager()
            can_create, gate_message = tier_manager.can_create_session(user_id)
            
            if not can_create:
                logger.warning(f"Session creation blocked for {user_id}: {gate_message}")
                raise HTTPException(
                    status_code=403,
                    detail=gate_message or "Cannot create new session. Please upgrade your plan."
                )
            logger.info(f"Session creation allowed for {user_id}")

        if session_id_to_use:
            # Attempting to update an existing session
            logger.info(f"Attempting to update existing session with ID: {session_id_to_use}")
            if firestore_db:
                doc_ref = firestore_db.collection('sessions').document(session_id_to_use)
                session_doc = doc_ref.get()
                if session_doc.exists:
                    existing_session_data = session_doc.to_dict()
                    if existing_session_data.get("userId") != user_id:
                        raise HTTPException(status_code=403, detail="Not authorized to update this session")
                    logger.info(f"Found existing session {session_id_to_use} in Firestore for user {user_id}")
                else:
                    # Session ID provided but not found in Firestore, try fallback or raise error
                    logger.warning(f"Session ID {session_id_to_use} provided but not found in Firestore. Checking fallback storage.")
                    try:
                        session_key = get_session_key(session_id_to_use)
                        existing_session_data = storage_get_json(session_key) or {}
                        if existing_session_data.get("userId") != user_id:
                           raise HTTPException(status_code=403, detail="Not authorized to update this session from storage")
                        logger.info(f"Found existing session {session_id_to_use} in fallback storage for user {user_id}")
                    except FileNotFoundError:
                        raise HTTPException(status_code=404, detail=f"Session with ID {session_id_to_use} not found for update.")
            else: # Fallback storage if firestore_db is None
                try:
                    session_key = get_session_key(session_id_to_use)
                    existing_session_data = storage_get_json(session_key) or {}
                    if existing_session_data.get("userId") != user_id:
                       raise HTTPException(status_code=403, detail="Not authorized to update this session from storage")
                    logger.info(f"Found existing session {session_id_to_use} in fallback storage for user {user_id} (Firestore not available)")
                except FileNotFoundError:
                    raise HTTPException(status_code=404, detail=f"Session with ID {session_id_to_use} not found for update (Firestore not available).")

        else:
            # Creating a new session
            session_id_to_use = str(uuid.uuid4())
            logger.info(f"Creating new session with ID: {session_id_to_use}")
            existing_session_data["created_at"] = time.time() # Set created_at for new sessions
            existing_session_data["userId"] = user_id # Set user ID for new sessions
            existing_session_data["documents"] = [] # Initialize for new sessions
            existing_session_data["has_documents"] = False # Initialize for new sessions


        # Update session data with request values, merging with existing data if any
        # For new sessions, existing_session_data will have userId and created_at
        # For updates, it will have all previous data.
        
        session_data_updates = {
            "title": request.title, # Title is always updated or set
            "client_name": request.client_name,
            "project_name": request.project_name,
            "tags": request.tags,
            "notes": request.notes, # From SaveSessionRequest, not to be confused with transcript notes
            "time_spent": request.time_spent
        }

        # Conditional updates for fields that might not always be present in an update request
        if request.full_text is not None:
            session_data_updates["full_text"] = request.full_text
        if request.duration is not None:
            session_data_updates["duration"] = request.duration
        if request.audio_key is not None:
            session_data_updates["audio_key"] = request.audio_key
        if request.transcript_id is not None:
            session_data_updates["transcript_id"] = request.transcript_id


        # Merge new/updated data with existing data
        # existing_session_data already contains created_at and userId for new sessions
        # or all previous data for updates.
        final_session_data = {**existing_session_data, **session_data_updates}
        final_session_data["id"] = session_id_to_use # Ensure ID is correctly set/maintained

        # Update metadata for module features (relevant for both new and updates)
        has_persistence = module_access.has_module_access(user_id, "persistence")
        final_session_data["metadata"] = {
            "module_features": {
                "persistence": has_persistence,
                "recording": True if final_session_data.get("audio_key") else module_access.has_module_access(user_id, "recording"),
                "translation": module_access.has_module_access(user_id, "translation"),
                "voiceSynthesis": module_access.has_module_access(user_id, "voiceSynthesis")
            }
        }
        
        # If a transcript ID is provided (could be for new or update), try to pull in more details
        # This part is mostly relevant if a transcript is being linked *after* initial session creation
        # or if it's a new session being created directly with a transcript.
        if request.transcript_id:
            try:
                from app.apis.helpers import get_transcription_key
                transcript_key = get_transcription_key(request.transcript_id)
                transcript_data = storage_get_json(transcript_key)
                
                if transcript_data:
                    # Only use values from transcript if not explicitly provided in this save_session request
                    if final_session_data.get("full_text") is None and transcript_data.get("full_text"):
                        final_session_data["full_text"] = transcript_data.get("full_text")
                    if final_session_data.get("audio_key") is None and transcript_data.get("audio_key"):
                        final_session_data["audio_key"] = transcript_data.get("audio_key")
                    if final_session_data.get("duration") is None and transcript_data.get("duration"):
                        final_session_data["duration"] = transcript_data.get("duration")
                    if transcript_data.get("speakers") and not final_session_data.get("speakers"): # Merge if not already set
                         final_session_data["speakers"] = transcript_data.get("speakers")
                    if transcript_data.get("segments") and not final_session_data.get("segments"): # Merge if not already set
                         final_session_data["segments"] = transcript_data.get("segments")
            except Exception as e:
                logger.error(f"Error retrieving or merging transcript data for {request.transcript_id}: {e}")

        # Clean None values before saving
        session_data_cleaned = {k: v for k, v in final_session_data.items() if v is not None}

        if not firestore_db:
            session_key_to_save = get_session_key(session_id_to_use)
            storage_put_json(session_key_to_save, session_data_cleaned)
            logger.warning(f"Firebase not available. Session {session_id_to_use} saved/updated in fallback storage.")
        else:
            sessions_collection = firestore_db.collection('sessions')
            sessions_collection.document(session_id_to_use).set(session_data_cleaned, merge=True if request.session_id else False)
            logger.info(f"Session {session_id_to_use} saved/updated in Firestore successfully (merge={True if request.session_id else False}).")
        
        return SaveSessionResponse(session_id=session_id_to_use, success=True)
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error saving/updating session: {e}")
        # Consider logging the full traceback for better debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save/update session: {str(e)}") from e



@router.get("/list_sessions", response_model=SessionList)
def list_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("created_at", regex="^(created_at|title|duration)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: Dict[str, Any] = user_dependency
) -> SessionList:
    """List all saved sessions with pagination and sorting"""
    try:
        # Get user ID from authenticated token
        user_id = current_user.get("uid")
        
        # Try to use Firestore
        sessions = []
        firestore_db = get_firestore_db()
        
        if firestore_db:
            try:
                # Query Firestore for user's sessions
                sessions_collection = firestore_db.collection('sessions')
                # Use new filter syntax to avoid deprecation warning
                from google.cloud.firestore_v1.base_query import FieldFilter
                query = sessions_collection.where(filter=FieldFilter('userId', '==', user_id))
                
                # Execute query
                sessions_docs = query.stream()
                
                for doc in sessions_docs:
                    session_data = doc.to_dict()
                    # Handle potential None values safely
                    session_speakers = session_data.get("speakers", [])
                    session_documents = session_data.get("documents", [])
                    
                    # --- Normalize created_at --- 
                    created_at_raw = session_data.get("created_at", 0)
                    if isinstance(created_at_raw, (datetime.datetime, datetime.date)):
                        # Convert Firestore Timestamp/Datetime to Unix timestamp (float)
                        created_at_normalized = created_at_raw.timestamp()
                    elif isinstance(created_at_raw, (int, float)):
                        # Already a Unix timestamp
                        created_at_normalized = float(created_at_raw)
                    else:
                        # Default to 0 if unexpected type or None
                        created_at_normalized = 0.0
                    # --- End Normalization ---
                        
                    sessions.append({
                        "id": session_data.get("id") or doc.id,  # Ensure we always have a valid ID
                        "title": session_data.get("title", "Untitled Session"),
                        "created_at": created_at_normalized, # Use normalized value
                        "duration": session_data.get("duration"),
                        "has_documents": session_data.get("has_documents", False) or len(session_documents or []) > 0, # Use the safe variable
                        "speakers_count": len(session_speakers or []), # Use the safe variable
                        # --- Add Audio Key ---
                        "audio_key": session_data.get("audio_key"),
                        # --- Add Freelancer Fields ---
                        "client_name": session_data.get("client_name"),
                        "project_name": session_data.get("project_name"),
                        "tags": session_data.get("tags"), # Will be None if not present
                        "meeting_purpose": session_data.get("meeting_purpose")
                        # --- End Freelancer Fields ---
                    })
                logger.info("Retrieved %d sessions from Firestore", len(sessions))
            except Exception as firestore_error:
                logger.warning("Error querying Firestore: %s", firestore_error)
                # Continue to fallback
                pass
                
        # If Firestore failed or returned no sessions, try fallback storage
        if not sessions:
            logger.info("Using fallback storage for sessions")

            # Get all session keys
            session_keys = list_session_keys()

            # Retrieve all sessions from storage
            for key in session_keys:
                try:
                    session_data = storage_get_json(key)
                    # Only include sessions for this user
                    if session_data and session_data.get("userId") == user_id:
                        # --- Normalize created_at ---
                        created_at_raw = session_data.get("created_at", 0)
                        # Note: storage should already store as float/int, but add check just in case
                        if isinstance(created_at_raw, (datetime.datetime, datetime.date)):
                            created_at_normalized = created_at_raw.timestamp()
                        elif isinstance(created_at_raw, (int, float)):
                            created_at_normalized = float(created_at_raw)
                        else:
                            created_at_normalized = 0.0
                        # --- End Normalization ---
                            
                        sessions.append({
                            "id": session_data.get("id") or key.replace("session_", ""),  # Use storage key if id is None
                            "title": session_data.get("title", "Untitled Session"),
                            "created_at": created_at_normalized, # Use normalized value
                            "duration": session_data.get("duration"),
                            "has_documents": session_data.get("has_documents", False) or len(session_data.get("documents", [])) > 0,
                            "speakers_count": len(session_data.get("speakers", [])),
                            # --- Add Audio Key ---
                            "audio_key": session_data.get("audio_key"),
                            # --- Add Freelancer Fields ---
                            "client_name": session_data.get("client_name"),
                            "project_name": session_data.get("project_name"),
                            "tags": session_data.get("tags"), # Will be None if not present
                            "meeting_purpose": session_data.get("meeting_purpose")
                            # --- End Freelancer Fields ---
                        })
                except Exception as e:
                    logger.warning("Error retrieving session %s: %s", key, e)
                    continue
            
            logger.info("Retrieved %d sessions from fallback storage", len(sessions))
        
        # Sort sessions
        reverse_sort = sort_order.lower() == "desc"
        if sort_by == "created_at":
            sessions.sort(key=lambda x: x.get("created_at", 0), reverse=reverse_sort)
        elif sort_by == "title":
            sessions.sort(key=lambda x: x.get("title", "").lower(), reverse=reverse_sort)
        elif sort_by == "duration":
            sessions.sort(key=lambda x: x.get("duration", 0) or 0, reverse=reverse_sort)
        
        # Apply pagination
        total_count = len(sessions)
        paginated_sessions = sessions[offset:offset + limit]
        
        return SessionList(sessions=paginated_sessions, total_count=total_count)
        
    except Exception as e:
        logger.error("Error listing sessions: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {str(e)}") from e

@router.get("/get_session/{session_id}", response_model=Session)
def get_session(session_id: str, request: Request, current_user: Dict[str, Any] = user_dependency) -> Session:
    """Get a specific session by ID"""
    
    # Block automated agent requests to prevent large Firestore documents
    check_for_automated_request(request)
    
    try:
        # Get user ID from authenticated token
        user_id = current_user.get("uid")
        session_data = None
        
        # Try to use Firestore first
        firestore_db = get_firestore_db()
        if firestore_db:
            try:
                # Get session from Firestore
                doc_ref = firestore_db.collection('sessions').document(session_id)
                session_doc = doc_ref.get()
                
                if session_doc.exists:
                    session_data = session_doc.to_dict()
                    
                    # Security check - verify user owns this session
                    if session_data.get("userId") != user_id:
                        raise HTTPException(status_code=403, detail="Not authorized to access this session")
                else:
                    logger.debug("Session %s not found in Firestore", session_id)
            except Exception as firestore_error:
                logger.warning("Error retrieving session from Firestore: %s", firestore_error)
                # Continue to fallback
                pass
        
        # If session not found in Firestore or Firestore unavailable, try fallback storage
        if not session_data:
            try:
                logger.info("Trying fallback storage for session %s", session_id)
                session_key = get_session_key(session_id)
                session_data = storage_get_json(session_key)
                
                if not session_data:
                    raise HTTPException(status_code=404, detail=f"Session with ID {session_id} not found")
                
                # Security check - verify user owns this session
                if session_data.get("userId") != user_id:
                    raise HTTPException(status_code=403, detail="Not authorized to access this session")
                    
                # If session found in storage but not Firestore, try to migrate it
                if firestore_db and FIREBASE_ADMIN_AVAILABLE:
                    try:
                        logger.info("Migrating session %s to Firestore", session_id)
                        firestore_db.collection('sessions').document(session_id).set(session_data)
                    except Exception as migration_error:
                        logger.warning("Failed to migrate session to Firestore: %s", migration_error)
            except HTTPException:
                raise
            except Exception as storage_error:
                logger.warning("Error retrieving session from storage: %s", storage_error)
                raise HTTPException(status_code=404, detail=f"Session with ID {session_id} not found") from storage_error
        
        if not session_data:
            raise HTTPException(status_code=404, detail=f"Session with ID {session_id} not found")
            
        return Session(**session_data)
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("Error retrieving session: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}") from e

@router.post("/add_document", response_model=AddDocumentResponse)
def add_document(request: AddDocumentRequest, current_user: Dict[str, Any] = user_dependency) -> AddDocumentResponse:
    """Add a document to an existing session"""
    import base64
    
    try:
        # Get user ID from authenticated token
        user_id = current_user.get("uid")
        
        # Generate document ID and storage key
        document_id = str(uuid.uuid4())
        storage_key = sanitize_storage_key(f"documents_{user_id}_{document_id}")
        
        # Extract and validate base64 image data
        document_data = request.document_data
        if document_data.startswith("data:"):
            # Remove data URL prefix (data:image/jpeg;base64,)
            document_data = document_data.split(",", 1)[1]
        
        try:
            # Decode base64 to get actual image bytes
            image_bytes = base64.b64decode(document_data)
            logger.debug("Storing document %s: %d bytes", document_id, len(image_bytes))
            
            # Store image in storage as binary
            put_binary(storage_key, image_bytes)
            
        except Exception as storage_error:
            logger.error("Error storing document in storage: %s", storage_error)
            raise HTTPException(status_code=500, detail="Failed to store document")
        
        # Create document record with storage reference
        document = {
            "id": document_id,
            "storage_key": storage_key,
            "filename": request.filename,
            "content_type": request.content_type or "image/jpeg",
            "metadata": {
                "document_type": request.document_type
            },
            "created_at": time.time()
        }
        
        # First try to use Firestore
        firestore_db = get_firestore_db()
        session_data = None
        using_firestore = False
        
        if firestore_db:
            try:
                # Get session from Firestore
                doc_ref = firestore_db.collection('sessions').document(request.session_id)
                session_doc = doc_ref.get()
                
                if session_doc.exists:
                    session_data = session_doc.to_dict()
                    using_firestore = True
                    
                    # Security check - verify user owns this session
                    if session_data.get("userId") != user_id:
                        raise HTTPException(status_code=403, detail="Not authorized to modify this session")
                else:
                    logger.debug("Session %s not found in Firestore", request.session_id)
            except Exception as firestore_error:
                logger.warning("Error accessing Firestore: %s", firestore_error)
                # Continue to fallback
        
        # If not found in Firestore or Firestore unavailable, try fallback storage
        if not session_data:
            try:
                logger.info("Trying fallback storage for session %s", request.session_id)
                session_key = get_session_key(request.session_id)
                session_data = storage_get_json(session_key)
                
                if not session_data:
                    raise HTTPException(status_code=404, detail=f"Session with ID {request.session_id} not found")
                
                # Security check - verify user owns this session
                if session_data.get("userId") != user_id:
                    raise HTTPException(status_code=403, detail="Not authorized to modify this session")
            except Exception as storage_error:
                logger.warning("Error retrieving session from storage: %s", storage_error)
                raise HTTPException(status_code=404, detail=f"Session with ID {request.session_id} not found") from storage_error
        
        # Add document to session
        if "documents" not in session_data:
            session_data["documents"] = []
        
        session_data["documents"].append(document)
        session_data["has_documents"] = True
        
        # Save the updated session
        if using_firestore:
            # Update Firestore document
            firestore_db.collection('sessions').document(request.session_id).update({
                "documents": session_data["documents"],
                "has_documents": True
            })
        else:
            # Update in fallback storage
            session_key = get_session_key(request.session_id)
            storage_put_json(session_key, session_data)
            
            # Try to migrate to Firestore if available
            if firestore_db and FIREBASE_ADMIN_AVAILABLE:
                try:
                    firestore_db.collection('sessions').document(request.session_id).set(session_data)
                    logger.info("Migrated session %s to Firestore after adding document", request.session_id)
                except Exception as migration_error:
                    logger.warning("Failed to migrate session to Firestore: %s", migration_error)
        
        return AddDocumentResponse(
            document_id=document_id,
            success=True,
            metadata=document["metadata"]
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("Error adding document: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to add document: {str(e)}") from e

@router.get("/get_session_audio/{session_id}")
def get_session_audio(session_id: str, current_user: Dict[str, Any] = user_dependency):
    """Get audio info for a specific session with improved lookup"""
    logger.debug("Entered get_session_audio for session_id: %s", session_id)
    try:
        # Get user ID from authenticated token
        user_id = current_user.get("uid")
        logger.debug("Authenticated user_id: %s", user_id)
        
        # Import helper functions
        from app.apis.helpers import sanitize_storage_key, get_audio_key, get_transcription_key
        
        # Sanitize the session ID
        sanitized_id = sanitize_storage_key(session_id)
        session = None
        audio_key = None
        
        # Try Firestore first if available
        firestore_db = get_firestore_db()
        if firestore_db:
            try:
                doc_ref = firestore_db.collection('sessions').document(sanitized_id)
                session_doc = doc_ref.get()
                
                if session_doc.exists:
                    session = session_doc.to_dict()
                    # Security check - verify user owns this session
                    if session.get("userId") != user_id:
                        raise HTTPException(status_code=403, detail="Not authorized to access this session")
                    
                    if session:
                        # Prioritize 'audio_key' as it's the primary identifier
                        audio_key = session.get("audio_key") or session.get("audio_url")
                        logger.debug("Found session in Firestore with audio_key: %s", audio_key)

                        # If it's a full URL, we can return it directly
                        if audio_key and audio_key.startswith("http"):
                            return {
                                "found": True,
                                "audio_key": audio_key,
                                "session_id": sanitized_id
                            }
            except Exception as e:
                logger.warning("Error checking Firestore: %s", e)
                # Continue to fallback
        
        # If not found in Firestore or no audio key, try fallback storage
        if not session or not audio_key:
            try:
                # Try direct lookup from storage
                session_key = get_session_key(sanitized_id)
                try:
                    session_data = storage_get_json(session_key)
                    if session_data:
                        # Security check - verify user owns this session
                        if session_data.get("userId") != user_id:
                            raise HTTPException(status_code=403, detail="Not authorized to access this session")

                        session = session_data
                        # Prioritize 'audio_key' here as well for consistency
                        audio_key = session.get("audio_key") or session.get("audio_url")
                        logger.debug("Found session in fallback storage with audio_key: %s", audio_key)

                        # If it's a full URL, we can return it directly
                        if audio_key and audio_key.startswith("http"):
                            return {
                                "found": True,
                                "audio_key": audio_key,
                                "session_id": sanitized_id
                            }
                except Exception as direct_error:
                    logger.warning("Error in direct session lookup: %s", direct_error)
            except Exception as storage_error:
                logger.warning("Error checking storage: %s", storage_error)
        
        # If we have a session but no audio key, try to recover by checking transcript_id
        if session and not audio_key and session.get("transcript_id"):
            try:
                transcript_id = session.get("transcript_id")
                transcript_key = get_transcription_key(transcript_id)
                
                # Try to get transcription data which should have audio_key
                try:
                    transcript_data = storage_get_json(transcript_key)
                    if transcript_data:
                        audio_key = transcript_data.get("audio_key")
                        logger.info("Recovered audio_key from transcript data: %s", audio_key)
                        
                        # Update the session with the recovered audio_key
                        if audio_key:
                            try:
                                if firestore_db and session.get("id"):
                                    firestore_db.collection('sessions').document(session.get("id")).update({
                                        "audio_key": audio_key
                                    })
                                    logger.info("Updated Firestore session with recovered audio_key")
                                else:
                                    # Update in fallback storage
                                    session_key = get_session_key(sanitized_id)
                                    session["audio_key"] = audio_key
                                    storage_put_json(session_key, session)
                                    logger.info("Updated fallback storage session with recovered audio_key")
                            except Exception as update_error:
                                logger.warning("Error updating session with recovered key: %s", update_error)
                except Exception as transcript_error:
                    logger.warning("Error retrieving transcript data: %s", transcript_error)
            except Exception as recovery_error:
                logger.warning("Error in recovery attempt: %s", recovery_error)
        
        # If we still don't have an audio key, try listing all audio files
        if not audio_key:
            try:
                files = storage_list_files("")
                possible_keys = []

                # Look for audio files related to this session
                for name in files:
                    if name.startswith(f"audio_{sanitized_id}") or sanitized_id in name:
                        possible_keys.append(name)
                        logger.debug("Found possible matching audio file: %s", name)
                
                if possible_keys:
                    return {
                        "found": len(possible_keys) > 0,
                        "message": "Found possible matching audio files",
                        "session_id": sanitized_id,
                        "possible_keys": possible_keys,
                        "audio_key": possible_keys[0] if possible_keys else None
                    }
            except Exception as list_error:
                logger.warning("Error listing storage: %s", list_error)
        
        # Return result
        if audio_key:
            # If it's a URL, return directly (this is a fallback check)
            if audio_key.startswith("http"):
                return {
                    "found": True,
                    "audio_key": audio_key,
                    "session_id": sanitized_id
                }
            
            # Verify internal audio file exists
            try:
                if get_binary(audio_key) is not None:
                    return {
                        "found": True,
                        "audio_key": audio_key,
                        "session_id": sanitized_id
                    }
                logger.warning("Audio verification failed for key %s: file not found", audio_key)
                return {
                    "found": False,
                    "message": f"Audio key found but file not accessible: {audio_key}",
                    "audio_key": audio_key,
                    "session_id": sanitized_id,
                    "error": "File not found"
                }
            except Exception as verify_error:
                logger.warning("Audio verification failed for key %s: %s", audio_key, verify_error)
                return {
                    "found": False,
                    "message": f"Audio key found but file not accessible: {audio_key}",
                    "audio_key": audio_key,
                    "session_id": sanitized_id,
                    "error": str(verify_error)
                }
        else:
            return {
                "found": False,
                "message": "No audio key found for this session",
                "session_id": sanitized_id
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("Error retrieving session audio info: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Error retrieving session audio info: {str(e)}") from e

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str, 
    current_user: AuthorizedUser,
    verification: Optional[VerificationRequest] = None
) -> Dict[str, Any]:
    """Delete a session and all associated data"""
    try:
        # Get user ID from authenticated token
        user_id = current_user.sub
        session_found = False
        is_authorized = False
        
        # Verify security code if verification is required
        if verification and verification.requireVerification:
            from app.apis.security import verify_security_code
            try:
                verify_security_code(user_id, session_id, verification.code)
            except HTTPException as ve:
                raise ve
        
        # Try to delete from both Firestore and storage
        error_messages = []
        
        # Try Firestore first
        firestore_db = get_firestore_db()
        if firestore_db:
            try:
                doc_ref = firestore_db.collection('sessions').document(session_id)
                session_doc = doc_ref.get()
                
                if session_doc.exists:
                    session_data = session_doc.to_dict()
                    session_found = True
                    
                    # Security check
                    if session_data.get("userId") == user_id:
                        is_authorized = True
                        doc_ref.delete()
                        logger.info("Deleted session %s from Firestore", session_id)
                    else:
                        raise HTTPException(status_code=403, detail="Not authorized to delete this session")
            except HTTPException:
                raise
            except Exception as firestore_error:
                error_msg = f"Error deleting from Firestore: {firestore_error}"
                logger.warning("%s", error_msg)
                error_messages.append(error_msg)
        
        # Try storage deletion regardless of Firestore result
        try:
            session_key = get_session_key(session_id)
            session_data = storage_get_json(session_key)

            if session_data:
                session_found = True

                # Security check
                if session_data.get("userId") == user_id:
                    is_authorized = True

                    # Delete associated audio files if they exist
                    audio_key = session_data.get("audio_key")
                    if audio_key:
                        try:
                            if get_binary(audio_key) is not None:
                                # Don't delete audio files as they might be referenced elsewhere
                                logger.debug("Audio file %s exists but not deleted (may be referenced elsewhere)", audio_key)
                        except Exception:
                            logger.debug("Audio file %s not found or already deleted", audio_key)

                    # Delete session JSON (clear the data)
                    storage_put_json(session_key, {})
                    logger.info("Deleted session %s from storage", session_id)
                else:
                    raise HTTPException(status_code=403, detail="Not authorized to delete this session")
        except HTTPException:
            raise
        except Exception as storage_error:
            error_msg = f"Error deleting from storage: {storage_error}"
            logger.warning("%s", error_msg)
            error_messages.append(error_msg)
        
        # Check results
        if not session_found:
            raise HTTPException(status_code=404, detail=f"Session with ID {session_id} not found")
        
        if not is_authorized:
            raise HTTPException(status_code=403, detail="Not authorized to delete this session")
        
        result = {
            "success": True,
            "session_id": session_id,
            "message": "Session deleted successfully"
        }
        
        if error_messages:
            result["warnings"] = error_messages
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting session: %s", e)  
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}") from e


@router.post("/create-shareable-session", response_model=CreateShareableSessionResponse)
def create_shareable_session(request: CreateShareableSessionRequest, current_user: Dict[str, Any] = user_dependency) -> CreateShareableSessionResponse:
    """Create a temporary shareable session for live collaboration - does NOT save to Firestore"""
    try:
        user_id = current_user.get("uid")
        session_id = str(uuid.uuid4())
        
        # Create temporary session data for sharing only (NOT saved to Firestore)
        temp_session_data = {
            "id": session_id,
            "title": request.title,
            "userId": user_id,
            "client_name": request.client_name,
            "project_name": request.project_name,
            "tags": request.tags or [],
            "created_at": time.time(),
            "is_temporary": True,  # Mark as temporary
            "duration": 0
        }
        
        # Store temporarily in fallback storage only (not Firestore)
        session_key = get_session_key(session_id)
        storage_put_json(session_key, temp_session_data)
        
        logger.info("Created temporary shareable session %s for user %s (NOT saved to Firestore)", session_id, user_id)
        
        return CreateShareableSessionResponse(
            session_id=session_id,
            message="Shareable session created successfully"
        )
        
    except Exception as e:
        logger.error("Error creating shareable session: %s", e)
        raise HTTPException(status_code=500, detail=f"Error creating shareable session: {str(e)}") from e
