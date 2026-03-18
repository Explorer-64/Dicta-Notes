import logging
from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from app.libs.secret_manager import get_secret
from app.libs.transcription_utils import process_transcription_job

router = APIRouter()
logger = logging.getLogger("dicta.transcription_task")


class TranscriptionTaskPayload(BaseModel):
    session_id: str
    user_id: str
    client_duration: Optional[float] = None


@router.post("/run_transcription_task", status_code=200)
def run_transcription_task(
    payload: TranscriptionTaskPayload,
    x_transcription_task_secret: Optional[str] = Header(None),
):
    """
    Cloud Tasks worker endpoint. Called by Google Cloud Tasks to process a
    transcription job durably. Not callable by end users — protected by a
    shared secret header verified against Secret Manager.
    """
    expected_secret = get_secret("TRANSCRIPTION_TASK_SECRET")
    if not expected_secret or x_transcription_task_secret != expected_secret:
        logger.warning(
            "Rejected transcription task request — invalid or missing secret header"
        )
        raise HTTPException(status_code=403, detail="Forbidden")

    logger.info(
        "Cloud Tasks worker: starting transcription for session %s (user %s)",
        payload.session_id,
        payload.user_id,
    )
    process_transcription_job(payload.session_id, payload.user_id, payload.client_duration)
    return {"status": "completed", "session_id": payload.session_id}
