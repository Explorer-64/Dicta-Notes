import logging
from firebase_admin import firestore
from app.apis.firebase import get_firestore_db

logger = logging.getLogger("dicta.reprocess")
from app.apis.helpers import get_current_user, get_session_key
from typing import Dict, List
from app.libs.storage_manager import get_json as storage_get_json, put_json as storage_put_json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

# --- Pydantic Models ---
class Speaker(BaseModel):
    id: str
    name: str

class UpdateSpeakerNamesRequest(BaseModel):
    speaker_mappings: Dict[str, str]

class UpdateSpeakerNamesResponse(BaseModel):
    success: bool
    session_id: str
    message: str
    updated_speakers: List[Speaker]

# --- API Router ---
router = APIRouter(prefix="/reprocess", tags=["Reprocessing"])
user_dependency = Depends(get_current_user)

# --- Endpoint ---
@router.put("/update-speakers/{session_id}", response_model=UpdateSpeakerNamesResponse)
def update_speaker_names(
    session_id: str,
    request: UpdateSpeakerNamesRequest,
    current_user: dict = user_dependency,
) -> UpdateSpeakerNamesResponse:
    """Update speaker names in a session transcript using Gemini re-processing"""
    try:
        user_id = current_user.get("uid")
        
        # Retrieve session data
        session_data = None
        using_firestore = False
        
        # Try Firestore first
        firestore_db = get_firestore_db()
        if firestore_db:
            try:
                doc_ref = firestore_db.collection('sessions').document(session_id)
                session_doc = doc_ref.get()
                
                if session_doc.exists:
                    session_data = session_doc.to_dict()
                    using_firestore = True
                    
                    # Security check
                    if session_data.get("userId") != user_id:
                        raise HTTPException(status_code=403, detail="Not authorized to modify this session")
            except HTTPException:
                raise
            except Exception as firestore_error:
                logger.warning("Error accessing Firestore: %s", firestore_error)
        
        # Fallback to storage if not found in Firestore
        if not session_data:
            try:
                session_key = get_session_key(session_id)
                session_data = storage_get_json(session_key)
                
                if not session_data:
                    raise HTTPException(status_code=404, detail=f"Session with ID {session_id} not found")
                
                # Security check
                if session_data.get("userId") != user_id:
                    raise HTTPException(status_code=403, detail="Not authorized to modify this session")
            except HTTPException:
                raise
            except Exception as storage_error:
                logger.warning("Error retrieving session from storage: %s", storage_error)
                raise HTTPException(status_code=404, detail=f"Session with ID {session_id} not found")
        
        # Get the current transcript
        full_text = session_data.get("full_text")
        if not full_text:
            raise HTTPException(status_code=400, detail="Session has no transcript to update")
        
        # Simple string replacement for speaker names
        updated_transcript = full_text
        for old_name, new_name in request.speaker_mappings.items():
            updated_transcript = updated_transcript.replace(old_name, new_name)
        
        # Update speakers list with new names
        updated_speakers = []
        current_speakers = session_data.get("speakers", [])
        
        for speaker in current_speakers:
            if isinstance(speaker, dict):
                speaker_name = speaker.get("name", "")
                new_name = request.speaker_mappings.get(speaker_name, speaker_name)
                updated_speakers.append({
                    "id": speaker.get("id", ""),
                    "name": new_name
                })
            else:
                # Handle Speaker object if it's already instantiated
                new_name = request.speaker_mappings.get(speaker.name, speaker.name)
                updated_speakers.append({
                    "id": speaker.id,
                    "name": new_name
                })
        
        # Update segments with new speaker names
        updated_segments = []
        current_segments = session_data.get("segments", [])
        
        for segment in current_segments:
            if isinstance(segment, dict):
                speaker_info = segment.get("speaker", {})
                if isinstance(speaker_info, dict):
                    old_speaker_name = speaker_info.get("name", "")
                    new_speaker_name = request.speaker_mappings.get(old_speaker_name, old_speaker_name)
                    
                    updated_segment = segment.copy()
                    updated_segment["speaker"] = {
                        "id": speaker_info.get("id", ""),
                        "name": new_speaker_name
                    }
                    updated_segments.append(updated_segment)
                else:
                    updated_segments.append(segment)
            else:
                # Handle TranscriptionSegment object
                old_speaker_name = segment.speaker.name
                new_speaker_name = request.speaker_mappings.get(old_speaker_name, old_speaker_name)
                
                updated_segment = segment.dict()
                updated_segment["speaker"]["name"] = new_speaker_name
                updated_segments.append(updated_segment)
        
        # Update session data
        session_data["full_text"] = updated_transcript
        session_data["speakers"] = updated_speakers
        session_data["segments"] = updated_segments
        
        # Save updated session
        if using_firestore:
            firestore_db.collection('sessions').document(session_id).update({
                "full_text": updated_transcript,
                "speakers": updated_speakers,
                "segments": updated_segments
            })
        else:
            session_key = get_session_key(session_id)
            storage_put_json(session_key, session_data)
            
            # Try to update Firestore as well if available
            if firestore_db:
                try:
                    firestore_db.collection('sessions').document(session_id).set(session_data)
                except Exception as migration_error:
                    logger.warning("Failed to sync updated session to Firestore: %s", migration_error)
        
        # Convert updated speakers to Speaker objects for response
        speaker_objects = [Speaker(id=s["id"], name=s["name"]) for s in updated_speakers]
        
        return UpdateSpeakerNamesResponse(
            success=True,
            session_id=session_id,
            updated_speakers=speaker_objects,
            message="Speaker names updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating speaker names: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to update speaker names: {str(e)}") from e
