from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict

# Stub router to satisfy imports - minimal implementation
router = APIRouter()

class AudioChunkRequest(BaseModel):
    audio_data: str
    session_id: str = "default"
    
class AudioChunkResponse(BaseModel):
    status: str = "received"
    message: str = "Audio chunk processed"

@router.post("/process-audio-chunk")
def process_audio_chunk(request: AudioChunkRequest) -> AudioChunkResponse:
    """Stub endpoint for audio chunk processing"""
    return AudioChunkResponse(
        status="received",
        message="Audio chunk received - stub implementation"
    )

@router.get("/health")
def health_check() -> Dict[str, Any]:
    """Health check for http_transceiver"""
    return {"status": "ok", "service": "http_transceiver_stub"}
