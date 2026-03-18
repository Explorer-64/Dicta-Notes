from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
import httpx
from app.libs.secret_manager import get_secret
from urllib.parse import urlparse
from fastapi.responses import PlainTextResponse
import logging

logger = logging.getLogger("dicta.bing_indexnow")

router = APIRouter(prefix="/bing-indexnow", tags=["Bing IndexNow"])

BING_API_URL = "https://www.bing.com/indexnow"

class SubmitUrlRequest(BaseModel):
    url: str  # Simplified - just the URL

class IndexNowResponse(BaseModel):
    message: str
    status_code: int

@router.post("/submit-url", response_model=IndexNowResponse)
async def submit_url_to_bing(payload: SubmitUrlRequest):
    """
    Submits a single URL to the Bing IndexNow API.
    Automatically extracts the host from the URL.
    This endpoint is open (no authentication required).
    """
    # Get API key from secrets
    api_key = get_secret("BING_INDEXNOW_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Bing IndexNow API key not configured")

    # Extract host from URL
    parsed_url = urlparse(payload.url)
    host = parsed_url.netloc
    
    logger.info(f"Submitting to Bing: {payload.url}")
    logger.info(f"Host: {host}")
    
    # Use keyLocation to point to our accessible verification file
    request_body = {
        "host": host,
        "key": api_key,
        "keyLocation": f"https://{host}/f7c8e3d5b81745c69ce789f2e3ad0d67.txt",
        "urlList": [payload.url]
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(BING_API_URL, json=request_body, timeout=30.0)
            
            logger.info(f"Bing response: {response.status_code} - {response.text}")

            if response.status_code in [200, 202]:
                return IndexNowResponse(
                    message=f"✅ URL submitted successfully to Bing IndexNow",
                    status_code=response.status_code
                )
            else:
                error_message = response.text or f"Error code: {response.status_code}"
                
                if response.status_code == 403:
                    return IndexNowResponse(
                        message=f"❌ Bing denied access. Verification file issue.", 
                        status_code=response.status_code
                    )
                elif response.status_code == 422:
                    return IndexNowResponse(
                        message=f"❌ Bing could not process the URL", 
                        status_code=response.status_code
                    )
                else:
                    return IndexNowResponse(
                        message=f"⚠️ Unexpected response: {error_message}", 
                        status_code=response.status_code
                    )

        except Exception as e:
            logger.error(f"Error submitting to Bing: {e}")
            raise HTTPException(
                detail=f"Bing IndexNow submission failed: {str(e)}",
                status_code=500
            )
