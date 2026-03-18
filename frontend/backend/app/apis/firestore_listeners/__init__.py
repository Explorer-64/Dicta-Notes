import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("dicta.firestore_listeners")
from typing import Optional
from google.cloud import firestore
from app.libs.secret_manager import get_secret
import json
import re
from app.libs.translate_client import get_translate_client

router = APIRouter()

# Pydantic models
class SegmentCreatedRequest(BaseModel):
    session_id: str
    segment_id: str

class SegmentCreatedResponse(BaseModel):
    success: bool
    message: str
    translations_added: Optional[int] = None

@router.post("/on_segment_created", response_model=SegmentCreatedResponse)
def on_segment_created(request: SegmentCreatedRequest) -> SegmentCreatedResponse:
    """
    Backend listener for processing new transcription segments.
    Fetches the segment from Firestore, translates it, and updates the document.
    """
    try:
        # Get Firestore client
        service_account_info = get_secret("FIREBASE_SERVICE_ACCOUNT")
        if not service_account_info:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT secret is not set.")
        
        credentials_dict = json.loads(service_account_info)
        # Initialize Firestore client with service account
        db_client = firestore.Client.from_service_account_info(credentials_dict)
        
        # Fetch the segment document
        segment_ref = db_client.collection('sessions').document(request.session_id).collection('segments').document(request.segment_id)
        segment_doc = segment_ref.get()
        
        if not segment_doc.exists:
            raise HTTPException(status_code=404, detail=f"Segment {request.segment_id} not found in session {request.session_id}")
        
        segment_data = segment_doc.to_dict()
        
        # Check if we have text to translate
        if not segment_data.get('text'):
            return SegmentCreatedResponse(
                success=False,
                message="No text found in segment to translate"
            )
        
        # Check if translations already exist
        if segment_data.get('translations'):
            return SegmentCreatedResponse(
                success=True,
                message="Translations already exist for this segment",
                translations_added=0
            )
        
        # Get translate client
        translate_client = get_translate_client()
        
        # Define target languages for translation
        target_languages = ['es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh']
        source_language = segment_data.get('language', 'en')
        
        translations = {}
        translations_count = 0
        
        # Translate to each target language
        for target_lang in target_languages:
            if target_lang != source_language:  # Don't translate to the same language
                try:
                    result = translate_client.translate(
                        segment_data['text'],
                        target_language=target_lang,
                        source_language=source_language
                    )
                    translations[target_lang] = result['translatedText']
                    translations_count += 1
                except Exception as e:
                    logger.warning("Failed to translate to %s: %s", target_lang, e)
                    # Continue with other languages
        
        # Update the segment document with translations
        segment_ref.update({
            'translations': translations
        })
        
        logger.info("Added %d translations to segment %s", translations_count, request.segment_id)
        
        return SegmentCreatedResponse(
            success=True,
            message=f"Successfully added {translations_count} translations",
            translations_added=translations_count
        )
        
    except Exception as e:
        logger.error("Error processing segment: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
