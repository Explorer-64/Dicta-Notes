# Gemini prompt templates for consistent language identification and transcription
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List

# Create FastAPI router
router = APIRouter()

# Pydantic models for request/response
class PromptRequest(BaseModel):
    is_interim_audio: Optional[bool] = False
    text: Optional[str] = None

class PromptResponse(BaseModel):
    prompt: str

# API endpoints to retrieve prompts
@router.post("/enhanced-transcription")
def get_enhanced_transcription_prompt_api(request: PromptRequest) -> PromptResponse:
    """
    Returns a prompt template for Gemini to enhance transcription with language detection
    """
    prompt = get_enhanced_transcription_prompt(is_interim_audio=request.is_interim_audio)
    return PromptResponse(prompt=prompt)

@router.post("/language-detection")
def get_language_detection_prompt_api(request: PromptRequest) -> PromptResponse:
    """
    Returns a prompt template for Gemini to detect language
    """
    prompt = get_language_detection_prompt()
    # If text is provided, format the prompt with it
    if request.text:
        prompt = prompt.format(text=request.text)
    return PromptResponse(prompt=prompt)

# This template ensures Gemini includes language codes in its structured output
def get_enhanced_transcription_prompt(is_interim_audio=False):
    """
    Returns a prompt template for Gemini to enhance transcription with language detection
    
    Args:
        is_interim_audio: Whether this is for interim audio processing
    
    Returns:
        A prompt string template
    """
    interim_note = "This is an interim update, so provide just the latest segment." if is_interim_audio else ""
    
    return f"""
    You are an AI assistant specialized in transcribing multilingual audio conversations.
    
    Your task is to enhance this browser-generated transcript by:
    1. Identifying different speakers
    2. Separating their contributions
    3. Detecting the language(s) being spoken
    4. Improving the overall accuracy
    {interim_note}
    
    Important instructions for language detection:
    - For each segment, determine the language and include a language code
    - Use ISO 639-1 codes (e.g., 'en' for English, 'es' for Spanish, 'fr' for French)
    - For any non-English content, make sure to explicitly mark the language
    
    Format your response as a structured JSON with the following format:
    {{"segments": [
        {{"speaker": {{"id": "speaker_1", "name": "Speaker 1"}}, "text": "Example text in English.", "language": "en"}},
        {{"speaker": {{"id": "speaker_2", "name": "Speaker 2"}}, "text": "Ejemplo de texto en español.", "language": "es"}}
    ],
    "languages_detected": ["en", "es"]}}
    
    Here's the transcript to analyze:
    """

# This prompt is specifically for language identification when needed separately
def get_language_detection_prompt():
    """
    Returns a prompt template for Gemini to detect language
    
    Returns:
        A prompt string template
    """
    return """
    Identify the language of this text and return ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'zh', 'fr').
    Don't include any explanations, just the code.
    
    Text: {text}
    """
