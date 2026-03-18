import json
import logging
import re
import uuid
from datetime import datetime

logger = logging.getLogger("dicta.gemini_json_parser")
from typing import List, Dict, Any, Tuple, Optional

from fastapi import APIRouter, HTTPException
from app.libs.storage_manager import get_json as storage_get_json
from firebase_admin import firestore  # CORRECT IMPORT
from pydantic import BaseModel, ValidationError

from app.auth import AuthorizedUser

# Correctly initialize Firestore client and define router
try:
    db_firestore = firestore.client()  # CORRECT INITIALIZATION
except Exception as e:
    logger.error("Error initializing Firestore client: %s", e)
    db_firestore = None

router = APIRouter()

# --- Pydantic Models Definition ---
# Define all necessary models in one place to avoid NameErrors.

class Speaker(BaseModel):
    id: str
    name: str
    confidence: Optional[float] = None

class TranscriptionSegment(BaseModel):
    speaker: Speaker
    text: str
    language: str
    start_time: float
    end_time: float

class TranscriptionResponse(BaseModel):
    session_id: str
    speakers: List[Speaker]
    segments: List[TranscriptionSegment]
    full_text: str
    meeting_title: str
    languages_detected: List[str]
    duration: float
    audio_key: Optional[str] = None
    audio_url: Optional[str] = None
    timestamp: str

# --- Utility Functions ---

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def generate_full_text(segments: List[Dict[str, Any]]) -> str:
    """Generates a single string concatenating all transcribed text segments with speaker attribution."""
    full_text_parts = []
    for segment in segments:
        speaker_name = segment.get("speaker", {}).get("name", "Unknown")
        text = segment.get("text", "")
        full_text_parts.append(f"{speaker_name}: {text}")
    return "\n\n".join(full_text_parts)

# Helper checks for speaker naming
_GENERIC_RE = re.compile(r"^speaker\s*\d+\b", re.IGNORECASE)


def _is_unknown_name(name: str) -> bool:
    return name.strip().lower().startswith("unknown")


def _is_generic_label(name: str) -> bool:
    return bool(_GENERIC_RE.match(name.strip()))

# --- Core Processing Function ---

def process_gemini_transcription_json(
    gemini_response_text: str,
    original_audio_key: Optional[str] = None,
    original_audio_url: Optional[str] = None,
    firebase_audio_path: Optional[str] = None,
    recording_start_time: Optional[int] = None,
    actual_audio_duration: Optional[float] = None,
    session_id: Optional[str] = None
) -> Tuple[Dict[str, Any], TranscriptionResponse]:
    """
    Parses the JSON response from Gemini, extracts relevant transcription data,
    formats it for storage, and prepares the API response model.
    """
    try:
        # Clean the response text before parsing
        cleaned_text = gemini_response_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[len("```json"):]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-len("```")]
        cleaned_text = cleaned_text.strip()

        result_json = json.loads(cleaned_text)
    except json.JSONDecodeError as e:
        logger.error("Error decoding Gemini JSON response: %s", e)
        error_session_id = session_id or str(uuid.uuid4())
        timestamp_iso = datetime.now().isoformat()
        fallback_text = gemini_response_text
        
        # Create fallback response on error
        error_speaker = Speaker(id="s1", name="Error", confidence=None)
        error_segment = TranscriptionSegment(
            speaker=error_speaker,
            text="Error: Could not parse transcription data from Gemini.",
            language="unknown",
            start_time=0.0,
            end_time=0.0
        )
        storage_data = {
            "session_id": error_session_id, "speakers": [error_speaker.dict()],
            "segments": [error_segment.dict()], "full_text": f"Error... Raw output: {fallback_text}",
            "meeting_title": "Transcription Error", "languages_detected": ["unknown"],
            "timestamp": timestamp_iso, "duration": 0.0, "audio_key": original_audio_key,
            "audio_url": original_audio_url, "firebase_audio_path": firebase_audio_path,
            "raw_gemini_response": gemini_response_text
        }
        api_response = TranscriptionResponse(
            session_id=error_session_id, speakers=[error_speaker], segments=[error_segment],
            full_text=f"Error... Raw output: {fallback_text}", meeting_title="Transcription Error",
            languages_detected=["unknown"], duration=0.0, audio_key=original_audio_key,
            audio_url=original_audio_url, timestamp=timestamp_iso
        )
        return storage_data, api_response

    final_session_id = session_id or str(uuid.uuid4())
    parsed_speakers = result_json.get("speakers", [])
    raw_segments = result_json.get("segments", [])
    
    # Process speakers with new confidence score
    final_speakers: List[Speaker] = []
    for spk in parsed_speakers:
        final_speakers.append(
            Speaker(
                id=spk.get("id", "default_id"),
                name=spk.get("name", "Default Name"),
                confidence=spk.get("confidence")
            )
        )

    # Process segments with confidence thresholds mapping to Unknown where needed
    processed_segments: List[TranscriptionSegment] = []
    for seg in raw_segments:
        speaker_info = seg.get("speaker", {})
        name = speaker_info.get("name", "Unknown")
        spk_conf = speaker_info.get("confidence")

        # Determine if segment should be forced to Unknown
        force_unknown = False
        if _is_unknown_name(name):
            force_unknown = True
        else:
            if _is_generic_label(name):
                # Generic speaker consistency threshold
                if spk_conf is not None and float(spk_conf) < 0.65:
                    force_unknown = True
            else:
                # Named attribution threshold
                if spk_conf is not None and float(spk_conf) < 0.75:
                    force_unknown = True

        if force_unknown:
            speaker_obj = Speaker(id="unknown", name="Unknown", confidence=None)
        else:
            speaker_obj = Speaker(
                id=speaker_info.get("id", "unknown_id"),
                name=name,
                confidence=spk_conf,
            )

        processed_segments.append(
            TranscriptionSegment(
                speaker=speaker_obj,
                text=seg.get("text", ""),
                language=seg.get("language", "unknown"),
                start_time=float(seg.get("start_time", 0)),
                end_time=float(seg.get("end_time", 0))
            )
        )

    duration = float(actual_audio_duration if actual_audio_duration is not None else result_json.get("duration", 0.0))

    # Drift correction: Gemini counts audio sample frames; MediaRecorder WebM containers
    # use wall-clock timestamps. These diverge (e.g. Gemini sees 41s, browser plays 75s).
    # Scale all segment timestamps proportionally so they match the browser's audio timeline.
    if actual_audio_duration is not None and len(processed_segments) > 0:
        gemini_max_time = max(s.end_time for s in processed_segments)
        if gemini_max_time > 0:
            ratio = actual_audio_duration / gemini_max_time
            if ratio > 1.1:  # >10% discrepancy → apply correction
                logger.info(
                    "Applying timestamp drift correction: scale=%.3f (container=%.1fs, Gemini=%.1fs)",
                    ratio, actual_audio_duration, gemini_max_time,
                )
                processed_segments = [
                    TranscriptionSegment(
                        speaker=seg.speaker,
                        text=seg.text,
                        language=seg.language,
                        start_time=round(seg.start_time * ratio, 2),
                        end_time=round(seg.end_time * ratio, 2),
                    )
                    for seg in processed_segments
                ]

    full_transcribed_text = generate_full_text([s.dict() for s in processed_segments])
    timestamp_iso = datetime.now().isoformat()
    
    storage_data = {
        "session_id": final_session_id,
        "speakers": [s.dict() for s in final_speakers],
        "segments": [s.dict() for s in processed_segments],
        "full_text": full_transcribed_text,
        "meeting_title": result_json.get("meeting_title", "Meeting Transcription"),
        "languages_detected": result_json.get("languages_detected", []),
        "timestamp": timestamp_iso, "duration": duration, "audio_key": original_audio_key,
        "audio_url": original_audio_url, "firebase_audio_path": firebase_audio_path,
        "raw_gemini_response": gemini_response_text
    }

    api_response = TranscriptionResponse(
        session_id=final_session_id,
        speakers=final_speakers,
        segments=processed_segments,
        full_text=full_transcribed_text,
        meeting_title=result_json.get("meeting_title", "Meeting Transcription"),
        languages_detected=result_json.get("languages_detected", []),
        duration=duration, audio_key=original_audio_key,
        audio_url=original_audio_url, timestamp=timestamp_iso
    )

    return storage_data, api_response

# --- API Endpoints ---

@router.post("/save_segment_to_firestore", response_model=dict)
async def save_segment_to_firestore_api(
    session_id: str,
    segment: dict,
    user: AuthorizedUser,
):
    if not db_firestore:
        raise HTTPException(status_code=500, detail="Firestore client not initialized.")
    try:
        user_id = user.sub
        session_found = False
        is_authorized = False
        
        # First, try to check session ownership in main sessions collection
        try:
            session_ref = db_firestore.collection('sessions').document(session_id)
            session_doc = session_ref.get()
            
            if session_doc.exists:
                session_data = session_doc.to_dict()
                session_found = True
                
                # Verify session ownership
                if session_data.get("userId") == user_id:
                    is_authorized = True
                else:
                    raise HTTPException(status_code=403, detail="Not authorized to edit this session")
        except HTTPException:
            raise
        except Exception as firestore_error:
            logger.warning("Error checking session ownership in main collection: %s", firestore_error)
            # Continue to fallback check
        
        # Fallback: check in storage if not found/authorized in Firestore
        if not session_found or not is_authorized:
            try:
                from app.apis.helpers import get_session_key

                session_key = get_session_key(session_id)
                session_data = storage_get_json(session_key)
                
                if session_data:
                    session_found = True
                    
                    # Verify session ownership
                    if session_data.get("userId") == user_id:
                        is_authorized = True
                    else:
                        raise HTTPException(status_code=403, detail="Not authorized to edit this session")
            except HTTPException:
                raise
            except Exception as storage_error:
                logger.warning("Error checking session ownership in storage: %s", storage_error)
        
        # Final authorization check
        if not session_found:
            raise HTTPException(status_code=404, detail=f"Session with ID {session_id} not found")
        
        if not is_authorized:
            raise HTTPException(status_code=403, detail="Not authorized to edit this session")
        
        # Update the segment in the main sessions collection (where the session actually exists)
        session_ref = db_firestore.collection("sessions").document(session_id)
        
        session_doc = session_ref.get()
        if not session_doc.exists:
            logger.warning("Session %s not found in main collection", session_id)
            raise HTTPException(status_code=404, detail="Session not found")

        current_segments = session_doc.to_dict().get("segments", [])
        
        # Find and update or append segment
        index_to_update = -1
        for i, s in enumerate(current_segments):
            if s.get("start_time") == segment.get("start_time"):
                index_to_update = i
                break
        
        if index_to_update != -1:
            current_segments[index_to_update] = segment
            session_ref.update({"segments": current_segments})
            message = "Segment updated successfully"
        else:
            session_ref.update({"segments": firestore.ArrayUnion([segment])})
            message = "Segment added successfully"
            
        logger.info("%s in session %s for user %s", message, session_id, user_id)
        return {"status": "success", "message": message}

    except Exception as e:
        logger.error("Error updating segment in session %s: %s", session_id, e)
        raise HTTPException(status_code=500, detail=str(e)) from e
