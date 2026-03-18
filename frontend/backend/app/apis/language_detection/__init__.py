import logging
from fastapi import APIRouter, UploadFile, File
logger = logging.getLogger("dicta.language_detection")
from fastapi.responses import PlainTextResponse
from app.apis.gemini_client import get_gemini_client

router = APIRouter()


@router.post("/detect-language", response_class=PlainTextResponse)
async def detect_language(audio_file: UploadFile = File(...)):
    try:
        model = get_gemini_client("gemini-2.0-flash")
    except Exception:
        return PlainTextResponse("Gemini model not configured", status_code=500)

    try:
        # Prepare the audio data for Gemini
        audio_data = await audio_file.read()
        
        # Validate audio data
        if len(audio_data) < 500:  # Too small to be meaningful audio
            logger.debug("Audio data too small: %d bytes", len(audio_data))
            return PlainTextResponse("en-US")  # Default fallback
            
        if len(audio_data) > 20_000_000:  # Too large (20MB limit)
            logger.debug("Audio data too large: %d bytes", len(audio_data))
            return PlainTextResponse("en-US")  # Default fallback

        logger.debug("Processing %d bytes of audio data", len(audio_data))
        
        # Get the MIME type from the uploaded file, with fallback
        mime_type = audio_file.content_type or "audio/webm"
        logger.debug("Audio MIME type: %s", mime_type)
        
        # Ensure the MIME type is supported by Gemini
        supported_types = ["audio/webm", "audio/wav", "audio/mp3", "audio/mpeg", "audio/m4a", "audio/aac"]
        if mime_type not in supported_types:
            logger.warning("Unsupported MIME type %s, using default audio/webm", mime_type)
            mime_type = "audio/webm"

        # Send to Gemini for language detection
        response = model.generate_content(
            [
                """You are a language detection specialist. Analyze the following audio and return only the IETF language tag that is supported by Google Speech-to-Text.
                
CRITICAL: Process audio segments in exact chronological order as they were spoken. When detecting language changes during rapid speaker alternation, maintain the natural temporal sequence.
                
IMPORTANT: You MUST return a language code from this exact list of Google STT supported languages:
                
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
        
        Return only the language code, no explanation or formatting.""",
                {"mime_type": mime_type, "data": audio_data},
            ],
        )

        # Extract and clean the language code
        language_code = response.text.strip()
        logger.info("Language detected, sending code to frontend: %s", language_code)

        # Validate the response
        if not language_code or len(language_code) < 2:
            logger.warning("Invalid language code response, using default")
            return PlainTextResponse("en-US")

        return PlainTextResponse(content=language_code)

    except Exception as e:
        logger.error("Error during language detection: %s", e)
        # Return a sensible default instead of failing
        return PlainTextResponse("en-US")
