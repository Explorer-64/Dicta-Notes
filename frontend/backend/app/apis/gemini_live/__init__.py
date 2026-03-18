import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("dicta.gemini_live")
from app.libs.secret_manager import get_secret

router = APIRouter()

class GeminiWebSocketURLResponse(BaseModel):
    ws_url: str

@router.get("/gemini-ws-url")
async def get_gemini_websocket_url() -> GeminiWebSocketURLResponse:
    """
    Get the WebSocket URL for Gemini 2.5 Flash Live API
    Returns the URL with embedded API key for frontend WebSocket connection
    """
    try:
        api_key = get_secret("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not found in secrets")
        
        ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={api_key}"
        
        return GeminiWebSocketURLResponse(ws_url=ws_url)
        
    except Exception as e:
        logger.error("Error getting Gemini WebSocket URL: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get Gemini WebSocket URL") from e