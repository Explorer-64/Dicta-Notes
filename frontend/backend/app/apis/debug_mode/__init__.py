from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.env import mode, Mode

router = APIRouter()

class ModeDebugResponse(BaseModel):
    message: str
    mode: str
    is_dev: bool
    is_prod: bool
    
@router.get("/debug-mode")
def debug_mode() -> ModeDebugResponse:
    """Debug endpoint - disabled in production to avoid leaking env info."""
    if mode == Mode.PROD:
        raise HTTPException(status_code=404, detail="Not found")
    return ModeDebugResponse(
        message="This endpoint created to help debug the mode detection issue",
        mode=mode.value,
        is_dev=mode == Mode.DEV,
        is_prod=mode == Mode.PROD
    )
