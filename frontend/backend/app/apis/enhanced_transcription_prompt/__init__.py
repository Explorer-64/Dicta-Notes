
from pydantic import BaseModel
from fastapi import APIRouter
from typing import Optional

from app.libs.unified_prompt import get_unified_transcription_translation_prompt

router = APIRouter()


class EnhancedTranscriptionPromptRequest(BaseModel):
    targetLanguage: Optional[str] = None
    localeHint: Optional[str] = None


class EnhancedTranscriptionPromptResponse(BaseModel):
    prompt: str
    version: str
    description: str


@router.get("/get-unified-transcription-prompt-api", response_model=EnhancedTranscriptionPromptResponse)
def get_unified_transcription_prompt_api(targetLanguage: Optional[str] = None, localeHint: Optional[str] = None) -> EnhancedTranscriptionPromptResponse:
    """
    Returns the unified prompt used by both Live transcription and Multilingual translation systems.
    This ensures ONE prompt definition that both systems reference.
    """
    prompt = get_unified_transcription_translation_prompt(targetLanguage, localeHint)

    target_desc = targetLanguage or (localeHint or "mirror ORIGINAL when ambiguous")

    return EnhancedTranscriptionPromptResponse(
        prompt=prompt,
        version="unified-v2",
        description=f"Unified prompt for live transcription and multilingual translation (target: {target_desc})",
    )
