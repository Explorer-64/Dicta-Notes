


# src/app/libs/transcription_processing.py
# Core transcription processing logic extracted from transcription API
import base64
import logging
import uuid
import tempfile
import os
import time
from typing import Dict, Any, Optional, List

from app.libs.storage_manager import put_binary, put_json as storage_put_json
from app.libs.secret_manager import get_secret
from pydub import AudioSegment
from fastapi import HTTPException
import firebase_admin
from firebase_admin import credentials, firestore

# Import utility modules
from app.apis.gemini_client import get_gemini_client
from app.apis.audio_processing import sanitize_storage_key
from app.apis.gemini_json_parser import process_gemini_transcription_json
from app.apis.storage import upload_audio_to_firebase
from app.apis.models import TranscriptionResponse

logger = logging.getLogger("dicta.transcription_processing")

def process_transcription_request(
    audio_data_b64: str,
    filename: str,
    content_type: str,
    meeting_title: Optional[str] = None,
    participants: Optional[List[str]] = None,
    session_id: Optional[str] = None,
    recording_start_time: Optional[int] = None,
    user_id: str = "anonymous",
    # Additional metadata fields for fire-and-forget session saving
    client_name: Optional[str] = None,
    project_name: Optional[str] = None,
    tags: Optional[List[str]] = None,
    meeting_purpose: Optional[str] = None,
    language_preference: Optional[str] = None
) -> TranscriptionResponse:
    """Process a transcription request with Gemini
    
    Args:
        audio_data_b64: Base64 encoded audio data
        filename: Original filename
        content_type: Audio content type
        meeting_title: Optional meeting title (may contain speaker timeline data)
        participants: Optional list of participant names
        session_id: Optional session ID for live updates
        recording_start_time: Optional timestamp when recording started
        user_id: User ID from authentication
        client_name: Optional client name for session metadata
        project_name: Optional project name for session metadata
        tags: Optional tags for session metadata
        meeting_purpose: Optional meeting purpose for session metadata
        language_preference: Optional language preference for session metadata
        
    Returns:
        TranscriptionResponse: Processed transcription data
    """
    try:
        # Log received metadata for verification
        logger.info("Processing request with metadata:")
        logger.info(f"  - Meeting Title: {meeting_title}")
        logger.info(f"  - Client Name: {client_name}")
        logger.info(f"  - Project Name: {project_name}")
        logger.info(f"  - Tags: {tags}")
        logger.info(f"  - Meeting Purpose: {meeting_purpose}")
        logger.info(f"  - Language Preference: {language_preference}")
        logger.info(f"  - Participants: {participants}")
        logger.info(f"  - Session ID: {session_id}")
        logger.info(f"  - User ID: {user_id}")
        
        # Decode the base64 audio data
        try:
            # Handle data URLs (e.g., 'data:audio/webm;base64,XXXXX')
            if ',' in audio_data_b64:
                # This is a data URL, so split at the comma
                audio_data = base64.b64decode(audio_data_b64.split(',')[1])
            else:
                # This is raw base64, but make sure we have valid padding
                # Add padding if necessary
                padded_data = audio_data_b64
                padding_needed = len(padded_data) % 4
                if padding_needed:
                    padded_data += '=' * (4 - padding_needed)
                audio_data = base64.b64decode(padded_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 audio data: {str(e)}") from e
        
        # Generate a unique ID for this transcription
        transcription_id = str(uuid.uuid4())
        
        # Save audio both in Firebase Storage and databutton as fallback
        audio_filename = f"meeting_{transcription_id}.mp3"
        
        # Try to upload to Firebase Storage first
        firebase_result = None
        try:
            firebase_result = upload_audio_to_firebase(
                audio_data=audio_data,
                file_name=audio_filename,
                user_id=user_id,
                content_type='audio/mp3'
            )
            if firebase_result:
                logger.info(f"Audio uploaded to Firebase Storage: {firebase_result}")
        except Exception as firebase_error:
            logger.error("Error uploading to Firebase Storage: %s", firebase_error)
        
        # Save in databutton storage as fallback
        audio_key = sanitize_storage_key(f"audio_{transcription_id}")
        put_binary(audio_key, audio_data)
        logger.info(f"Audio saved with fallback key: {audio_key}, size: {len(audio_data)} bytes")
        
        # Calculate audio duration (rough approximation)
        audio_size_kb = len(audio_data) / 1024
        estimated_duration = max(10.0, audio_size_kb / 25)  # Rough estimate: ~25KB per second of audio
        
        # Convert webm to supported format if needed
        content_type = content_type.lower()
        supported_formats = ["audio/wav", "audio/mp3", "audio/aiff", "audio/aac", "audio/ogg", "audio/flac"]
        
        actual_duration = estimated_duration  # Default fallback
        
        if content_type not in supported_formats:
            logger.info(f"Converting audio format {content_type} to mp3 format...")
            try:
                # Create temporary files for conversion
                with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_input_file:
                    temp_input_path = temp_input_file.name
                    temp_input_file.write(audio_data)
                
                # Output path
                temp_output_path = temp_input_path.replace('.webm', '.mp3')
                
                # Convert using pydub and get actual duration
                audio = AudioSegment.from_file(temp_input_path, format="webm")
                actual_duration = len(audio) / 1000.0  # Convert milliseconds to seconds
                logger.info(f"Actual audio duration from pydub: {actual_duration:.2f} seconds")

                audio.export(temp_output_path, format="mp3")

                # Read the converted file
                with open(temp_output_path, 'rb') as f:
                    audio_data = f.read()

                # Update content type
                content_type = "audio/mp3"
                logger.info(f"Successfully converted to mp3 format, size: {len(audio_data) / 1024:.2f} KB")
                
                # Clean up temporary files
                try:
                    os.unlink(temp_input_path)
                    os.unlink(temp_output_path)
                except Exception as e:
                    logger.warning("Error cleaning up temp files: %s", e)
            except Exception as e:
                logger.warning("Failed to convert audio format: %s", e)
                logger.info("Using original audio data in its native format.")
                if content_type == "audio/webm":
                    content_type = "audio/mp3"  # Try with mp3 MIME type anyway
        else:
            # For supported formats, try to get duration with pydub
            try:
                with tempfile.NamedTemporaryFile(suffix=f'.{content_type.split("/")[1]}', delete=False) as temp_file:
                    temp_file.write(audio_data)
                    temp_file_path = temp_file.name
                
                audio = AudioSegment.from_file(temp_file_path)
                actual_duration = len(audio) / 1000.0  # Convert milliseconds to seconds
                logger.info(f"Actual audio duration from pydub: {actual_duration:.2f} seconds")

                # Clean up
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    logger.warning("Error cleaning up temp file: %s", e)
            except Exception as e:
                logger.warning("Could not determine audio duration with pydub: %s", e)
                logger.info(f"Using estimated duration: {estimated_duration:.2f} seconds")
        
        # Check if Gemini API key is available
        api_key = get_secret("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503, 
                detail="Gemini API key not configured. Please set up your GEMINI_API_KEY to enable transcription."
            )
        
        # Get Gemini model
        model = get_gemini_client("models/gemini-2.5-pro")
        
        # Format participant names for the prompt (if provided)
        participant_names = participants if participants else []
        participants_prompt = ""
        if participant_names and len(participant_names) > 0:
            participants_prompt = "\n\nIMPORTANT - Use these EXACT speaker names for identified voices:\n"
            for i, name in enumerate(participant_names):
                participants_prompt += f"- Voice {i+1}: {name}\n"
            participants_prompt += "\nWhen you detect different speakers, use these names in order of detection. If you detect more speakers than names provided, use generic names (Speaker 3, Speaker 4, etc.) for additional speakers.\n"
        
        # Create transcription prompt
        meeting_title = meeting_title or 'General Discussion'
        
        # Check if meeting_title contains speaker timeline data (added by frontend)
        speaker_timeline_info = ""
        if "SPEAKER TIMELINE" in meeting_title:
            # Extract the main title and speaker timeline separately
            parts = meeting_title.split("\n\nSPEAKER TIMELINE")
            meeting_title = parts[0].strip()
            if len(parts) > 1:
                speaker_timeline_info = "\n\nSPEAKER TIMELINE" + parts[1]
                logger.info("Found speaker timeline data in meeting title")
        
        transcription_prompt = f"""
You are a professional audio transcription system with speaker identification and language separation capabilities.

Please transcribe this audio recording and identify different speakers.

Meeting title: {meeting_title}
{speaker_timeline_info}

CRITICAL LANGUAGE SEPARATION INSTRUCTIONS:
1. NEVER mix different languages within the same segment
2. When a speaker switches languages mid-sentence or between sentences, create a NEW segment
3. Each segment must contain ONLY ONE language
4. Detect language changes at the sentence/phrase level, not just speaker level
5. Mark each segment with the appropriate language code ("en", "es", "fr", etc.)
6. If unsure about language, err on the side of creating separate segments

General Instructions:
1. Transcribe all speech accurately
2. Identify different speakers and assign them consistent names
3. If participant names are provided, use them: {participant_names}
   
   CRITICAL NAMING PROCESS:
   - LISTEN FOR SELF-INTRODUCTIONS: When someone says "My name is [Name]", "I'm [Name]", "Mi nombre es [Name]", "Me llamo [Name]", etc., IMMEDIATELY use that exact name for all their segments
   - LISTEN FOIR PERSON REFERENCED BY NAME: When someone says "Thnk you [Name]". "That was [Name]". "Up next is [Name]". etc...
   - OVERRIDE PROVIDED NAMES: If a speaker introduces themselves with a different name than provided in the participant list, use their self-introduced name
   - If speaker timeline data is provided above, use those timestamps to identify which voice belongs to which name
   - At the specified timestamps, listen carefully to identify the voice characteristics of each named speaker
   - Use these voice characteristics to consistently identify each speaker throughout the recording
   - MULTILINGUAL INTRODUCTIONS: Pay attention to self-introductions in any language:
     * English: "I'm", "My name is", "This is", "I am"
     * Spanish: "Me llamo", "Mi nombre es", "Soy"
     * French: "Je m'appelle", "Je suis"
     * Portuguese: "Meu nome é", "Eu sou"
     * German: "Ich bin", "Mein Name ist"
     * Italian: "Il mio nome è", "Sono"
     - Same for all languages.
   - EXAMPLE: If someone says "Hola, mi nombre es Carlos" but was previously labeled as "Speaker 1", immediately switch to using "Carlos" for all segments from that voice
   

4. Format as JSON with this structure:
{{
    "meeting_title": "{meeting_title}",
    "speakers": [
        {{"id": "s1", "name": "Speaker Name"}}
    ],
    "segments": [
        {{
            "speaker": {{"id": "s1", "name": "Speaker Name"}},
            "text": "What they said",
            "start_time": 0.0,
            "end_time": 5.0,
            "language": "en"
        }}
    ],
    "languages_detected": ["en"],
    "duration": {estimated_duration:.1f}
}}

EXAMPLE of proper language separation:
If someone says "Hello everyone, bienvenidos a la reunión", create TWO segments:
- Segment 1: "Hello everyone" (language: "en")
- Segment 2: "bienvenidos a la reunión" (language: "es")

IMPORTANT: Return only valid JSON, no extra text or markdown formatting.
        """

        # Convert audio data to base64 for Gemini API
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # Send to Gemini for processing
        logger.info(f"Sending audio to Gemini with content type {content_type}")
        try:
            # Use the working format from multilingual_processing endpoint
            response = model.generate_content(
                contents=[
                    {"role": "user", "parts": [
                        {"text": transcription_prompt},
                        {"inline_data": {"mime_type": content_type, "data": audio_base64}}
                    ]}
                ]
            )
        except Exception as e:
            logger.error("Gemini API error: %s", e)
            # Try fallback format if the new format fails
            try:
                logger.info("Trying fallback format...")
                response = model.generate_content([
                    transcription_prompt,
                    {
                        "mime_type": content_type,
                        "data": audio_base64
                    }
                ])
            except Exception as fallback_error:
                logger.error("Fallback format also failed: %s", fallback_error)
                raise HTTPException(status_code=500, detail=f"Error in transcription processing: {e}") from fallback_error
        
        # Get the raw transcription result from Gemini
        transcription_result = response.text
        logger.info("Successfully processed audio with Gemini 2.0")
        logger.debug("Raw Gemini response:")
        logger.debug(transcription_result)

        # Process the Gemini JSON response using the new helper function
        # Pass necessary audio storage details to the parser
        firebase_url = firebase_result.get("firebase_url") if firebase_result else None
        firebase_path = firebase_result.get("firebase_path") if firebase_result else None

        storage_data, api_response_model = process_gemini_transcription_json(
            gemini_response_text=transcription_result,
            original_audio_key=audio_key, # databutton storage key
            original_audio_url=firebase_url, # firebase storage public url
            firebase_audio_path=firebase_path, # firebase storage path (non-public)
            recording_start_time=recording_start_time,  # Pass recording start time for elapsed time calculation
            actual_audio_duration=actual_duration,  # Pass actual duration to override Gemini's estimate
            session_id=session_id  # Pass the request session_id to prevent mismatch
        )

        # Ensure the session_id from the parser is used for the storage key
        transcription_key = sanitize_storage_key(f"transcription_{api_response_model.session_id}")
        
        # Save the processed transcription data (which includes raw_gemini_response for debugging)
        storage_put_json(transcription_key, storage_data)
        logger.info(f"Processed transcription data saved with key: {transcription_key}")

        # --- BEGIN Firestore Live Segment Writing ---
        if session_id and api_response_model.segments:
            try:
                # Get Firestore client. Relies on Firebase Admin being initialized, 
                # typically via FIREBASE_SERVICE_ACCOUNT secret.
                db_firestore = firestore.client()
                logger.info(f"Session ID {session_id}: Writing {len(api_response_model.segments)} segments to Firestore live_transcript_segments.")
                
                for segment_data in api_response_model.segments:
                    segment_doc_ref = db_firestore.collection("sessions").document(session_id).collection("live_transcript_segments").document()
                    
                    firestore_segment_data = {
                        "text": segment_data.text,
                        "speaker": segment_data.speaker.name,  # Use standardized 'speaker' field
                        "speakerId": segment_data.speaker.id,  # Keep old field for backward compatibility
                        "language": segment_data.language,
                        "startTime": segment_data.start_time, 
                        "endTime": segment_data.end_time,     
                        "timestamp": firestore.SERVER_TIMESTAMP, 
                        "isFinal": True # Assuming segments from this endpoint are final for the processed chunk
                    }
                    segment_doc_ref.set(firestore_segment_data)
                    # print(f"Segment written to Firestore: sessions/{session_id}/live_transcript_segments/{segment_doc_ref.id}")
                logger.info(f"Successfully wrote {len(api_response_model.segments)} segments to Firestore for session {session_id}")
            except Exception as e:
                logger.error("Error writing live segments to Firestore for session %s: %s", session_id, e)
                # Depending on policy, you might want to raise an error or just log
        # --- END Firestore Live Segment Writing ---

        # --- BEGIN Firestore Session Saving ---
        # Save the complete session data to Firestore so it shows up in session list
        try:
            db_firestore = firestore.client()
            session_id_final = api_response_model.session_id
            
            # Prepare session data for Firestore
            session_data = {
                "id": session_id_final,
                "title": api_response_model.meeting_title,
                "full_text": api_response_model.full_text,
                "duration": int(api_response_model.duration or 0),
                "created_at": firestore.SERVER_TIMESTAMP,
                "userId": user_id,
                "companyId": None,
                "audio_key": api_response_model.audio_key,
                "transcript_id": transcription_key,
                "has_documents": False,
                # Add all the metadata fields collected from frontend
                "client_name": client_name,
                "project_name": project_name,
                "tags": tags or [],
                "meeting_purpose": meeting_purpose,
                "language_preference": language_preference,
                "speakers": [{
                    "id": speaker.id,
                    "name": speaker.name
                } for speaker in api_response_model.speakers],
                "segments": [{
                    "speaker": {
                        "id": segment.speaker.id,
                        "name": segment.speaker.name
                    },
                    "text": segment.text,
                    "language": segment.language,
                    "start_time": segment.start_time,
                    "end_time": segment.end_time,
                    "needs_translation": getattr(segment, 'needs_translation', False)
                } for segment in api_response_model.segments],
                "metadata": {
                    "hasAudio": True,
                    "hasTranscriptStorage": True,
                    "autoSaved": True,
                    "moduleFeatures": {},
                    "companyId": None
                }
            }
            
            # Save session to Firestore
            session_doc_ref = db_firestore.collection("sessions").document(session_id_final)
            session_doc_ref.set(session_data)
            logger.info(f"Successfully saved complete session {session_id_final} to Firestore with metadata: client='{client_name}', project='{project_name}', tags={tags}, purpose='{meeting_purpose}'")
            
        except Exception as e:
            logger.error("Error saving traditional transcription session to Firestore: %s", e)
            # Don't fail the entire request if Firestore save fails
        # --- END Firestore Session Saving ---

        return api_response_model
        
    except Exception as e:
        error_msg = f"Error in transcription processing: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg) from e
