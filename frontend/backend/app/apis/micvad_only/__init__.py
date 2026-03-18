import logging
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List

logger = logging.getLogger("dicta.micvad_only")
from app.libs.secret_manager import get_secret
import base64
import struct
import asyncio
import time
import json

from app.auth import AuthorizedUser
# Import shared save function for consistent Firestore storage
from app.apis.segments import save_segment_to_firestore, SaveSegmentRequest
# Import session helper for auto-creation
from app.libs.session_utils import ensure_session_exists
# Import Gemini fallback endpoint
from app.apis.transcribe_chunk import transcribe_chunk, TranscribeChunkRequest
# Import language config helper
from app.libs.language_config import get_language_config

# Google Cloud Speech
from google.cloud import speech
from google.cloud.speech_v1.types import SpeakerDiarizationConfig
from google.oauth2 import service_account

router = APIRouter()

# -------- Helpers --------

def create_wav_from_pcm(pcm_data: bytes, sample_rate: int = 16000, channels: int = 1, bit_depth: int = 16) -> bytes:
    """Wrap raw PCM16 mono 16k audio into a minimal WAV container."""
    byte_rate = sample_rate * channels * bit_depth // 8
    block_align = channels * bit_depth // 8
    data_size = len(pcm_data)
    total_size = 36 + data_size
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF', total_size, b'WAVE', b'fmt ', 16, 1,
        channels, sample_rate, byte_rate, block_align, bit_depth, b'data', data_size
    )
    return header + pcm_data


def normalize_language(lang: Optional[str]) -> str:
    """Return a valid BCP-47 language code for Google STT. Returns the provided language if not found."""
    if not lang:
        # No longer defaulting to en-US. Return as is.
        return lang
        
    lang = lang.strip().lower()
    
    # If already looks like bcp-47 with region
    if "-" in lang:
        return lang # Pass through full BCP-47 codes like 'en-US'
        
    # Full mapping of simple codes to full BCP-47 codes
    lang_map = {
        "af": "af-ZA", "am": "am-ET", "ar": "ar-XA", "as": "as-IN", "az": "az-AZ",
        "be": "be-BY", "bg": "bg-BG", "bn": "bn-IN", "bs": "bs-BA", "ca": "ca-ES",
        "cs": "cs-CZ", "cy": "cy-GB", "da": "da-DK", "de": "de-DE", "el": "el-GR",
        "en": "en-US", "eo": "eo-XX", "es": "es-ES", "et": "et-EE", "eu": "eu-ES",
        "fa": "fa-IR", "fi": "fi-FI", "fil": "fil-PH", "fr": "fr-FR", "fy": "fy-NL",
        "ga": "ga-IE", "gd": "gd-GB", "gl": "gl-ES", "gu": "gu-IN", "ha": "ha-NG",
        "he": "he-IL", "hi": "hi-IN", "hr": "hr-HR", "hu": "hu-HU", "hy": "hy-AM",
        "id": "id-ID", "ig": "ig-NG", "is": "is-IS", "it": "it-IT", "ja": "ja-JP",
        "jv": "jv-ID", "ka": "ka-GE", "kk": "kk-KZ", "km": "km-KH", "kn": "kn-IN",
        "ko": "ko-KR", "ku": "ku-TR", "ky": "ky-KG", "la": "la-VA", "lb": "lb-LU",
        "ln": "ln-CD", "lo": "lo-LA", "lt": "lt-LT", "lv": "lv-LV", "mi": "mi-NZ",
        "mk": "mk-MK", "ml": "ml-IN", "mn": "mn-MN", "mr": "mr-IN", "ms": "ms-MY",
        "mt": "mt-MT", "my": "my-MM", "nb": "nb-NO", "ne": "ne-NP", "nl": "nl-NL",
        "nn": "nn-NO", "no": "no-NO", "ny": "ny-MW", "or": "or-IN", "pa": "pa-IN",
        "pl": "pl-PL", "ps": "ps-AF", "pt": "pt-BR", "ro": "ro-RO", "ru": "ru-RU",
        "sd": "sd-IN", "si": "si-LK", "sk": "sk-SK", "sl": "sl-SI", "sn": "sn-ZW",
        "so": "so-SO", "sq": "sq-AL", "sr": "sr-RS", "su": "su-ID", "sv": "sv-SE",
        "sw": "sw-KE", "ta": "ta-IN", "te": "te-IN", "tg": "tg-TJ", "th": "th-TH",
        "tk": "tk-TM", "tr": "tr-TR", "uk": "uk-UA", "ur": "ur-PK", "uz": "uz-UZ",
        "vi": "vi-VN", "yo": "yo-NG", "zh": "cmn-Hans-CN", "zu": "zu-ZA"
    }

    return lang_map.get(lang, lang) # Return original if not in map

# -------- Models --------

class MicVADOnlyRequest(BaseModel):
    audio_base64: str               # Raw PCM16, mono, 16kHz, base64-encoded
    session_id: str
    chunk_id: str
    target_language: Optional[str] = None  # optional hint
    phrase_hints: Optional[List[str]] = None # For STT model prompting
    
    # Add camelCase aliases for the TypeScript client
    class Config:
        validate_by_name = True
        
    # Field aliases to accept both snake_case and camelCase
    audio_as_base64: str = Field(alias="audioAsBase64", default=None)
    session_id_alt: str = Field(alias="sessionId", default=None) 
    chunk_id_alt: str = Field(alias="chunkId", default=None)
    language_hint: Optional[str] = Field(alias="languageHint", default=None)
    
    def __init__(self, **data):
        # Map camelCase to snake_case if present
        if 'audioAsBase64' in data and 'audio_base64' not in data:
            data['audio_base64'] = data.pop('audioAsBase64')
        if 'sessionId' in data and 'session_id' not in data:
            data['session_id'] = data.pop('sessionId')
        if 'chunkId' in data and 'chunk_id' not in data:
            data['chunk_id'] = data.pop('chunkId')
        if 'languageHint' in data and 'target_language' not in data:
            data['target_language'] = data.pop('languageHint')
        super().__init__(**data)

class MicVADOnlyResponse(BaseModel):
    success: bool
    chunk_id: str
    transcription: Optional[str] = None
    message: Optional[str] = None
    # Add Firestore save status for compatibility with regular transcribe_chunk
    saved_to_firestore: Optional[bool] = None
    segment_id: Optional[str] = None

# -------- Endpoint --------

@router.post("/micvad-only/transcribe-chunk", response_model=MicVADOnlyResponse)
async def micvad_only_transcribe_chunk(body: MicVADOnlyRequest, user: AuthorizedUser) -> MicVADOnlyResponse:
    """
    Minimal MicVAD-only transcription endpoint using Google Cloud Speech-to-Text.
    - No Firestore, no participants/context, no translation, no noise filtering.
    - Decodes base64 PCM16 → wraps to WAV (optional) → calls Google STT with LINEAR16 config.
    - 30s timeout, basic error handling, no retries.
    - Logs byte length and duration per request.
    """
    t0 = time.time()

    # Decode audio
    try:
        pcm_bytes = base64.b64decode(body.audio_base64)
    except Exception as e:
        return MicVADOnlyResponse(success=False, chunk_id=body.chunk_id, message=f"Invalid base64 audio: {e}")

    # Build WAV (not strictly required for LINEAR16, but useful for validation/debug)
    try:
        _ = create_wav_from_pcm(pcm_bytes)
    except Exception as e:
        return MicVADOnlyResponse(success=False, chunk_id=body.chunk_id, message=f"WAV construction failed: {e}")

    # Prepare Google credentials
    try:
        sa_json = get_secret("FIREBASE_SERVICE_ACCOUNT")
        if not sa_json:
            return MicVADOnlyResponse(success=False, chunk_id=body.chunk_id, message="FIREBASE_SERVICE_ACCOUNT not configured")
        if isinstance(sa_json, str):
            sa_info = json.loads(sa_json)
        else:
            sa_info = sa_json
        creds = service_account.Credentials.from_service_account_info(
            sa_info,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        client = speech.SpeechClient(credentials=creds)
    except Exception as e:
        return MicVADOnlyResponse(success=False, chunk_id=body.chunk_id, message=f"Google auth failed: {e}")

    # Get language configuration
    preferred_languages = get_language_config()
    primary_language = preferred_languages[0] if preferred_languages else "en-US"
    alternative_languages = preferred_languages[1:] if len(preferred_languages) > 1 else []


    # Build STT config and audio
    # Use minimal diarization to reduce interference with transcription quality
    diarization_config = SpeakerDiarizationConfig(
        enable_speaker_diarization=True,
        min_speaker_count=1,  # Allow single speaker
        max_speaker_count=3,  # Reduced from default
    )
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code=primary_language,
        alternative_language_codes=alternative_languages,
        enable_automatic_punctuation=True,
        model="latest_short",  # Better for real-time, shorter segments
        use_enhanced=True,     # Enhanced model for better accuracy
        diarization_config=diarization_config,
        # Additional quality settings
        enable_word_time_offsets=True,
        enable_word_confidence=True,
    )

    # Add phrase hints if provided
    if body.phrase_hints:
        logger.debug("Using phrase hints: %s", body.phrase_hints)
        speech_context = speech.SpeechContext(phrases=body.phrase_hints, boost=20.0)
        config.speech_contexts = [speech_context]

    audio = speech.RecognitionAudio(content=pcm_bytes)

    # Call STT with timeout
    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(client.recognize, request={"config": config, "audio": audio}),
            timeout=30.0,
        )
        
        # Process diarization results if available
        text = ""
        if response.results:
            # Get the first result which contains word-level details
            first_alternative = response.results[0].alternatives[0]
            if first_alternative.words:
                current_speaker_tag = -1
                full_transcript = []
                
                for word_info in first_alternative.words:
                    if word_info.speaker_tag != current_speaker_tag:
                        # Add speaker number when the speaker changes
                        if full_transcript:
                            full_transcript.append("\n") # New line for new speaker
                        full_transcript.append(f"Speaker {word_info.speaker_tag}:")
                        current_speaker_tag = word_info.speaker_tag
                    
                    full_transcript.append(word_info.word)
                
                text = " ".join(full_transcript).replace(" \n ", "\n")

        # Fallback for non-diarized results (should not happen with this config)
        if not text:
            text_parts = []
            for result in response.results:
                if result.alternatives:
                    text_parts.append(result.alternatives[0].transcript)
            text = " ".join(tp.strip() for tp in text_parts if tp.strip())
    except asyncio.TimeoutError:
        return MicVADOnlyResponse(success=False, chunk_id=body.chunk_id, message="Google STT timeout (30s)")
    except Exception as e:
        return MicVADOnlyResponse(success=False, chunk_id=body.chunk_id, message=f"Google STT error: {e}")
    finally:
        dt = time.time() - t0
        logger.debug("chunk=%s session=%s bytes=%d duration=%.3fs", body.chunk_id, body.session_id, len(pcm_bytes), dt)

    if text == "":
        # Try Gemini fallback when Google STT returns empty
        logger.debug("Google STT returned empty, trying Gemini fallback")
        try:
            # Prepare request for Gemini transcribe_chunk
            gemini_request = TranscribeChunkRequest(
                audio_base64=body.audio_base64,  # Correct field name
                session_id=body.session_id,
                chunk_id=body.chunk_id,
                target_language=body.target_language or "en",  # Use target_language from request
                skip_firestore=True  # NEW: Prevent transcribe_chunk from saving (micvad_only will save)
            )
            
            # Call Gemini transcribe_chunk endpoint
            gemini_response = await transcribe_chunk(gemini_request, user)
            
            if gemini_response.success and gemini_response.transcription:
                text = gemini_response.transcription
                logger.info("Gemini fallback succeeded: %s", text[:50] + "..." if len(text) > 50 else text)
            else:
                logger.debug("Gemini fallback also returned empty")
                # Treat silence as success with empty transcription
                return MicVADOnlyResponse(success=True, chunk_id=body.chunk_id, transcription="")
        except Exception as gemini_err:
            logger.warning("Gemini fallback error: %s", gemini_err)
            # Treat as silence
            return MicVADOnlyResponse(success=True, chunk_id=body.chunk_id, transcription="")

    # Save transcription to Firestore using shared function for fallback compatibility
    saved_to_firestore = False
    segment_id = None
    save_error = None
    
    if text.strip():  # Only save non-empty transcriptions
        try:
            # Ensure session exists (auto-create if needed)
            session_created = ensure_session_exists(
                session_id=body.session_id,
                user_id=user.sub,
                session_title="MicVAD Test Session"
            )
            
            if not session_created:
                save_error = "Failed to create or access session"
                logger.error("%s", save_error)
            else:
                # Create save request using shared data structure
                save_request = SaveSegmentRequest(
                    session_id=body.session_id,
                    text=text.strip(),
                    speaker="Speaker",  # Generic speaker name, will be enhanced by diarizationS
                    timestamp=int(time.time() * 1000),  # Current time in milliseconds
                    language=primary_language,
                    is_final=True
                )
                
                # Call shared save function
                save_result = await save_segment_to_firestore(save_request, user)
                
                if save_result.success:
                    saved_to_firestore = True
                    segment_id = save_result.segment_id
                    logger.info("Saved segment to Firestore: %s", segment_id)
                else:
                    save_error = save_result.message
                    logger.error("Failed to save segment: %s", save_error)
                
        except Exception as e:
            save_error = str(e)
            logger.error("Save error: %s", save_error)

    return MicVADOnlyResponse(
        success=True, 
        chunk_id=body.chunk_id, 
        transcription=text,
        saved_to_firestore=saved_to_firestore,
        segment_id=segment_id,
        message=save_error if save_error else None
    )
