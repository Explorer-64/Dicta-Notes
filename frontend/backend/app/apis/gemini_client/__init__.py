import logging
import re
from fastapi import APIRouter, HTTPException
from google import genai as _new_sdk
from app.libs.secret_manager import get_secret

logger = logging.getLogger("dicta.gemini_client")

router = APIRouter()


def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)


class _ModelAdapter:
    """Thin adapter so existing code that calls model.generate_content() keeps working."""
    def __init__(self, client: _new_sdk.Client, model_name: str):
        self._client = client
        self._model_name = model_name

    def generate_content(self, contents=None, **kwargs):
        return self._client.models.generate_content(
            model=self._model_name,
            contents=contents,
            **kwargs,
        )


def get_gemini_client(model_name: str = "gemini-2.5-flash") -> _ModelAdapter:
    """Get configured Gemini client"""
    api_key = get_secret("GEMINI_API_KEY")
    logger.debug("GEMINI_API_KEY found: %s", api_key is not None)
    if not api_key:
        logger.error("No API keys found in secrets")
        raise HTTPException(status_code=400, detail="Gemini API key not configured")
    client = _new_sdk.Client(api_key=api_key)
    return _ModelAdapter(client, model_name)


def get_gemini_list_models():
    """Return list of available Gemini model names."""
    api_key = get_secret("GEMINI_API_KEY")
    if not api_key:
        return []
    client = _new_sdk.Client(api_key=api_key)
    return list(client.models.list())


def generate_transcription_prompt(meeting_title: str, participants=None, additional_context=""):
    """Generate a prompt for the Gemini model to transcribe and identify speakers"""
    prompt = f"""
You are a professional audio transcription system with speaker identification and language separation capabilities.

Please transcribe this audio recording and identify different speakers.

Meeting title: {meeting_title}

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

}}

EXAMPLE of proper language separation:
If someone says "Hello everyone, bienvenidos a la reunión", create TWO segments:
- Segment 1: "Hello everyone" (language: "en")
- Segment 2: "bienvenidos a la reunión" (language: "es")

IMPORTANT: Return only valid JSON, no extra text or markdown formatting.
        """

    if participants and len(participants) > 0:
        prompt += "\nParticipants in this meeting:\n"
        for i, name in enumerate(participants):
            prompt += f"- {name}\n"

    if additional_context:
        prompt += f"\nAdditional context: {additional_context}\n"

    return prompt
