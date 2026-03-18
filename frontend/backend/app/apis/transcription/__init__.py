import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request, Depends

logger = logging.getLogger("dicta.transcription")
from fastapi.responses import StreamingResponse
from app.apis.models import Speaker, TranscriptionSegment, TranscriptionResponse, TranscriptionRequest
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import json
from app.libs.storage_manager import put_json as storage_put_json, get_binary
from app.libs.secret_manager import get_secret
import base64
import io
import uuid
import time
from app.auth import AuthorizedUser
from app.apis.modules import module_access
from app.apis.gemini_client import get_gemini_client, get_gemini_list_models

# Import utility modules
from app.apis.audio_processing import sanitize_storage_key
from app.apis.helpers import get_current_user
from app.libs.transcription_processing import process_transcription_request

# Define user dependency
user_dependency = Depends(get_current_user)

router = APIRouter()


@router.post("/transcribe_audio")
def transcribe_audio(request: TranscriptionRequest, current_user: Dict[str, Any] = user_dependency) -> TranscriptionResponse:
    """Transcribe audio and differentiate between speakers using Gemini"""
    # Get user ID from authenticated token
    user_id = current_user.get("uid", "anonymous")
    
    # Call the library function with all the request parameters
    return process_transcription_request(
        audio_data_b64=request.audio_data,
        filename=request.filename,
        content_type=request.content_type,
        meeting_title=request.meeting_title,
        participants=request.participants,
        session_id=request.session_id,
        recording_start_time=request.recording_start_time,
        user_id=user_id,
        # Pass additional metadata fields for fire-and-forget session saving
        client_name=request.client_name,
        project_name=request.project_name,
        tags=request.tags,
        meeting_purpose=request.meeting_purpose,
        language_preference=request.language_preference
    )

@router.post("/upload_audio_file")
def upload_audio_file(
    file: UploadFile,
    meeting_title: Optional[str] = Form(None),
    participants: Optional[str] = Form(None),
    device_type: Optional[str] = Form(None),  # 'ios', 'android', etc
    browser_info: Optional[str] = Form(None),  # Browser details as JSON
    is_final: Optional[str] = Form(None)  # 'true' or 'false'
) -> TranscriptionResponse:
    """Upload and transcribe an audio file"""
    if file is None:
        file = File(...)
    
    try:
        # Add robust error handling and logging for mobile devices
        logger.info("Processing audio file upload: name=%s, content_type=%s", file.filename, file.content_type)
        logger.debug("Meeting title: %s, Participants: %s", meeting_title, participants)
        logger.debug("Device info - type: %s, is_final: %s", device_type, is_final)
        
        # Parse browser info if provided
        if browser_info:
            try:
                browser_data = json.loads(browser_info)
                logger.debug("Browser info: %s", browser_data)
            except json.JSONDecodeError:
                logger.warning("Received invalid browser_info: %s", browser_info)
        
        # Log content type for debugging mobile issues
        logger.debug("Original content-type: %s", file.content_type)
        
        try:
            # Read the uploaded file with error handling
            audio_data = file.file.read()
            logger.debug("Successfully read %d bytes from upload", len(audio_data))
            
            if len(audio_data) == 0:
                raise HTTPException(
                    status_code=400, 
                    detail="Uploaded file contains no data. Please check your microphone permissions and try again."
                )
                
        except Exception as read_error:
            logger.error("Error reading uploaded file: %s", str(read_error))
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid request. Could not read uploaded file: {str(read_error)}"
            ) from read_error
        
        # Convert to base64 for consistent handling
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # Parse participants if provided
        participant_list = []
        if participants:
            try:
                participant_list = json.loads(participants)
            except json.JSONDecodeError:
                # If not valid JSON, try comma-separated format
                participant_list = [p.strip() for p in participants.split(',')]
        
        # Determine the content type with better mobile handling 
        content_type = file.content_type
        
        # If no content type or generic binary type, use device info to make better guess
        if not content_type or content_type == "application/octet-stream":
            # iOS devices typically use MP4 container
            if device_type == "ios":
                content_type = "audio/mp4"
                logger.info("Detected iOS device, using audio/mp4 content type")
            # Try to guess from filename
            elif file.filename.endswith(".webm"):
                content_type = "audio/webm"
            elif file.filename.endswith(".mp4") or file.filename.endswith(".m4a"):
                content_type = "audio/mp4"
            elif file.filename.endswith(".wav"):
                content_type = "audio/wav"
            else:
                # Default for most mobile browsers
                content_type = "audio/webm"
                
        logger.debug("Using content type: %s", content_type)
                
        # Create the request object
        request = TranscriptionRequest(
            audio_data=audio_base64,
            filename=file.filename,
            content_type=content_type,
            meeting_title=meeting_title or "Mobile Recording",
            participants=participant_list
        )
        
        # Save debug info for mobile uploads to help with troubleshooting
        if device_type:
            debug_key = sanitize_storage_key(f"mobile_upload_debug_{int(time.time())}")
            storage_put_json(debug_key, {
                "timestamp": time.time(),
                "device_type": device_type,
                "browser_info": browser_info,
                "content_type": content_type,
                "original_content_type": file.content_type,
                "filename": file.filename,
                "file_size": len(audio_data),
                "is_final": is_final
            })
        
        # Process using the same transcription logic
        logger.debug("Sending audio data for transcription processing")
        try:
            # Use a slightly longer timeout for mobile processing
            return transcribe_audio(request)
        except HTTPException as http_ex:
            # Add more helpful error messages for common mobile issues
            if http_ex.status_code == 413:
                raise HTTPException(
                    status_code=413,
                    detail="Audio file too large. Try recording a shorter segment or adjust your microphone settings."
                ) from http_ex
            elif http_ex.status_code == 415:
                raise HTTPException(
                    status_code=415,
                    detail="Unsupported audio format. Try using Chrome on Android or Safari on iOS."
                ) from http_ex
            else:
                # Re-raise with original status code
                raise
        
    except HTTPException:
        # Re-raise HTTP exceptions as is
        raise
    except Exception as e:
        error_msg = f"Error processing audio file upload: {str(e)}"
        logger.error("%s", error_msg)
        # Use a 400 status for client errors that might be fixable
        raise HTTPException(
            status_code=400, 
            detail="Could not process audio. Please check your microphone permissions and try again."
        ) from e

# Add an endpoint for testing with sample audio data
@router.post("/test_identification")
def test_speaker_identification():
    """Test the speaker identification capabilities with sample data"""
    try:
        # Create a sample transcript in the exact format Gemini would return
        sample_transcript = """[00:00] Abe: Welcome everyone to our meeting today. We're going to discuss the quarterly results.

[00:06] Sarah: Thanks Abe. I've prepared the slides showing our performance metrics.

[00:11] Abe: Great, let's start by looking at revenue numbers first.

[00:16] Unknown Speaker: Excuse me, can everyone hear me okay? I'm calling in from the conference room.

[00:21] Sarah: Yes, we can hear you fine. Let me share the document with you as well."""
        
        # Generate a session ID
        session_id = str(uuid.uuid4())
        
        # Return a sample response matching our updated format
        return TranscriptionResponse(
            session_id=session_id,
            full_text=sample_transcript,
            meeting_title="Test Speaker Identification",
            duration=30.0,
            languages_detected=["en"], # Default to English
            # Include minimal segments/speakers for backward compatibility
            segments=[
                TranscriptionSegment(
                    speaker=Speaker(id="speaker_1", name="Abe"),
                    text="Welcome everyone to our meeting today. We're going to discuss the quarterly results.",
                    language="en",
                    start_time=0.0,
                    end_time=6.0
                ),
                TranscriptionSegment(
                    speaker=Speaker(id="speaker_2", name="Sarah"),
                    text="Thanks Abe. I've prepared the slides showing our performance metrics.",
                    language="en",
                    start_time=6.0,
                    end_time=11.0
                )
            ],
            speakers=[
                Speaker(id="speaker_1", name="Abe"),
                Speaker(id="speaker_2", name="Sarah")
            ]
        )
    except Exception as e:
        logger.error("Error in test endpoint: %s", e)
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}") from e

@router.get("/get_audio_file/{audio_key}", response_class=StreamingResponse, tags=["stream"])
def get_audio_file(audio_key: str, user: AuthorizedUser):
    """Get an audio file by key for playback with improved key handling"""
    try:
        # Import helper functions
        from app.apis.helpers import sanitize_storage_key, get_audio_key
        
        # Check if user has access to either the recording or audioPlayback feature
        user_id = user.sub
        recording_enabled = module_access.has_module_access(user_id, 'recording')
        audioPlayback_enabled = module_access.has_module_access(user_id, 'audioPlayback')
        
        if not (recording_enabled or audioPlayback_enabled):
            logger.warning("Neither recording nor audio playback module enabled for user %s", user_id)
            raise HTTPException(status_code=403, detail="Audio playback requires either Recording or Audio Playback module")
        
        # Standardize key format - always ensure proper prefix
        sanitized_key = sanitize_storage_key(audio_key)
        
        # Try multiple key formats in a consistent order
        possible_keys = [
            sanitized_key,  # Try direct key first
            get_audio_key(sanitized_key)  # Try with audio_ prefix using helper
        ]
        
        # If the key already has audio_ prefix, add another variation without it
        if sanitized_key.startswith('audio_'):
            possible_keys.append(sanitize_storage_key(sanitized_key[6:]))
            
        # Log what we're attempting
        logger.debug("Attempting to retrieve audio with keys: %s", possible_keys)
        
        # Try each key in sequence
        audio_data = None
        used_key = None
        
        for key in possible_keys:
            try:
                audio_data = get_binary(key)
                if audio_data:
                    used_key = key
                    logger.debug("Successfully retrieved audio with key: %s, size: %d bytes", used_key, len(audio_data))
                    break
            except Exception as e:
                logger.debug("Attempt with key %s failed: %s", key, e)
                continue
        
        if not audio_data:
            raise FileNotFoundError(f"Audio file not found with any attempted keys: {possible_keys}")
        
        # Determine content type based on key suffix
        content_type = "audio/mpeg"  # Default to mp3
        if used_key.endswith('.webm'):
            content_type = 'audio/webm'
        elif used_key.endswith('.wav'):
            content_type = 'audio/wav'
            
        # Return the audio file as a streaming response with proper headers
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={used_key}.mp3",
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
                "X-Audio-Key": used_key,  # Include key in headers for debugging
                "X-Content-Type-Options": "nosniff"  # Prevent MIME type sniffing
            }
        )
    except Exception as e:
        logger.error("Error retrieving audio with key %s: %s", audio_key, str(e))
        raise HTTPException(status_code=404, detail=f"Audio file not found: {str(e)}") from e


@router.get("/test_configuration")
def test_configuration():
    """Test the transcription API configuration"""
    results = {
        "status": "checking",
        "api_configuration": {
            "found": False,
            "test_result": None,
            "error": None
        },
        "models_available": [],
        "service_mode": "initializing"
    }

    # Check for API key
    try:
        api_key = get_secret("GEMINI_API_KEY")
    except Exception:
        api_key = None
    if api_key:
        results["api_configuration"]["found"] = True
        
        # Test Gemini API
        try:
            models = get_gemini_list_models()

            # Filter for Gemini models
            gemini_models = [model.name for model in models if "gemini" in model.name.lower()]
            results["models_available"] = gemini_models
            
            # Try using a model
            test_models = [
                "models/gemini-2.0-flash",
                "gemini-2.0-flash",
            ]
            
            success = False
            for test_model in test_models:
                try:
                    if test_model in gemini_models or (not test_model.startswith("models/") and f"models/{test_model}" in gemini_models):
                        model = get_gemini_client(test_model)
                        response = model.generate_content("Test message from DictaNotes.")
                        results["api_configuration"]["test_result"] = "success"
                        results["api_configuration"]["working_model"] = test_model
                        results["api_configuration"]["sample_output"] = response.text[:50] + "..." if len(response.text) > 50 else response.text
                        results["service_mode"] = "gemini"
                        results["status"] = "ok"
                        success = True
                        break
                except Exception as model_err:
                    logger.debug("Error testing %s: %s", test_model, str(model_err))
            
            if not success:
                results["api_configuration"]["test_result"] = "partial"
                results["api_configuration"]["note"] = "API enabled but no compatible models found"
                results["service_mode"] = "unavailable"
                results["status"] = "warning"
                
        except Exception as e:
            results["api_configuration"]["test_result"] = "partial"
            results["api_configuration"]["error"] = str(e)
            results["service_mode"] = "unavailable"
            results["status"] = "warning"
    else:
        results["api_configuration"]["test_result"] = "failed"
        results["api_configuration"]["error"] = "No API key found"
        results["service_mode"] = "simulated"
        results["status"] = "error"

    return results

