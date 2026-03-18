



# This file has leached it's max length
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
logger = logging.getLogger("dicta.transcribe_chunk")
from app.libs.secret_manager import get_secret
from app.apis.gemini_client import get_gemini_client
import base64
import re
import struct
import asyncio
import time
from typing import Dict, Any, Optional

from app.auth import AuthorizedUser
from app.libs.unified_prompt import get_unified_transcription_translation_prompt
from app.libs.noise_filter import get_noise_filter
# Add imports for Firestore integration
from app.apis.firebase import get_firestore_db
from datetime import datetime
import json

router = APIRouter()

# In-memory cache for processed chunks (prevents stutter effect)
processed_chunks: Dict[str, Any] = {}

# Rate limiting tracking
rate_limit_state = {
    "requests_count": 0,
    "window_start": time.time(),
    "window_size": 60,  # 1 minute
    "max_requests": 50  # Conservative limit
}

class TranscribeChunkRequest(BaseModel):
    audio_base64: str
    session_id: str
    target_language: str
    chunk_id: str
    locale_hint: str | None = None
    participants: list[str] | None = None  # Add participants support like traditional transcription
    skip_firestore: bool = False  # NEW: Allow caller to prevent Firestore save to avoid duplicates

class TranscribeChunkResponse(BaseModel):
    success: bool
    chunk_id: str
    message: str | None = None
    transcription: str | None = None
    speaker: str | None = None
    translation: str | None = None

class RetryableError(Exception):
    """Exception that indicates the operation should be retried"""
    pass

class PermanentError(Exception):
    """Exception that indicates the operation should not be retried"""
    pass

def is_rate_limited() -> bool:
    """Check if we're hitting rate limits"""
    current_time = time.time()
    
    # Reset window if needed
    if current_time - rate_limit_state["window_start"] > rate_limit_state["window_size"]:
        rate_limit_state["window_start"] = current_time
        rate_limit_state["requests_count"] = 0
    
    return rate_limit_state["requests_count"] >= rate_limit_state["max_requests"]

def increment_request_count():
    """Increment the request counter"""
    rate_limit_state["requests_count"] += 1

async def retry_with_exponential_backoff(func, max_retries: int = 3, base_delay: float = 1.0):
    """
    Retry function with exponential backoff for transient failures only.
    Prevents stutter effect by not retrying successful "no speech detected" responses.
    """
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return await func()
        except RetryableError as e:
            last_exception = e
            if attempt < max_retries - 1:  # Don't sleep on last attempt
                delay = base_delay * (2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
                logger.info("Retrying in %ss (attempt %d/%d): %s", delay, attempt + 1, max_retries, str(e))
                await asyncio.sleep(delay)
            else:
                logger.warning("Max retries reached for: %s", str(e))
        except PermanentError as e:
            logger.warning("Permanent error, not retrying: %s", str(e))
            raise e
        except Exception as e:
            # Unknown error - treat as permanent to avoid infinite loops
            logger.warning("Unknown error, not retrying: %s", str(e))
            raise PermanentError(f"Unknown error: {str(e)}") from e
    
    # If we get here, all retries failed
    raise last_exception

def create_wav_from_pcm(pcm_data: bytes, sample_rate: int = 16000, channels: int = 1, bit_depth: int = 16) -> bytes:
    """
    Create a proper WAV file from raw PCM data
    This ensures Gemini receives correctly formatted audio
    """
    # Calculate WAV header parameters
    byte_rate = sample_rate * channels * bit_depth // 8
    block_align = channels * bit_depth // 8
    data_size = len(pcm_data)
    total_size = 36 + data_size
    
    # Create WAV header
    wav_header = struct.pack('<4sI4s4sIHHIIHH4sI',
        b'RIFF',           # Chunk ID
        total_size,        # Chunk Size
        b'WAVE',           # Format
        b'fmt ',           # Sub-chunk 1 ID
        16,                # Sub-chunk 1 Size (16 for PCM)
        1,                 # Audio Format (1 for PCM)
        channels,          # Number of Channels
        sample_rate,       # Sample Rate
        byte_rate,         # Byte Rate
        block_align,       # Block Align
        bit_depth,         # Bits per Sample
        b'data',           # Sub-chunk 2 ID
        data_size          # Sub-chunk 2 Size
    )
    
    # Combine header and PCM data
    return wav_header + pcm_data

@router.post("/transcribe-chunk", response_model=TranscribeChunkResponse)
async def transcribe_chunk(request: TranscribeChunkRequest, user: AuthorizedUser) -> TranscribeChunkResponse:
    """
    Process audio chunk and get real-time transcription from Gemini.
    Replaces WebSocket streaming with HTTP POST for better reliability.
    Features anti-stutter logic and retry mechanisms.
    """
    
    # Phase 2: Check for duplicate chunks (prevents stutter effect)
    chunk_key = f"{request.session_id}:{request.chunk_id}"
    if chunk_key in processed_chunks:
        cached_result = processed_chunks[chunk_key]
        logger.debug("Returning cached result for duplicate chunk %s", request.chunk_id)
        return TranscribeChunkResponse(
            success=True,
            chunk_id=request.chunk_id,
            message="Cached result (duplicate chunk prevented)",
            transcription=cached_result.get('transcription'),
            speaker=cached_result.get('speaker'),
            translation=cached_result.get('translation')
        )
    
    # Phase 3: Rate limiting protection
    if is_rate_limited():
        logger.warning("Rate limit exceeded, queuing chunk %s", request.chunk_id)
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    increment_request_count()
    
    async def process_chunk_with_retries():
        """Inner function that handles the actual Gemini API call with retries"""
        try:
            # Get recent segments from this session for speaker context
            speaker_context = ""
            try:
                from app.apis.firebase import get_firestore_db
                firestore_db = get_firestore_db()
                
                # Get segments from this session for rolling context buffer  
                session_ref = firestore_db.collection('sessions').document(request.session_id)
                segments_ref = session_ref.collection('live_transcript_segments')
                
                # Get last 5 segments for context (simpler approach)
                recent_segments = segments_ref.order_by('timestamp', direction='DESCENDING').limit(5).get()
                
                if recent_segments:
                    context_lines = []
                    total_context_length = 0
                    
                    for doc in recent_segments:
                        data = doc.to_dict()
                        if data.get('speaker') and data.get('text'):
                            # Build context line with speaker and text
                            context_line = f"{data['speaker']}: {data['text']}"
                            context_lines.append(context_line)
                            total_context_length += len(context_line)
                            
                            # Limit total context to ~1000 characters to avoid prompt bloat
                            if total_context_length > 1000:
                                break
                    
                    if context_lines:
                        speaker_context = "\n\nROLLING 30-SECOND CONVERSATION CONTEXT (maintain speaker consistency and conversation flow):\n" + "\n".join(context_lines)
                        logger.debug("Using 30-second rolling context: %d segments, %d chars", len(context_lines), total_context_length)
                        
            except Exception as context_error:
                logger.warning("Could not fetch 30-second context: %s", context_error)
                # Fallback to simple last-3-segments approach
                try:
                    recent_segments = segments_ref.order_by('timestamp', direction='DESCENDING').limit(3).get()
                    if recent_segments:
                        context_lines = []
                        for doc in reversed(list(recent_segments)):
                            data = doc.to_dict()
                            if data.get('speaker') and data.get('text'):
                                text_preview = data['text'][:50] + '...' if len(data['text']) > 50 else data['text']
                                context_lines.append(f"{data['speaker']}: {text_preview}")
                        
                        if context_lines:
                            speaker_context = "\n\nRECENT SPEAKER CONTEXT (maintain consistency):\n" + "\n".join(context_lines)
                            logger.debug("Using fallback context: %d segments", len(context_lines))
                except Exception as fallback_error:
                    logger.warning("Fallback context also failed: %s", fallback_error)
                    # Continue without context - don't fail the request
            
            # Get unified prompt (same as WebSocket version)
            prompt = get_unified_transcription_translation_prompt(
                target_language=request.target_language,
                locale_hint=request.locale_hint,
            )
            
            # Add participants information to prompt if provided (like traditional transcription)
            if request.participants and len(request.participants) > 0:
                participants_text = "\n\nPARTICIPANTS IN THIS MEETING:\n"
                for i, name in enumerate(request.participants):
                    participants_text += f"- {name}\n"
                participants_text += "\nPlease use these exact names when identifying speakers.\n"
                prompt += participants_text
                logger.debug("Added %d participants to prompt: %s", len(request.participants), request.participants)
            
            # Add speaker context to prompt if available
            if speaker_context:
                prompt += speaker_context
            
            # Call Gemini API
            model = get_gemini_client('gemini-2.0-flash')
            
            # Convert base64 audio to bytes for Gemini
            try:
                audio_bytes = base64.b64decode(request.audio_base64)
                logger.debug("Processing audio chunk: %d bytes for session %s", len(audio_bytes), request.session_id)
                
                # Apply noise filtering before sending to Gemini
                noise_filter = get_noise_filter()
                filtered_audio_bytes = noise_filter.filter_audio_chunk(audio_bytes, enable_filtering=True)
                logger.debug("Noise filtering: %d -> %d bytes", len(audio_bytes), len(filtered_audio_bytes))
                
            except Exception as e:
                raise PermanentError(f"Invalid base64 audio data: {e}") from e
            
            # Create audio upload for Gemini with timeout and error classification
            try:
                # CRITICAL FIX: Reconstruct proper WAV file from PCM data
                # Frontend now sends raw PCM data without WAV header to prevent contamination
                logger.debug("Reconstructing WAV file from %d bytes of filtered PCM data", len(filtered_audio_bytes))
                wav_audio = create_wav_from_pcm(filtered_audio_bytes, sample_rate=16000, channels=1, bit_depth=16)
                logger.debug("Created WAV file: %d bytes total", len(wav_audio))
                
                # Use asyncio.wait_for to implement timeout
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        model.generate_content,
                        [
                            prompt,
                            {
                                "mime_type": "audio/wav",
                                "data": wav_audio
                            }
                        ]
                    ),
                    timeout=30.0  # 30 second timeout per attempt
                )
                
                logger.debug("Gemini response received for chunk %s: %s...", request.chunk_id, response.text[:100])
                
                # Check for rate limiting in response
                if hasattr(response, 'status_code') and response.status_code == 429:
                    raise RetryableError("Rate limited by Gemini API")
                    
            except asyncio.TimeoutError:
                raise RetryableError(f"Gemini API timeout after 30 seconds for chunk {request.chunk_id}")
            except Exception as e:
                error_str = str(e).lower()
                
                # Classify errors as retryable or permanent
                if any(keyword in error_str for keyword in ['timeout', 'network', 'connection', '429', '500', '502', '503']):
                    raise RetryableError(f"Transient Gemini API error: {e}") from e
                elif 'no speech' in error_str or 'silence' in error_str:
                    # This is a successful "no speech detected" - don't retry
                    return TranscribeChunkResponse(
                        success=True,
                        chunk_id=request.chunk_id,
                        message="No speech detected in chunk"
                    )
                else:
                    raise PermanentError(f"Permanent Gemini API error: {e}") from e

        except Exception as e:
            logger.warning("Gemini API error: %s", e)
            # Return success but indicate no speech detected
            return TranscribeChunkResponse(
                success=True,
                chunk_id=request.chunk_id,
                message="No speech detected in chunk"
            )
        
        # Parse Gemini response (same logic as WebSocket version)
        text = response.text.strip()
        
        # IMPROVED: Clean extraction of actual spoken content
        # Remove any formatting artifacts and extract clean speech
        
        # Try to parse the SPEAKER/ORIGINAL/TRANSLATION/NEEDS_TRANSLATION format first
        speaker_matches = re.findall(r'SPEAKER:\s*(.+?)\n', text)
        original_matches = re.findall(r'ORIGINAL:\s*(.+?)(?=\nTRANSLATION:|\nNEEDS_TRANSLATION:|\nSPEAKER:|$)', text, re.DOTALL)
        translation_matches = re.findall(r'TRANSLATION:\s*(.+?)(?=\nNEEDS_TRANSLATION:|\nSPEAKER:|$)', text, re.DOTALL)
        needs_translation_match = re.search(r'NEEDS_TRANSLATION:\s*(true|false)', text, re.IGNORECASE)
        
        segment_text = ""
        segment_speaker = "Speaker 1"  # Default fallback
        segment_translation = None
        needs_translation = False
        
        # Check if we got structured format
        if speaker_matches and original_matches:
            # Use the last speaker and text (most recent)
            segment_speaker = speaker_matches[-1].strip()
            segment_text = original_matches[-1].strip()
            
            # Clean up the text - remove any remaining format artifacts
            segment_text = re.sub(r'\n(ORIGINAL|TRANSLATION|NEEDS_TRANSLATION|SPEAKER):', '', segment_text)
            segment_text = re.sub(r'\n(true|false)$', '', segment_text, flags=re.IGNORECASE)
            segment_text = segment_text.strip()
            
            logger.debug("Structured format - Speaker: %s, Text: %s...", segment_speaker, segment_text[:50])
            
            # Handle translation if needed
            if needs_translation_match:
                needs_translation = needs_translation_match.group(1).lower() == 'true'
            if translation_matches and needs_translation:
                segment_translation = translation_matches[-1].strip()
                # Don't store translation if it's identical to original
                if segment_translation == segment_text:
                    segment_translation = None
                    
        else:
            # FALLBACK: No structured format, try to extract speaker patterns and clean text
            logger.debug("No structured format detected, using fallback parsing")
            
            # Look for 'Speaker N' patterns anywhere in the text
            speaker_patterns = re.findall(r'Speaker\s+(\d+)', text, re.IGNORECASE)
            if speaker_patterns:
                segment_speaker = f"Speaker {speaker_patterns[-1]}"
            
            # Clean the text of all formatting artifacts
            cleaned_text = text
            # Remove all the structured format markers
            cleaned_text = re.sub(r'(SPEAKER|ORIGINAL|TRANSLATION|NEEDS_TRANSLATION):\s*', '', cleaned_text, flags=re.IGNORECASE)
            cleaned_text = re.sub(r'\n(true|false)\s*', '', cleaned_text, flags=re.IGNORECASE)
            cleaned_text = re.sub(r'Speaker\s+\d+:\s*', '', cleaned_text, flags=re.IGNORECASE)
            # Remove extra whitespace and newlines
            cleaned_text = ' '.join(cleaned_text.split())
            
            if cleaned_text.strip():
                segment_text = cleaned_text.strip()
            else:
                segment_text = text  # Last resort: use original
                
            logger.debug("Fallback parsing - Speaker: %s, Text: %s...", segment_speaker, segment_text[:50])
        
        # CRITICAL FIX: Save transcribed segment to Firestore so it appears in UI
        # BUT: Only if skip_firestore is False (allows caller to prevent duplicates)
        if segment_text and segment_text.strip() and not request.skip_firestore:
            try:
                firestore_db = get_firestore_db()
                if firestore_db:
                    # Create segment data structure
                    segment_data = {
                        'text': segment_text.strip(),
                        'speaker': segment_speaker,
                        'timestamp': datetime.now().isoformat(),
                        'startTime': None,
                        'endTime': None,
                        'language': request.target_language,
                        'isComplete': True,
                        'translation': segment_translation,
                        'source': 'gemini-live',
                        'chunkId': request.chunk_id
                    }
                    
                    # Save to Firestore
                    session_ref = firestore_db.collection('sessions').document(request.session_id)
                    segments_ref = session_ref.collection('live_transcript_segments')
                    
                    # Add the segment
                    doc_ref = segments_ref.add(segment_data)
                    logger.info("Saved transcribed segment to Firestore: %s... (Doc ID: %s)", segment_text[:50], doc_ref[1].id)
                    
                else:
                    logger.warning("Firestore not available, segment not saved")
                    
            except Exception as firestore_error:
                logger.error("Error saving segment to Firestore: %s", firestore_error)
                # Don't fail the entire request if Firestore fails
        elif request.skip_firestore:
            logger.debug("Skipping Firestore save (skip_firestore=True): %s...", segment_text[:50] if segment_text else 'empty')
        
        # Cache successful result to prevent stutter
        result_data = {
            'transcription': segment_text,
            'speaker': segment_speaker,
            'translation': segment_translation
        }
        processed_chunks[chunk_key] = result_data
        
        return TranscribeChunkResponse(
            success=True,
            chunk_id=request.chunk_id,
            message="Transcription completed",
            transcription=segment_text,
            speaker=segment_speaker,
            translation=segment_translation
        )
    
    # Phase 4: Execute with retry wrapper and proper error handling
    try:
        return await retry_with_exponential_backoff(process_chunk_with_retries)
    except RetryableError as e:
        logger.error("Failed after retries: %s", e)
        raise HTTPException(
            status_code=503,
            detail=f"Service temporarily unavailable: {e}"
        ) from e
    except PermanentError as e:
        logger.error("Permanent failure: %s", e)
        raise HTTPException(
            status_code=400,
            detail=f"Request failed: {e}"
        ) from e
    except Exception as e:
        logger.error("Unexpected error in transcribe_chunk: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {e}") from e
