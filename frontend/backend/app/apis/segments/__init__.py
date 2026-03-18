
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.apis.firebase import get_firestore_db
from app.auth import AuthorizedUser
import time
import logging
from firebase_admin import firestore

logger = logging.getLogger("dicta.segments")

# Router for segment management endpoints
router = APIRouter()

class SaveSegmentRequest(BaseModel):
    session_id: str
    text: str
    speaker: str  # Changed from speaker_id and speaker_name to single speaker field
    timestamp: int  # Unix timestamp in milliseconds
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    language: Optional[str] = None
    is_final: Optional[bool] = True

class SaveSegmentResponse(BaseModel):
    success: bool
    segment_id: Optional[str] = None
    message: str

@router.post("/save-segment", response_model=SaveSegmentResponse)
async def save_segment_to_firestore(request: SaveSegmentRequest, user: AuthorizedUser) -> SaveSegmentResponse:
    """Save a transcript segment to Firestore with proper authentication"""
    try:
        firestore_db = get_firestore_db()
        if not firestore_db:
            raise HTTPException(status_code=500, detail="Firestore not available")
        
        # Verify user has access to the session
        session_ref = firestore_db.collection('sessions').document(request.session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session_data = session_doc.to_dict()
        if session_data.get('userId') != user.sub:
            raise HTTPException(status_code=403, detail="Access denied to this session")
        
        # Create segment data with proper Firestore timestamp

        
        segment_data = {
            'text': request.text,
            'speaker': request.speaker,  # Now using single speaker field
            'timestamp': request.timestamp,
            'startTime': request.start_time,
            'endTime': request.end_time,
            'language': request.language,
            'isFinal': request.is_final,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'source': 'save-segment-api'  # Add source tracking for consistency
        }
        
        # Save to live_transcript_segments subcollection
        segments_collection = firestore_db.collection('sessions').document(request.session_id).collection('live_transcript_segments')
        doc_ref = segments_collection.add(segment_data)
        segment_id = doc_ref[1].id
        
        logger.info(f"Segment saved to Firestore with ID: {segment_id}")
        
        return SaveSegmentResponse(
            success=True,
            segment_id=segment_id,
            message="Segment saved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving segment to Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save segment: {str(e)}") from e
