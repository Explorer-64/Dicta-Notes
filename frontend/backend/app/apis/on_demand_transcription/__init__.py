import json
import logging
import os
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.auth import AuthorizedUser
from app.libs.transcription_utils import process_transcription_job
from app.apis.firebase import get_firestore_db

router = APIRouter()
logger = logging.getLogger("dicta.on_demand_transcription")


class RetranscribeRequest(BaseModel):
    audio_duration_seconds: Optional[float] = None


def _enqueue_cloud_task(session_id: str, user_id: str, client_duration: Optional[float]) -> bool:
    """
    Submit a Cloud Tasks HTTP task pointing to the /run_transcription_task worker.
    Returns True if the task was enqueued, False if Cloud Tasks is not configured
    (falls back to in-process BackgroundTasks in that case).
    """
    cloud_run_url = os.environ.get("CLOUD_RUN_URL", "").rstrip("/")
    project = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GCP_PROJECT")
    location = os.environ.get("CLOUD_TASKS_LOCATION", "us-central1")

    if not cloud_run_url or not project:
        return False

    try:
        from google.cloud import tasks_v2
        from app.libs.secret_manager import get_secret

        secret = get_secret("TRANSCRIPTION_TASK_SECRET")
        payload = json.dumps({
            "session_id": session_id,
            "user_id": user_id,
            "client_duration": client_duration,
        }).encode()

        client = tasks_v2.CloudTasksClient()
        queue_path = client.queue_path(project, location, "transcription-tasks")

        task = {
            "http_request": {
                "http_method": tasks_v2.HttpMethod.POST,
                "url": f"{cloud_run_url}/routes/run_transcription_task",
                "headers": {
                    "Content-Type": "application/json",
                    "X-Transcription-Task-Secret": secret,
                },
                "body": payload,
            }
        }

        response = client.create_task(request={"parent": queue_path, "task": task})
        logger.info("Enqueued Cloud Task for session %s: %s", session_id, response.name)
        return True

    except Exception as e:
        logger.warning("Failed to enqueue Cloud Task for session %s: %s — falling back to BackgroundTasks", session_id, e)
        return False


@router.post("/transcribe_session/{session_id}", status_code=202)
async def initiate_on_demand_transcription(
    session_id: str,
    background_tasks: BackgroundTasks,
    user: AuthorizedUser,
    body: Optional[RetranscribeRequest] = None,
):
    """
    Initiates an on-demand transcription for a given session.
    On Cloud Run, submits a durable Cloud Task so the job survives instance restarts.
    Falls back to FastAPI BackgroundTasks for local development.
    """
    firestore_db = get_firestore_db()
    if not firestore_db:
        raise HTTPException(status_code=500, detail="Firestore is not available.")

    session_ref = firestore_db.collection("sessions").document(session_id)
    session_doc = session_ref.get()

    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found.")

    session_data = session_doc.to_dict()

    if session_data.get("userId") != user.sub:
        raise HTTPException(status_code=403, detail="You do not have permission to transcribe this session.")

    try:
        session_ref.update({
            "transcription_status": "processing",
            "transcription_error": None,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update session status: {e}") from e

    client_duration = body.audio_duration_seconds if body else None

    if not _enqueue_cloud_task(session_id, user.sub, client_duration):
        logger.info("Using BackgroundTasks fallback for session %s (dev mode)", session_id)
        background_tasks.add_task(process_transcription_job, session_id, user.sub, client_duration)

    return {"message": "Transcription process started."}
