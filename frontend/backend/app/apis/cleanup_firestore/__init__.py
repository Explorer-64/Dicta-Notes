from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.apis.helpers import get_current_user
from app.apis.firebase import get_firestore_db
import logging

logger = logging.getLogger("dicta.cleanup_firestore")

router = APIRouter()

@router.post("/cleanup_firestore_sessions")
def cleanup_firestore_sessions(dry_run: bool = True, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete all sessions from Firestore - use with caution!"""
    try:
        firestore_db = get_firestore_db()
        if not firestore_db:
            raise HTTPException(status_code=500, detail="Firestore not available")
        
        # Get all sessions
        sessions_ref = firestore_db.collection('sessions')
        sessions = list(sessions_ref.stream())
        
        session_count = len(sessions)
        logger.info(f"Found {session_count} sessions in Firestore")
        
        if dry_run:
            # Just report what would be deleted
            sessions_with_docs = 0
            for session in sessions:
                session_data = session.to_dict()
                if session_data.get('documents'):
                    sessions_with_docs += 1
            
            return {
                "dry_run": True,
                "total_sessions": session_count,
                "sessions_with_documents": sessions_with_docs,
                "message": f"Would delete {session_count} sessions"
            }
        else:
            # Actually delete them
            deleted_count = 0
            
            # Delete in batches to avoid timeouts
            batch_size = 50
            for i in range(0, len(sessions), batch_size):
                batch = firestore_db.batch()
                batch_sessions = sessions[i:i + batch_size]
                
                for session in batch_sessions:
                    batch.delete(session.reference)
                    deleted_count += 1
                
                batch.commit()
                logger.info(f"Deleted batch {i//batch_size + 1}: {len(batch_sessions)} sessions")
            
            return {
                "dry_run": False,
                "deleted_sessions": deleted_count,
                "message": f"Successfully deleted {deleted_count} sessions from Firestore"
            }
            
    except Exception as e:
        logger.error(f"Error cleaning up Firestore sessions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup sessions: {str(e)}") from e

@router.get("/firestore_stats")
def get_firestore_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get statistics about Firestore sessions"""
    try:
        firestore_db = get_firestore_db()
        if not firestore_db:
            return {"error": "Firestore not available"}
        
        # Get all sessions
        sessions_ref = firestore_db.collection('sessions')
        sessions = list(sessions_ref.stream())
        
        session_count = len(sessions)
        sessions_with_docs = 0
        total_doc_count = 0
        
        for session in sessions:
            session_data = session.to_dict()
            if session_data.get('documents'):
                sessions_with_docs += 1
                total_doc_count += len(session_data['documents'])
        
        return {
            "total_sessions": session_count,
            "sessions_with_documents": sessions_with_docs,
            "total_documents": total_doc_count
        }
        
    except Exception as e:
        logger.error(f"Error getting Firestore stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}") from e
