import base64
import io
import re
from fastapi import APIRouter, HTTPException
from app.libs.storage_manager import put_binary, get_binary
from typing import Optional, Tuple
import logging

logger = logging.getLogger("dicta.audio_processing")

# Create router
router = APIRouter()

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def decode_base64_audio(audio_data: str) -> bytes:
    """Decode base64 encoded audio data"""
    try:
        # Remove data URL prefix if present
        if audio_data.startswith('data:'):
            # Extract the base64 part
            audio_data = audio_data.split(',')[1]
        
        # Decode base64
        audio_bytes = base64.b64decode(audio_data)
        return audio_bytes
    except Exception as e:
        logger.error(f"Error decoding base64 audio: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid audio data format: {e}") from e

def store_audio_file(audio_bytes: bytes, filename: str, session_id: Optional[str] = None) -> str:
    """Store audio file in Databutton storage and return the key"""
    try:
        # Create a storage key based on filename and session ID if provided
        if session_id:
            key = f"audio_{sanitize_storage_key(session_id)}_{sanitize_storage_key(filename)}"
        else:
            key = f"audio_{sanitize_storage_key(filename)}"
            
        # Store the audio file
        put_binary(key, audio_bytes)
        logger.info(f"Stored audio file with key: {key}")
        return key
    except Exception as e:
        logger.error(f"Error storing audio file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to store audio file: {e}") from e

def get_audio_file(key: str) -> Tuple[bytes, str]:
    """Retrieve audio file from Databutton storage"""
    try:
        # Sanitize the key before using it
        safe_key = sanitize_storage_key(key)
        
        # Get the audio file
        audio_bytes = get_binary(safe_key)
        if audio_bytes is None:
            raise FileNotFoundError(f"Audio file not found: {safe_key}")

        # Determine content type based on key suffix
        if safe_key.endswith('.webm'):
            content_type = 'audio/webm'
        elif safe_key.endswith('.mp3'):
            content_type = 'audio/mp3'
        elif safe_key.endswith('.wav'):
            content_type = 'audio/wav'
        else:
            content_type = 'audio/webm'  # Default to webm
            
        return audio_bytes, content_type
    except Exception as e:
        logger.error(f"Error retrieving audio file: {e}")
        raise HTTPException(status_code=404, detail=f"Audio file not found: {e}") from e

def process_audio_content(audio_data: str, filename: str, content_type: str) -> bytes:
    """Process audio content from request"""
    # Check if the audio is base64 encoded
    try:
        if isinstance(audio_data, str) and (
            audio_data.startswith('data:') or 
            len(audio_data) > 100 and all(c in '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/=' for c in audio_data)
        ):
            # Decode base64 audio data
            audio_bytes = decode_base64_audio(audio_data)
        else:
            # Not base64, treat as raw string data
            audio_bytes = audio_data.encode('utf-8')
            
        return audio_bytes
    except Exception as e:
        logger.error(f"Error processing audio content: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process audio content: {e}") from e
