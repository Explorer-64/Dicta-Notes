import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("dicta.error_logging")
from typing import Optional, List
import json
from app.libs.storage_manager import get_json as storage_get_json, put_json as storage_put_json
from datetime import datetime
import traceback

router = APIRouter(prefix="/error-logging")

class ErrorLogRequest(BaseModel):
    level: str  # 'error', 'warning', 'info'
    message: str
    component: Optional[str] = None
    stack: Optional[str] = None
    url: Optional[str] = None
    userAgent: Optional[str] = None
    source: Optional[str] = 'backend'
    errorType: Optional[str] = None
    metadata: Optional[dict] = None

class ErrorLogResponse(BaseModel):
    success: bool
    errorId: Optional[str] = None
    message: str

class ErrorQueryResponse(BaseModel):
    errors: List[dict]
    total: int
    hasMore: bool

@router.post("/log", response_model=ErrorLogResponse)
async def log_error(error_data: ErrorLogRequest):
    """Log an error to backend storage for admin review"""
    try:
        # Create unique error ID
        timestamp = datetime.utcnow().isoformat()
        error_id = f"err_{int(datetime.utcnow().timestamp())}_{hash(error_data.message) % 10000}"
        
        # Prepare error log entry
        error_entry = {
            "id": error_id,
            "timestamp": timestamp,
            "level": error_data.level,
            "message": error_data.message,
            "component": error_data.component,
            "stack": error_data.stack,
            "url": error_data.url,
            "userAgent": error_data.userAgent,
            "source": error_data.source or 'backend',
            "errorType": error_data.errorType,
            "metadata": error_data.metadata or {}
        }
        
        # Store in databutton storage
        try:
            # Get existing error logs
            existing_logs = storage_get_json("admin_error_logs", default=[]) or []
            
            # Add new error to the beginning
            existing_logs.insert(0, error_entry)
            
            # Keep only last 1000 errors to prevent storage bloat
            if len(existing_logs) > 1000:
                existing_logs = existing_logs[:1000]
            
            # Save back to storage
            storage_put_json("admin_error_logs", existing_logs)
            
            logger.info("[ERROR LOG] %s: %s", error_data.level.upper(), error_data.message)
            
            return ErrorLogResponse(
                success=True,
                errorId=error_id,
                message="Error logged successfully"
            )
            
        except Exception as storage_error:
            logger.error("Failed to store error log: %s", storage_error)
            return ErrorLogResponse(
                success=False,
                message=f"Failed to store error: {str(storage_error)}"
            )
            
    except Exception as e:
        logger.error("Error in log_error endpoint: %s", e)
        logger.debug("%s", traceback.format_exc())
        return ErrorLogResponse(
            success=False,
            message=f"Failed to process error log: {str(e)}"
        )

@router.get("/recent", response_model=ErrorQueryResponse)
async def get_recent_errors(limit: int = 100, level: Optional[str] = None):
    """Get recent error logs for admin review"""
    try:
        # Get error logs from storage
        all_errors = storage_get_json("admin_error_logs", default=[]) or []
        
        # Filter by level if specified
        if level:
            filtered_errors = [err for err in all_errors if err.get('level') == level]
        else:
            filtered_errors = all_errors
        
        # Apply limit
        result_errors = filtered_errors[:limit]
        
        return ErrorQueryResponse(
            errors=result_errors,
            total=len(filtered_errors),
            hasMore=len(filtered_errors) > limit
        )
        
    except Exception as e:
        logger.error("Error fetching error logs: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to fetch error logs: {str(e)}") from e

@router.post("/clear")
async def clear_error_logs():
    """Clear all error logs (admin only)"""
    try:
        storage_put_json("admin_error_logs", [])
        return {"success": True, "message": "Error logs cleared successfully"}
    except Exception as e:
        logger.error("Error clearing error logs: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to clear error logs: {str(e)}") from e

@router.get("/stats")
async def get_error_stats():
    """Get error statistics for admin dashboard"""
    try:
        all_errors = storage_get_json("admin_error_logs", default=[]) or []
        
        # Calculate stats
        total_errors = len(all_errors)
        error_levels = {}
        error_sources = {}
        recent_errors = 0
        
        # Get current timestamp for "recent" calculation (last 24 hours)
        current_time = datetime.utcnow()
        
        for error in all_errors:
            # Count by level
            level = error.get('level', 'unknown')
            error_levels[level] = error_levels.get(level, 0) + 1
            
            # Count by source
            source = error.get('source', 'unknown')
            error_sources[source] = error_sources.get(source, 0) + 1
            
            # Count recent errors (last 24 hours)
            try:
                error_time = datetime.fromisoformat(error.get('timestamp', '').replace('Z', '+00:00'))
                if (current_time - error_time).total_seconds() < 86400:  # 24 hours
                    recent_errors += 1
            except (KeyError, ValueError) as e:
                logger.warning("Could not process error log timestamp: %s", e)
                # You might want to skip this error or handle it differently
                pass
        
        return {
            "totalErrors": total_errors,
            "recentErrors24h": recent_errors,
            "errorsByLevel": error_levels,
            "errorsBySource": error_sources,
            "lastUpdated": current_time.isoformat()
        }
        
    except Exception as e:
        logger.error("Error getting error stats: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to get error stats: {str(e)}") from e
