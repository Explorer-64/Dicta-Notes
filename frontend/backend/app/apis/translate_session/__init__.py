import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from firebase_admin import firestore
from app.auth import AuthorizedUser
from app.apis.gemini_client import get_gemini_client
from app.libs.tier_management import TierManager

logger = logging.getLogger("dicta.translate_session")

router = APIRouter()

try:
    db_firestore = firestore.client()
except Exception as e:
    logger.error("Error initializing Firestore client: %s", e)
    db_firestore = None

LANGUAGE_NAMES = {
    'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
    'it': 'Italian', 'ja': 'Japanese', 'zh': 'Chinese', 'ko': 'Korean',
    'ru': 'Russian', 'ar': 'Arabic', 'hi': 'Hindi', 'pt': 'Portuguese',
    'bn': 'Bengali', 'tr': 'Turkish', 'vi': 'Vietnamese', 'th': 'Thai',
    'nl': 'Dutch', 'sv': 'Swedish', 'pl': 'Polish', 'uk': 'Ukrainian',
    'cs': 'Czech', 'he': 'Hebrew', 'id': 'Indonesian', 'ms': 'Malay',
    'ro': 'Romanian', 'el': 'Greek', 'hu': 'Hungarian', 'fi': 'Finnish',
    'da': 'Danish', 'no': 'Norwegian', 'sk': 'Slovak', 'fa': 'Persian',
    'ur': 'Urdu', 'ta': 'Tamil', 'te': 'Telugu', 'ml': 'Malayalam',
}


class TranslateSessionRequest(BaseModel):
    session_id: str
    target_language: str


class TranslateSessionResponse(BaseModel):
    success: bool
    segment_count: int
    target_language: str
    translations: list[str]


def _batch_translate(texts: list[str], target_language: str) -> list[str]:
    """Translate all texts in a single Gemini call and return parallel list."""
    lang_name = LANGUAGE_NAMES.get(target_language, target_language)
    model = get_gemini_client('gemini-2.5-flash')

    input_json = json.dumps(texts, ensure_ascii=False)
    prompt = (
        f"Translate each text in the following JSON array to {lang_name}.\n"
        f"Return ONLY a valid JSON array with exactly the same number of elements in the same order.\n"
        f"Do not add any commentary, markdown, or code fences — only the raw JSON array.\n\n"
        f"Input:\n{input_json}"
    )

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip markdown code fences if Gemini wrapped it
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    translations = json.loads(raw)
    if not isinstance(translations, list) or len(translations) != len(texts):
        raise ValueError(f"Unexpected response shape: expected {len(texts)} items, got {len(translations)}")
    return [str(t) for t in translations]


def _translate_individually(texts: list[str], target_language: str) -> list[str]:
    """Fallback: translate each segment one-by-one."""
    lang_name = LANGUAGE_NAMES.get(target_language, target_language)
    model = get_gemini_client('gemini-2.5-flash')
    results = []
    for text in texts:
        prompt = (
            f"Translate the following text to {lang_name}.\n"
            f"Return ONLY the translated text, nothing else.\n\n{text}"
        )
        resp = model.generate_content(prompt)
        results.append(resp.text.strip())
    return results


@router.post("/translate_session")
def translate_session(
    request: TranslateSessionRequest,
    user: AuthorizedUser,
) -> TranslateSessionResponse:
    """Batch-translate all segments of a session and save to Firestore."""
    if db_firestore is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    user_id = user.sub

    # Tier gate
    tier_manager = TierManager()
    can_translate, gate_message = tier_manager.can_use_translation(user_id)
    if not can_translate:
        raise HTTPException(
            status_code=403,
            detail=gate_message or "Translation is not available on the Free plan. Upgrade to Individual or higher.",
        )

    # Load session
    session_ref = db_firestore.collection("sessions").document(request.session_id)
    session_snap = session_ref.get()
    if not session_snap.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    session_data = session_snap.to_dict()

    # Verify ownership (field is camelCase "userId" to match the rest of the codebase)
    if session_data.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    segments = session_data.get("segments", [])
    if not segments:
        raise HTTPException(status_code=400, detail="Session has no segments to translate")

    texts = [seg.get("text", "") for seg in segments]

    # Batch translate — fall back to individual if batch fails
    try:
        translations = _batch_translate(texts, request.target_language)
        logger.info("Batch-translated %d segments for session %s", len(texts), request.session_id)
    except Exception as exc:
        logger.warning("Batch translation failed (%s), falling back to individual calls", exc)
        try:
            translations = _translate_individually(texts, request.target_language)
        except Exception as exc2:
            logger.error("Individual translation also failed: %s", exc2)
            raise HTTPException(status_code=500, detail=f"Translation failed: {exc2}") from exc2

    # Save to Firestore subcollection
    translation_ref = (
        session_ref
        .collection("translations")
        .document(request.target_language)
    )
    translation_ref.set({
        "langCode": request.target_language,
        "texts": translations,
        "segmentCount": len(translations),
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    logger.info("Saved translation for session %s lang %s", request.session_id, request.target_language)

    return TranslateSessionResponse(
        success=True,
        segment_count=len(translations),
        target_language=request.target_language,
        translations=translations,
    )
