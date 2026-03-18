import logging
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger("dicta.translation")
from app.libs.secret_manager import get_secret
from app.apis.gemini_client import get_gemini_client
import re
import time
from collections import defaultdict
from app.libs.translate_client import get_translate_client

router = APIRouter()

# Rate limiting configuration
RATE_LIMIT_REQUESTS = 100  # Max requests per hour per IP
rate_limit_store = {}  # In-memory store for rate limiting

# Pydantic models
class TranslationRequest(BaseModel):
    text: str
    target_language: str
    source_language: Optional[str] = None

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    method_used: Optional[str] = None  # "google_translate" or "gemini_backup"

def check_rate_limit(client_ip: str) -> bool:
    """Check if client IP is within rate limits"""
    current_time = time.time()
    hour_ago = current_time - 3600  # 1 hour ago
    
    # Clean old entries
    if client_ip in rate_limit_store:
        rate_limit_store[client_ip] = [req_time for req_time in rate_limit_store[client_ip] if req_time > hour_ago]
    else:
        rate_limit_store[client_ip] = []
    
    # Check if within limit
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    
    # Record this request
    rate_limit_store[client_ip].append(current_time)
    return True

def translate_with_google(text: str, target_language: str, source_language: Optional[str] = None) -> dict:
    """Translate using Google Cloud Translate API"""
    try:
        translate_client = get_translate_client()
        
        # If source language not provided, let Google detect it
        if source_language:
            result = translate_client.translate(
                text,
                target_language=target_language,
                source_language=source_language
            )
        else:
            result = translate_client.translate(
                text,
                target_language=target_language
            )
        
        return {
            "translated_text": result['translatedText'],
            "detected_source_language": result.get('detectedSourceLanguage', source_language or 'unknown'),
            "method_used": "google_translate"
        }
    except Exception as e:
        logger.error("Google Translate failed: %s", e)
        raise e

def translate_with_gemini_backup(text: str, target_language: str, source_language: Optional[str] = None) -> dict:
    """Fallback translation using Gemini"""
    try:
        # Configure Gemini
        model = get_gemini_client('gemini-2.5-flash')

        # Language detection if needed
        detected_source = source_language
        if not detected_source:
            detection_prompt = f"""Identify the language of this text and return ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'zh', 'fr').
            Don't include any explanations, just the code.
            
            Text: {text}
            """
            detection_response = model.generate_content(detection_prompt)
            detected_source = detection_response.text.strip()
            detected_source = re.sub(r'[^a-z-]', '', detected_source.lower())
            if not re.match(r'^[a-z]{2}(-[a-z]{2})?$', detected_source):
                detected_source = 'en'
        
        # Language name mapping
        language_names = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'it': 'Italian', 'ja': 'Japanese', 'zh': 'Chinese', 'ko': 'Korean',
            'ru': 'Russian', 'ar': 'Arabic', 'hi': 'Hindi', 'pt': 'Portuguese',
            'bn': 'Bengali', 'tr': 'Turkish', 'vi': 'Vietnamese', 'th': 'Thai',
            'nl': 'Dutch', 'sv': 'Swedish'
        }
        
        target_lang_name = language_names.get(target_language, target_language)
        source_lang_name = language_names.get(detected_source, detected_source)
        
        # Translation prompt
        prompt = f"""Translate the following text from {source_lang_name} to {target_lang_name}.
        
        Provide ONLY the translated text, nothing else.
        
        Text to translate:
        {text}
        """
        
        response = model.generate_content(prompt)
        translated_text = response.text.strip()
        
        return {
            "translated_text": translated_text,
            "detected_source_language": detected_source,
            "method_used": "gemini_backup"
        }
    except Exception as e:
        logger.error("Gemini backup translation failed: %s", e)
        raise e

@router.post("/translate_text")
def translate_text(
    request: TranslationRequest, 
    client_request: Request,
    authorization: Optional[str] = Header(None)
) -> TranslationResponse:
    """Translate text from one language to another using Gemini
    
    TIER GATE: Free tier users cannot access translation.
    If Authorization header is provided, check user's tier.
    """
    try:
        # TIER GATE: Check if user is authorized to translate
        if authorization:
            # Extract token from "Bearer <token>"
            token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
            
            try:
                from app.apis.firebase import verify_id_token
                claims = verify_id_token(token)
                
                if claims:
                    user_id = claims.get("sub")
                    from app.libs.tier_management import TierManager
                    tier_manager = TierManager()
                    
                    can_translate, gate_message = tier_manager.can_use_translation(user_id)
                    
                    if not can_translate:
                        logger.warning("Translation blocked for %s: %s", user_id, gate_message)
                        raise HTTPException(
                            status_code=403,
                            detail=gate_message or "Translation is not available on the Free plan. Upgrade to Individual or higher."
                        )
                    logger.debug("Translation allowed for %s", user_id)
            except HTTPException:
                raise
            except Exception as e:
                # If token verification fails, continue with rate limiting
                logger.warning("Token verification failed: %s", e)
        
        # Basic rate limiting for public endpoint
        client_ip = client_request.client.host if client_request.client else "unknown"
        if not check_rate_limit(client_ip):
            raise HTTPException(
                status_code=429, 
                detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per hour."
            )
            
        # Validate input
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text to translate cannot be empty")
            
        # Validate target language format (should be a valid language code)
        if not re.match(r'^[a-z]{2}(-[A-Z]{2})?$', request.target_language):
            raise HTTPException(status_code=400, detail=f"Invalid target language format: {request.target_language}. Expected format: 'en' or 'en-US'")
        
        # If source_language is provided, validate its format
        if request.source_language and not re.match(r'^[a-z]{2}(-[A-Z]{2})?$', request.source_language):
            raise HTTPException(status_code=400, detail=f"Invalid source language format: {request.source_language}. Expected format: 'en' or 'en-US'")
            
        # Configure Gemini
        model = get_gemini_client('gemini-2.5-flash')

        # If source_language wasn't provided, detect it first using Traditional method's approach
        detected_source = request.source_language
        if not detected_source:
            # Use Traditional method's language detection approach
            detection_prompt = f"""Identify the language of this text and return ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'zh', 'fr').
            Apply the same language detection methodology used in Traditional transcription for consistency.
            Don't include any explanations, just the code.
            
            Text: {request.text}
            """
            detection_response = model.generate_content(detection_prompt)
            detected_source = detection_response.text.strip()
            
            # Clean up response to ensure we get just the language code
            # Remove any quotes, backticks or extra characters
            detected_source = re.sub(r'[^a-z-]', '', detected_source.lower())
            
            # If we still don't have a valid language code, default to 'en'
            if not re.match(r'^[a-z]{2}(-[a-z]{2})?$', detected_source):
                detected_source = 'en'
        
        # Use Traditional method's transcription-first approach for better accuracy
        source_lang_prompt = f" from {detected_source}" if detected_source else ""
        
        # Print the translation request details for debugging
        logger.debug("Translation request (Traditional): From %s to %s", detected_source, request.target_language)
        logger.debug("Target language: %s", request.target_language)
        logger.debug("Text to translate: %s", request.text[:100] + "..." if len(request.text) > 100 else request.text)
        
        # Use language name mapping from Traditional method
        language_names = {
            'en': 'English',
            'es': 'Spanish', 
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'ja': 'Japanese',
            'zh': 'Chinese',
            'ko': 'Korean',
            'ru': 'Russian',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'pt': 'Portuguese',
            'bn': 'Bengali',
            'tr': 'Turkish',
            'vi': 'Vietnamese',
            'th': 'Thai',
            'nl': 'Dutch',
            'sv': 'Swedish'
            # Add more as needed
        }
        
        # Get language name or use code if not found
        target_lang_name = language_names.get(request.target_language, request.target_language)
        source_lang_name = language_names.get(detected_source, detected_source)
        
        # Traditional method's transcription-first translation approach
        prompt = f"""You are performing text translation using Traditional transcription methodology for maximum accuracy.
        
        CRITICAL: Apply Traditional method's transcription-first approach:
        1. FIRST: Ensure perfect understanding of the source text in its original language
        2. SECOND: Apply precise language detection consistent with Traditional transcription
        3. THIRD: Provide accurate translation maintaining Traditional method's quality standards
        
        SOURCE LANGUAGE: {source_lang_name} ({detected_source})
        TARGET LANGUAGE: {target_lang_name} ({request.target_language})
        
        TRANSLATION INSTRUCTIONS:
        - Maintain the EXACT meaning and context from the original text
        - Preserve any formatting, proper names, and technical terms appropriately
        - Use Traditional method's attention to detail for speaker context and nuance
        - Ensure translation quality matches Traditional transcription standards
        - If source is already {target_lang_name}, return the original text unchanged
        
        Original text{source_lang_prompt}:
        {request.text}
        
        Provide ONLY the translated text in {target_lang_name}, nothing else.
        """
        
        # Get translation from Gemini using Traditional method's approach
        response = model.generate_content(prompt)
        translated_text = response.text.strip()
        
        return TranslationResponse(
            original_text=request.text,
            translated_text=translated_text,
            source_language=detected_source,
            target_language=request.target_language
        )
    except Exception as e:
        # Proper exception handling - raise from the original error
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}") from e


@router.get("/supported-languages")
def get_supported_languages():
    """Get a list of supported languages for translation (Gemini-capable, 130+ languages)"""
    try:
        supported_languages = {
            "en": "English",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "it": "Italian",
            "pt": "Portuguese",
            "nl": "Dutch",
            "ja": "Japanese",
            "ko": "Korean",
            "zh": "Chinese",
            "ru": "Russian",
            "ar": "Arabic",
            "hi": "Hindi",
            "bn": "Bengali",
            "pa": "Punjabi",
            "ta": "Tamil",
            "te": "Telugu",
            "mr": "Marathi",
            "gu": "Gujarati",
            "kn": "Kannada",
            "ml": "Malayalam",
            "th": "Thai",
            "vi": "Vietnamese",
            "tr": "Turkish",
            "pl": "Polish",
            "uk": "Ukrainian",
            "cs": "Czech",
            "sk": "Slovak",
            "hu": "Hungarian",
            "ro": "Romanian",
            "sv": "Swedish",
            "no": "Norwegian",
            "da": "Danish",
            "fi": "Finnish",
            "el": "Greek",
            "he": "Hebrew",
            "id": "Indonesian",
            "ms": "Malay",
            "fil": "Filipino",
            "sw": "Swahili",
            "af": "Afrikaans",
            "am": "Amharic",
            "hy": "Armenian",
            "az": "Azerbaijani",
            "eu": "Basque",
            "be": "Belarusian",
            "bs": "Bosnian",
            "bg": "Bulgarian",
            "ca": "Catalan",
            "ceb": "Cebuano",
            "ny": "Chichewa",
            "co": "Corsican",
            "hr": "Croatian",
            "eo": "Esperanto",
            "et": "Estonian",
            "tl": "Filipino",
            "fy": "Frisian",
            "gl": "Galician",
            "ka": "Georgian",
            "gd": "Scottish Gaelic",
            "ha": "Hausa",
            "haw": "Hawaiian",
            "hmn": "Hmong",
            "is": "Icelandic",
            "ig": "Igbo",
            "ga": "Irish",
            "jw": "Javanese",
            "kk": "Kazakh",
            "km": "Khmer",
            "ku": "Kurdish",
            "ky": "Kyrgyz",
            "lo": "Lao",
            "la": "Latin",
            "lv": "Latvian",
            "lt": "Lithuanian",
            "lb": "Luxembourgish",
            "mk": "Macedonian",
            "mg": "Malagasy",
            "mt": "Maltese",
            "mi": "Maori",
            "mn": "Mongolian",
            "my": "Myanmar (Burmese)",
            "ne": "Nepali",
            "ps": "Pashto",
            "fa": "Persian",
            "sm": "Samoan",
            "sr": "Serbian",
            "st": "Sesotho",
            "sn": "Shona",
            "sd": "Sindhi",
            "si": "Sinhala",
            "sl": "Slovenian",
            "so": "Somali",
            "su": "Sundanese",
            "tg": "Tajik",
            "tt": "Tatar",
            "ur": "Urdu",
            "uz": "Uzbek",
            "cy": "Welsh",
            "xh": "Xhosa",
            "yi": "Yiddish",
            "yo": "Yoruba",
            "zu": "Zulu",
            "ab": "Abkhaz",
            "sq": "Albanian",
            "as": "Assamese",
            "ay": "Aymara",
            "bm": "Bambara",
            "bem": "Bemba",
            "bho": "Bhojpuri",
            "br": "Breton",
            "yue": "Cantonese",
            "cv": "Chuvash",
            "din": "Dinka",
            "dv": "Divehi",
            "ee": "Ewe",
            "fj": "Fijian",
            "ff": "Fulfulde",
            "ht": "Haitian Creole",
            "hil": "Hiligaynon",
            "ilo": "Iloko",
            "jv": "Javanese",
            "rw": "Kinyarwanda",
            "ckb": "Kurdish (Sorani)",
            "lg": "Ganda",
            "lij": "Ligurian",
            "ln": "Lingala",
            "mai": "Maithili",
            "or": "Odia",
            "om": "Oromo",
            "pag": "Pangasinan",
            "pap": "Papiamento",
            "qu": "Quechua",
            "rom": "Romani",
            "rn": "Rundi",
            "sg": "Sango",
            "sa": "Sanskrit",
            "shn": "Shan",
            "scn": "Sicilian",
            "ss": "Swati",
            "tet": "Tetum",
            "ti": "Tigrinya",
            "ts": "Tsonga",
            "tn": "Tswana",
            "tk": "Turkmen",
            "ak": "Twi",
            "ug": "Uyghur",
        }
        
        return {"languages": [
            {"code": code, "name": name}
            for code, name in supported_languages.items()
        ]}
    except Exception as e:
        # Proper exception handling - raise from the original error
        raise HTTPException(status_code=500, detail=f"Failed to retrieve supported languages: {str(e)}") from e
