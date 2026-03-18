import logging
from firebase_admin import firestore
from app.apis.helpers import get_current_user

logger = logging.getLogger("dicta.sessions_v2")
from app.apis.firebase import get_firestore_db
from app.apis.storage import upload_audio_to_firebase
from app.apis.gemini_client import get_gemini_client
import json
from app.libs.storage_manager import put_binary, get_binary
import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, File, Form, UploadFile, Depends, HTTPException
from pydantic import BaseModel, Field
from app.apis.speaker_identification import extract_speakers_from_transcript
from app.libs.audio_utils import process_uploaded_file, is_video_file


router = APIRouter()

# Define user dependency once at module level for FastAPI
user_dependency = Depends(get_current_user)

class SessionDetails(BaseModel):
    meeting_title: str = Field(alias='meetingTitle')
    participants: List[str]
    client_name: Optional[str] = Field(default=None, alias='clientName')
    project_name: Optional[str] = Field(default=None, alias='projectName')
    tags: Optional[List[str]] = None
    meeting_purpose: Optional[str] = Field(default=None, alias='meetingPurpose')

class SessionCreationResponse(BaseModel):
    session_id: str
    status: str
    message: str
    audio_url: Optional[str] = None
    firestore_path: Optional[str] = None

class TranscriptionRequest(BaseModel):
    session_id: str

class TranscriptionResponse(BaseModel):
    session_id: str
    status: str
    message: str
    transcript: Optional[str] = None
    summary: Optional[str] = None # Added summary field

@router.post("/upload_and_create_session", response_model=SessionCreationResponse, tags=["Sessions V2"])
async def upload_and_create_session(
    audio_file: UploadFile,
    session_details_json: str = Form(...),
    language_preference: Optional[str] = Form(None),
    user: dict = user_dependency, # Using module-level dependency
):
    """
    Upload audio or video file, create session in Firestore with 'pending_transcription' status.
    Video files will have their audio extracted automatically.
    This is the 'instant save' part of the on-demand architecture.
    """
    try:
        # 1. Parse session details
        session_details = SessionDetails.parse_raw(session_details_json)
        user_id = user.get('uid')
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # NEW GATING: Allow unlimited uploads for paid tiers. Free tier limited by session count only.
        from app.libs.tier_management import TierManager
        tier_manager = TierManager()
        try:
            tier_data = tier_manager.get_user_tier_data(user_id)
            user_tier = tier_data.get('tier', 'free')
        except Exception as e:
            logger.warning("Failed to get tier for %s, defaulting to FREE: %s", user_id, e)
            user_tier = 'free'
        
        # Get Firestore DB
        db_client = get_firestore_db()
        if not db_client:
            raise HTTPException(status_code=500, detail="Firestore not available")
        
        # Admin emails bypass free tier limits
        admin_emails = ["abereimer64@gmail.com", "dward@wevad.com", "dianareimer90@gmail.com"]
        user_email = user.get('email', '')

        if user_tier == 'free' and user_email not in admin_emails:
            # Enforce small session-count limit for Free only (no minutes gating here)
            try:
                sessions_ref = db_client.collection("sessions").where('userId', '==', user_id)
                session_count = len(list(sessions_ref.stream()))
            except Exception as e:
                logger.warning("Failed to count sessions for free user %s: %s", user_id, e)
                session_count = 0

            if session_count >= 3:
                logger.info("Free tier session limit reached for %s", user_id)
                raise HTTPException(
                    status_code=403,
                    detail="Free tier is limited to 3 sessions. Upgrade to Individual for unlimited uploads."
                )
        
        logger.debug("Sessions V2 upload allowed for %s (tier=%s)", user_id, user_tier)

        # 2. Read file data from the uploaded file
        file_data = await audio_file.read()
        original_filename = audio_file.filename or "uploaded_file"
        
        # 3. Process file - extract audio if video
        try:
            processed_data, content_type, was_video = process_uploaded_file(file_data, original_filename)
            
            if was_video:
                logger.info("Video file detected and processed: %s", original_filename)
                logger.debug("Original size: %.2f MB, Audio size: %.2f MB", len(file_data) / 1024 / 1024, len(processed_data) / 1024 / 1024)
            else:
                logger.info("Audio file uploaded: %s", original_filename)
                
            audio_data = processed_data
            
        except ValueError as ve:
            logger.warning("File validation error: %s", ve)
            raise HTTPException(status_code=400, detail=str(ve))
        except RuntimeError as re:
            logger.error("Audio extraction error: %s", re)
            raise HTTPException(status_code=500, detail="Failed to process video file. Please try a different format.")

        # 4. Upload audio using existing Firebase Storage function
        session_id = str(uuid.uuid4())
        file_name = f"v2_session_{session_id}.mp3"  # Always save as mp3 after processing
        
        firebase_result = None
        try:
            firebase_result = upload_audio_to_firebase(
                audio_data=audio_data,
                file_name=file_name,
                user_id=user_id,
                content_type=content_type
            )
            if firebase_result:
                logger.info("V2 Audio uploaded to Firebase Storage: %s", firebase_result)
                audio_url = firebase_result.get('firebase_url')
            else:
                audio_url = None
        except Exception as firebase_error:
            logger.warning("V2 Firebase upload failed, will use fallback: %s", firebase_error)
            audio_url = None

        # Fallback to Firebase Storage (via storage_manager) if upload_audio_to_firebase failed
        if not firebase_result:
            from app.apis.audio_processing import sanitize_storage_key
            audio_key = sanitize_storage_key(f"v2_audio_{session_id}")
            # put_binary returns a resolvable URL (https or gs://) so clients and transcribe can use it
            audio_url = put_binary(audio_key, audio_data)
            logger.info("V2 Audio saved to Firebase Storage with key: %s", audio_key)

        # 4. Create a new session document in Firestore
        
        # Step 3: Parse duration from tags array if present
        duration_seconds = None
        if session_details.tags:
            for tag in session_details.tags:
                if tag.startswith('duration:'):
                    try:
                        duration_seconds = int(tag.split(':', 1)[1])
                        logger.debug("Parsed duration from tags: %d seconds", duration_seconds)
                        break
                    except (ValueError, IndexError) as e:
                        logger.warning("Failed to parse duration from tag %s: %s", tag, e)
        
        session_data = {
            "session_id": session_id,
            "userId": user_id,
            "title": session_details.meeting_title or "Untitled Meeting",
            "meeting_title": session_details.meeting_title or "Untitled Meeting",
            "participants": session_details.participants,
            "client_name": session_details.client_name,
            "project_name": session_details.project_name,
            "tags": session_details.tags or [],
            "meeting_purpose": session_details.meeting_purpose,
            "language_preference": language_preference,
            "duration": duration_seconds,  # Store duration as proper field
            "audio_url": audio_url,
            "audio_storage_type": "firebase",
            "content_type": content_type, 
            "status": "pending_transcription",
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        
        # Store in Firestore
        doc_ref = db_client.collection("sessions").document(session_id)
        doc_ref.set(session_data)
        firestore_path = f"sessions/{session_id}"
        
        logger.info("V2 Session created in Firestore: %s", firestore_path)
        
        return SessionCreationResponse(
            session_id=session_id,
            status="success",
            message="Session created successfully, audio saved. Ready for on-demand transcription.",
            audio_url=audio_url,
            firestore_path=firestore_path
        )
        
    except HTTPException:
        # Re-raise HTTPExceptions with their original status codes
        raise
    except Exception as e:
        logger.error("Error in upload_and_create_session: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}") from e

@router.post("/{session_id}/transcribe", response_model=TranscriptionResponse, tags=["Sessions V2"])
async def transcribe_session(
    session_id: str,
    user: dict = user_dependency, # Using module-level dependency
):
    """
    On-demand transcription endpoint. Fetches audio from storage, transcribes with Gemini,
    and updates the session with the transcript.
    """
    try:
        user_id = user.get('uid')
        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # Get Firestore DB
        db_client = get_firestore_db()
        if not db_client:
            raise HTTPException(status_code=500, detail="Firestore not available")
        
        # 1. Get session from Firestore
        doc_ref = db_client.collection("sessions").document(session_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session_data = doc.to_dict()
        
        # Verify user owns this session
        if session_data.get('userId') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Retrieve content_type from session data. Provide a sensible default.
        # RENAME the variable here to avoid confusion with the previous function's local var.
        retrieved_content_type = session_data.get('content_type', 'audio/webm')
        
        # Check if already transcribed
        if session_data.get('status') == 'completed':
            return TranscriptionResponse(
                session_id=session_id,
                status="already_completed",
                transcript=session_data.get('full_text', ''), # Assuming full_text holds the main transcript
                summary=session_data.get('summary', ''), # Assuming summary might be stored
                message="Session already transcribed"
            )
        
        # 2. Get audio from storage (resolvable URL or legacy key reference)
        audio_url = session_data.get('audio_url')
        audio_storage_type = session_data.get('audio_storage_type', 'firebase')

        if not audio_url:
            raise HTTPException(status_code=400, detail="No audio URL found for session")

        # Resolve to bytes: https, gs://, or legacy databutton://storage/key
        audio_data = None
        if audio_url.startswith('https://') or audio_url.startswith('http://'):
            try:
                import httpx
                with httpx.Client(timeout=60.0) as client:
                    r = client.get(audio_url)
                    r.raise_for_status()
                    audio_data = r.content
                logger.debug("Retrieved audio from URL (%d bytes)", len(audio_data))
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"Failed to fetch audio URL: {str(e)}") from e
        elif audio_url.startswith('gs://'):
            from urllib.parse import urlparse
            parsed = urlparse(audio_url)
            storage_key = parsed.path.lstrip('/')
            try:
                audio_data = get_binary(storage_key)
                if not audio_data:
                    raise FileNotFoundError(f"Audio not found: {storage_key}")
                logger.debug("Retrieved audio from Firebase Storage: %s (%d bytes)", storage_key, len(audio_data))
            except Exception as e:
                raise HTTPException(status_code=404, detail=f"Audio file not found in storage: {str(e)}") from e
        elif audio_url.startswith('databutton://storage/'):
            # Legacy: key reference (won't resolve on Firebase; kept for old records)
            storage_key = audio_url.replace('databutton://storage/', '')
            try:
                audio_data = get_binary(storage_key)
                if not audio_data:
                    raise FileNotFoundError(f"Audio not found: {storage_key}")
                logger.debug("Retrieved audio from storage (legacy key): %s (%d bytes)", storage_key, len(audio_data))
            except Exception as e:
                raise HTTPException(status_code=404, detail=f"Audio file not found in storage: {str(e)}") from e
        else:
            # Assume raw storage key (e.g. v2_audio_<id>)
            try:
                audio_data = get_binary(audio_url)
                if not audio_data:
                    raise FileNotFoundError(f"Audio not found: {audio_url}")
                logger.debug("Retrieved audio by key: %s (%d bytes)", audio_url, len(audio_data))
            except Exception as e:
                raise HTTPException(status_code=404, detail=f"Audio file not found in storage: {str(e)}") from e
        
        if not audio_data:
            raise HTTPException(status_code=404, detail="Audio file not found in any storage")
        
        # 3. Transcribe with Gemini (using existing logic from V1)
        # Removed unused import base64
        # Removed unused audio_b64
        
        # Get Gemini model
        model = get_gemini_client("models/gemini-2.5-pro")
        
        # --- STEP 1: Get Raw Transcription (Audio-to-Text) ---
        raw_transcription_prompt = "You are an expert transcriptionist. Transcribe the provided audio file accurately. Provide only the raw text of what is spoken."
        
        audio_part = {"inline_data": {"mime_type": retrieved_content_type, "data": audio_data}}

        try:
            # First call: Get the raw, unlabeled transcript
            raw_response = model.generate_content([raw_transcription_prompt, audio_part])
            raw_transcript_text = raw_response.text

            if not raw_transcript_text:
                raise ValueError("The initial transcription returned an empty result.")
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Step 1 (Audio-to-Text) failed: {str(e)}") from e

        # --- STEP 2: Identify Speakers using internal library ---
        speakers = extract_speakers_from_transcript(raw_transcript_text)
        
        # Generate a placeholder summary. A real summary can be a separate feature.
        summary = " ".join(raw_transcript_text.split()[:50]) + "..."
        full_text = raw_transcript_text

        # Estimate duration based on audio file size (rough approximation for now)
        # A more accurate method could be implemented later if needed.
        # WebM audio typically has bitrate around 64-128 kbps.
        estimated_duration = len(audio_data) / (16 * 1024)  # Rough estimate in seconds for 128 kbps
        duration = max(estimated_duration, 0.0)
        logger.debug("V2 Session %s: Using estimated duration %.2fs", session_id, duration)

        # Update session in Firestore with transcript and root-level fields for compatibility
        doc_ref.update({
            "transcript": full_text,
            "full_text": full_text,
            "speakers": speakers,
            "segments": [],  # Keeping for schema compatibility; can be populated later
            "duration": duration,
            "summary": summary,
            "status": "completed",
            "transcribed_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        })

        logger.info("V2 Session %s transcribed and updated using internal speaker identification", session_id)

        return TranscriptionResponse(
            session_id=session_id,
            status="success",
            message="Transcription completed successfully",
            transcript=full_text,
            summary=summary
        )

    except HTTPException:
        raise
    except Exception as e:
        # This will now catch errors from the first Gemini call or speaker extraction
        logger.error("Error in transcribe_session: %s", e)
        # Update status to show transcription failed
        doc_ref.update({
            "status": "transcription_failed",
            "error_message": str(e),
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        raise HTTPException(status_code=500, detail=f"Failed to transcribe session: {str(e)}") from e
