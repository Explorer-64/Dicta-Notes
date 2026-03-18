from fastapi import APIRouter, Response
from fastapi.responses import RedirectResponse
import re

router = APIRouter()

@router.get("/set-cache-headers")
async def set_cache_headers_info():
    """Information about cache header optimization"""
    return {
        "message": "Cache headers should be set via server configuration",
        "recommendations": {
            "hashed_assets": "public, max-age=31536000, immutable",  # 1 year
            "static_assets": "public, max-age=86400",  # 1 day
            "html_pages": "public, max-age=3600"  # 1 hour
        }
    }

@router.get("/assets/{asset_path:path}")
async def serve_cached_asset(asset_path: str, response: Response):
    """Serve assets with proper cache headers"""
    
    # Check if it's a hashed asset (contains hash in filename)
    if re.search(r'-[a-f0-9]{8,}\.(js|css)$', asset_path):
        # Hashed assets can be cached for a long time
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    elif asset_path.endswith(('.js', '.css')):
        # Regular JS/CSS files
        response.headers["Cache-Control"] = "public, max-age=86400"
    elif asset_path.endswith(('.png', '.jpg', '.jpeg', '.svg', '.gif', '.ico')):
        # Images
        response.headers["Cache-Control"] = "public, max-age=604800"  # 1 week
    else:
        # Default
        response.headers["Cache-Control"] = "public, max-age=3600"
    
    # Redirect to the actual asset URL
    actual_url = f"/assets/{asset_path}"
    return RedirectResponse(url=actual_url, status_code=301)
