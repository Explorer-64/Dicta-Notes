import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

logger = logging.getLogger("dicta.google_search_console")
import requests
from typing import List, Optional
import json
from app.libs.secret_manager import get_secret
from google.oauth2 import service_account
from googleapiclient.discovery import build

router = APIRouter()

class IndexingRequest(BaseModel):
    url: str
    type: str = "URL_UPDATED"  # URL_UPDATED or URL_DELETED

class BatchIndexingRequest(BaseModel):
    urls: List[str]
    type: str = "URL_UPDATED"

class IndexingResponse(BaseModel):
    url: str
    status: str
    message: str

class BatchIndexingResponse(BaseModel):
    results: List[IndexingResponse]
    total: int
    successful: int
    failed: int

@router.post("/request-indexing")
async def request_indexing(request: IndexingRequest) -> IndexingResponse:
    """
    Request Google to index or re-index a specific URL.
    Requires Google Search Console API credentials to be set up.
    """
    try:
        # Get service account credentials
        service_account_json = get_secret("GOOGLE_SEARCH_CONSOLE_CREDENTIALS")
        
        if not service_account_json:
            raise HTTPException(
                status_code=500, 
                detail="Google Search Console credentials not configured. Please add GOOGLE_SEARCH_CONSOLE_CREDENTIALS secret."
            )
        
        # Parse credentials and create service account
        credentials_dict = json.loads(service_account_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_dict,
            scopes=["https://www.googleapis.com/auth/indexing"]
        )
        
        # Build the Indexing API service
        service = build('indexing', 'v3', credentials=credentials)
        
        # Prepare the request body
        body = {
            "url": request.url,
            "type": request.type
        }
        
        # Submit the indexing request
        response = service.urlNotifications().publish(body=body).execute()
        
        logger.info("Successfully submitted %s for indexing: %s", request.url, response)
        
        return IndexingResponse(
            url=request.url,
            status="success",
            message=f"Successfully submitted to Google for {request.type.lower().replace('_', ' ')}"
        )
        
    except Exception as e:
        logger.error("Error requesting indexing for %s: %s", request.url, e)
        return IndexingResponse(
            url=request.url,
            status="failed",
            message=str(e)
        )

@router.post("/batch-request-indexing")
async def batch_request_indexing(request: BatchIndexingRequest) -> BatchIndexingResponse:
    """
    Request Google to index or re-index multiple URLs.
    Processes URLs in batch for efficiency.
    """
    results = []
    successful = 0
    failed = 0
    
    for url in request.urls:
        try:
            response = await request_indexing(IndexingRequest(url=url, type=request.type))
            results.append(response)
            if response.status == "success":
                successful += 1
            else:
                failed += 1
        except Exception as e:
            results.append(IndexingResponse(
                url=url,
                status="failed",
                message=str(e)
            ))
            failed += 1
    
    return BatchIndexingResponse(
        results=results,
        total=len(request.urls),
        successful=successful,
        failed=failed
    )

@router.get("/language-pages")
async def get_language_pages() -> dict:
    """
    Get list of all 26 language landing pages that need re-indexing.
    These are the pages that were fixed in MYA-560.
    """
    base_url = "https://dicta-notes.com"
    
    language_pages = [
        "/spanish", "/french", "/german", "/portuguese", "/chinese",
        "/japanese", "/arabic", "/hindi", "/russian", "/korean",
        "/vietnamese", "/bengali", "/turkish", "/thai", "/tagalog",
        "/indonesian", "/telugu", "/tamil", "/punjabi", "/polish",
        "/afrikaans", "/malay", "/swahili", "/hausa", "/yoruba", "/zulu"
    ]
    
    full_urls = [f"{base_url}{path}" for path in language_pages]
    
    return {
        "language_pages": full_urls,
        "total": len(full_urls),
        "base_url": base_url
    }

@router.post("/reindex-language-pages")
async def reindex_language_pages() -> BatchIndexingResponse:
    """
    Convenience endpoint to re-index all 26 language pages at once.
    These pages were fixed in MYA-560 and need Google to re-crawl them.
    """
    # Get all language page URLs
    pages_data = await get_language_pages()
    urls = pages_data["language_pages"]
    
    # Submit batch indexing request
    return await batch_request_indexing(BatchIndexingRequest(urls=urls))
