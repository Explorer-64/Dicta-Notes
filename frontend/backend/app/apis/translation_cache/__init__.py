import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("dicta.translation_cache")
from app.auth import AuthorizedUser
from firebase_admin import firestore
from app.apis.firebase import get_firestore_db
from typing import Dict, Any, Optional
import hashlib
import time

router = APIRouter()

# Pydantic models
class CachedTranslation(BaseModel):
    original_hash: str
    translated_content: str
    language: str
    path: str
    timestamp: int

class SaveTranslationRequest(BaseModel):
    path: str
    language: str
    original_content: str
    translated_content: str

class GetTranslationRequest(BaseModel):
    path: str
    language: str
    original_content: str

class TranslationResponse(BaseModel):
    cached_translation: Optional[CachedTranslation] = None
    cache_hit: bool
    message: str

class SaveTranslationResponse(BaseModel):
    cache_key: str
    message: str

class CacheMetrics(BaseModel):
    hits: int = 0
    misses: int = 0
    api_calls: int = 0
    saved_api_calls: int = 0

class UpdateMetricsRequest(BaseModel):
    metrics: CacheMetrics

class MetricsResponse(BaseModel):
    message: str
    updated_metrics: CacheMetrics

class CleanupResponse(BaseModel):
    message: str
    cleaned_entries: int

def generate_cache_key(path: str, language: str, content: str) -> str:
    """
    Generate a deterministic cache key for translation content
    """
    content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
    safe_path = path.strip("/").replace("/", "_") or "root"
    return f"{safe_path}-{language}-{content_hash}"

def generate_content_hash(content: str) -> str:
    """
    Generate SHA256 hash of content
    """
    return hashlib.sha256(content.encode()).hexdigest()

@router.post("/get-translation")
async def get_cached_translation(request: GetTranslationRequest, user: Optional[AuthorizedUser] = None) -> TranslationResponse:
    """
    Get a cached translation if it exists
    Now works for both authenticated and anonymous users
    """
    try:
        # Generate cache key
        cache_key = generate_cache_key(request.path, request.language, request.original_content)
        content_hash = generate_content_hash(request.original_content)
        
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Check cache
        cache_ref = db.collection('translationCache').document(cache_key)
        cache_doc = cache_ref.get()
        
        if cache_doc.exists:
            cache_data = cache_doc.to_dict()
            
            # Verify content hasn't changed by comparing hashes
            if cache_data.get('originalHash') == content_hash:
                cached_translation = CachedTranslation(
                    original_hash=cache_data['originalHash'],
                    translated_content=cache_data['translatedContent'],
                    language=cache_data['language'],
                    path=cache_data['path'],
                    timestamp=cache_data['timestamp']
                )
                
                user_type = "authenticated" if user else "anonymous"
                logger.debug("Cache hit for %s in %s (%s)", request.path, request.language, user_type)
                
                return TranslationResponse(
                    cached_translation=cached_translation,
                    cache_hit=True,
                    message="Translation found in cache"
                )
        
        user_type = "authenticated" if user else "anonymous"
        logger.debug("Cache miss for %s in %s (%s)", request.path, request.language, user_type)
        
        return TranslationResponse(
            cached_translation=None,
            cache_hit=False,
            message="No cached translation found"
        )
        
    except Exception as e:
        logger.error("Error getting cached translation: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get cached translation") from None

@router.post("/save-translation")
async def save_translation(request: SaveTranslationRequest, user: Optional[AuthorizedUser] = None) -> SaveTranslationResponse:
    """
    Save a translation to the cache
    Now works for both authenticated and anonymous users
    """
    try:
        # Generate cache key and content hash
        cache_key = generate_cache_key(request.path, request.language, request.original_content)
        content_hash = generate_content_hash(request.original_content)
        
        # Create cache entry
        cache_data = {
            'originalHash': content_hash,
            'translatedContent': request.translated_content,
            'language': request.language,
            'path': request.path,
            'timestamp': int(time.time() * 1000)  # milliseconds
        }
        
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Save to cache
        cache_ref = db.collection('translationCache').document(cache_key)
        cache_ref.set(cache_data)
        
        user_type = "authenticated" if user else "anonymous"
        logger.info("Translation cached for %s in %s (%s)", request.path, request.language, user_type)
        
        return SaveTranslationResponse(
            cache_key=cache_key,
            message="Translation saved to cache successfully"
        )
        
    except Exception as e:
        logger.error("Error saving translation to cache: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save translation to cache") from None

@router.post("/update-metrics")
async def update_metrics(request: UpdateMetricsRequest, user: AuthorizedUser) -> MetricsResponse:
    """
    Update global translation cache metrics
    """
    try:
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Get current metrics
        metrics_ref = db.collection('translationMetrics').document('global')
        metrics_doc = metrics_ref.get()
        
        if metrics_doc.exists:
            current_metrics = metrics_doc.to_dict()
            # Update existing metrics
            updated_metrics = {
                'totalHits': current_metrics.get('totalHits', 0) + request.metrics.hits,
                'totalMisses': current_metrics.get('totalMisses', 0) + request.metrics.misses,
                'totalApiCalls': current_metrics.get('totalApiCalls', 0) + request.metrics.api_calls,
                'totalSavedApiCalls': current_metrics.get('totalSavedApiCalls', 0) + request.metrics.saved_api_calls,
                'lastUpdated': firestore.SERVER_TIMESTAMP
            }
        else:
            # Create new metrics
            updated_metrics = {
                'totalHits': request.metrics.hits,
                'totalMisses': request.metrics.misses,
                'totalApiCalls': request.metrics.api_calls,
                'totalSavedApiCalls': request.metrics.saved_api_calls,
                'lastUpdated': firestore.SERVER_TIMESTAMP
            }
        
        metrics_ref.set(updated_metrics, merge=True)
        
        logger.info("Metrics updated: hits +%d, misses +%d, api_calls +%d", request.metrics.hits, request.metrics.misses, request.metrics.api_calls)
        
        return MetricsResponse(
            message="Metrics updated successfully",
            updated_metrics=CacheMetrics(
                hits=updated_metrics['totalHits'],
                misses=updated_metrics['totalMisses'],
                api_calls=updated_metrics['totalApiCalls'],
                saved_api_calls=updated_metrics['totalSavedApiCalls']
            )
        )
        
    except Exception as e:
        logger.error("Error updating metrics: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update metrics") from None

@router.post("/cleanup")
async def cleanup_cache(user: AuthorizedUser) -> CleanupResponse:
    """
    Clean up old cache entries to prevent excessive growth
    """
    try:
        # Get Firestore client
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        # Define cache expiry (30 days)
        cache_expiry_ms = 30 * 24 * 60 * 60 * 1000  # 30 days in milliseconds
        cutoff_timestamp = int(time.time() * 1000) - cache_expiry_ms
        
        # Query old cache entries
        cache_ref = db.collection('translationCache')
        old_entries = cache_ref.where('timestamp', '<', cutoff_timestamp).limit(100).get()
        
        cleaned_count = 0
        batch = db.batch()
        
        for doc in old_entries:
            batch.delete(doc.reference)
            cleaned_count += 1
        
        if cleaned_count > 0:
            batch.commit()
            logger.info("Cleaned up %d old cache entries", cleaned_count)
        
        return CleanupResponse(
            message=f"Cache cleanup completed. Removed {cleaned_count} old entries.",
            cleaned_entries=cleaned_count
        )
        
    except Exception as e:
        logger.error("Error during cache cleanup: %s", e)
        raise HTTPException(status_code=500, detail="Failed to cleanup cache") from None
