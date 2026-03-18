from fastapi import APIRouter, Response
from app.libs.secret_manager import get_secret

router = APIRouter()

@router.get("/f7c8e3d5b81745c69ce789f2e3ad0d67.txt")
async def serve_bing_verification_key():
    """
    Serves the Bing IndexNow verification key at the path Bing expects.
    This endpoint must be accessible at https://dicta-notes.com/f7c8e3d5b81745c69ce789f2e3ad0d67.txt
    """
    api_key = get_secret("BING_INDEXNOW_API_KEY")
    
    # Return plain text response with just the API key
    return Response(
        content=api_key,
        media_type="text/plain",
        headers={
            "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
        }
    )
