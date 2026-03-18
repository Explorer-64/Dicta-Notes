import requests
from app.libs.secret_manager import get_secret
from typing import List, Dict

INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"


def get_site_host() -> str:
    """Return the production site host (without protocol). Keep simple on purpose."""
    # We notify for the production host only
    return "dicta-notes.com"


def get_key_location() -> str:
    """Public location of the IndexNow/Bing auth key file."""
    # IMPORTANT: In production, backend routes are mounted under /api (no /routes)
    # The verification endpoint is defined at path "/f7c8e3d5b81745c69ce789f2e3ad0d67.txt"
    # Therefore the full URL is https://dicta-notes.com/api/f7c8e3d5b81745c69ce789f2e3ad0d67.txt
    return f"https://{get_site_host()}/api/f7c8e3d5b81745c69ce789f2e3ad0d67.txt"


def submit_to_indexnow(urls: List[str]) -> Dict:
    """
    Submit a list of URLs (pages or sitemaps) to IndexNow (Bing, Yandex, etc.).

    Returns a summary dict with status code and response text.
    """
    # Deduplicate and sanitize
    unique_urls = sorted(set([u.strip() for u in urls if u and u.strip()]))
    if not unique_urls:
        return {"submitted": [], "status_code": 400, "response": "No URLs to submit"}

    api_key = get_secret("BING_INDEXNOW_API_KEY")
    if not api_key:
        # Fail fast with actionable message (don't log secrets)
        return {"submitted": unique_urls, "status_code": 500, "response": "Missing BING_INDEXNOW_API_KEY secret"}

    payload = {
        "host": get_site_host(),
        "key": api_key,
        "keyLocation": get_key_location(),
        "urlList": unique_urls,
    }

    try:
        resp = requests.post(INDEXNOW_ENDPOINT, json=payload, timeout=10)
        return {
            "submitted": unique_urls,
            "status_code": resp.status_code,
            "response": resp.text[:500],  # avoid logging huge bodies
        }
    except Exception as e:
        return {
            "submitted": unique_urls,
            "status_code": 500,
            "response": f"Request failed: {type(e).__name__}: {e}",
        }
