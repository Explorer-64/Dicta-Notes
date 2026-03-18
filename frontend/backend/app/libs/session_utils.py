import logging
from typing import Dict, Any
from app.apis.firebase import get_firestore_db

logger = logging.getLogger("dicta.session_utils")
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
import time

def ensure_session_exists(session_id: str, user_id: str, session_title: str = None) -> bool:
    """
    Ensure a Firestore session exists. If not, create a minimal session.
    
    Args:
        session_id: The session ID to check/create
        user_id: The user ID who owns the session
        session_title: Optional title for new sessions
        
    Returns:
        bool: True if session exists or was created successfully, False otherwise
    """
    try:
        firestore_db = get_firestore_db()
        if not firestore_db:
            logger.warning("Firestore not available")
            return False
            
        session_ref = firestore_db.collection('sessions').document(session_id)
        session_doc = session_ref.get()
        
        if session_doc.exists:
            # Session already exists, verify ownership
            session_data = session_doc.to_dict()
            if session_data.get('userId') == user_id:
                return True
            else:
                logger.warning("Session %s exists but belongs to different user", session_id)
                return False
        else:
            # Session doesn't exist, create it
            title = session_title or "Auto-created Session"
            session_data = {
                'userId': user_id,
                'title': title,
                'createdAt': SERVER_TIMESTAMP,
                'duration': 0,
                'status': 'active',
                'source': 'auto-created',
                'client_name': None,
                'project_name': None,
                'tags': []
            }
            session_ref.set(session_data)
            logger.info("Auto-created session: %s", session_id)
            return True
            
    except Exception as e:
        logger.error("Error ensuring session exists: %s", e)
        return False
