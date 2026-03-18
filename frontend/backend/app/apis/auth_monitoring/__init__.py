from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
from app.libs.storage_manager import put_json, get_json, list_files
from app.libs.secret_manager import get_secret
from app.libs.email_helper import send_email
import logging

logger = logging.getLogger("dicta.auth_monitoring")

router = APIRouter()

class AuthErrorReport(BaseModel):
    error_code: str
    error_message: str
    user_agent: str
    url: str
    timestamp: str
    auth_method: str  # 'popup' or 'redirect'
    browser_info: Optional[str] = None
    device_info: Optional[str] = None

class AuthSuccessReport(BaseModel):
    auth_method: str
    user_agent: str
    timestamp: str
    user_id: Optional[str] = None
    browser_info: Optional[str] = None
    device_info: Optional[str] = None

@router.post("/auth-error")
async def log_auth_error(report: AuthErrorReport, request: Request):
    """Log authentication errors for monitoring"""
    try:
        # Store error in JSON storage for analysis
        error_data = {
            "timestamp": report.timestamp,
            "error_code": report.error_code,
            "error_message": report.error_message,
            "user_agent": report.user_agent,
            "url": report.url,
            "auth_method": report.auth_method,
            "browser_info": report.browser_info,
            "device_info": report.device_info,
            "client_ip": request.client.host if request.client else None
        }
        
        # Save to storage with timestamp-based key
        key = f"auth_errors_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(report.user_agent) % 10000}"
        put_json(key, error_data)

        # Critical errors - send email alert
        if report.error_code in ['auth/popup-blocked', 'auth/redirect-operation-pending',
                                'auth/too-many-requests', 'auth/network-request-failed']:
            try:
                support_email = get_secret("SUPPORT_EMAIL")
                if support_email:
                    send_email(
                        to=support_email,
                        subject=f"🚨 Critical Auth Error: {report.error_code}",
                        html=f"""
                        <h2>Authentication Error Alert</h2>
                        <p><strong>Error:</strong> {report.error_code}</p>
                        <p><strong>Message:</strong> {report.error_message}</p>
                        <p><strong>User Agent:</strong> {report.user_agent}</p>
                        <p><strong>Auth Method:</strong> {report.auth_method}</p>
                        <p><strong>URL:</strong> {report.url}</p>
                        <p><strong>Time:</strong> {report.timestamp}</p>
                        <p><strong>Browser:</strong> {report.browser_info}</p>
                        <p><strong>Device:</strong> {report.device_info}</p>
                        """,
                        skip_translation=True,
                    )
            except Exception as e:
                logger.error(f"Failed to send auth error email: {e}")
        
        logger.info(f"[AUTH_ERROR] {report.error_code}: {report.error_message} | {report.user_agent}")
        return {"status": "logged"}
        
    except Exception as e:
        logger.error(f"Failed to log auth error: {e}")
        return {"status": "failed", "error": str(e)}

@router.post("/auth-success")
async def log_auth_success(report: AuthSuccessReport, request: Request):
    """Log successful authentications for monitoring"""
    try:
        success_data = {
            "timestamp": report.timestamp,
            "auth_method": report.auth_method,
            "user_agent": report.user_agent,
            "user_id": report.user_id,
            "browser_info": report.browser_info,
            "device_info": report.device_info,
            "client_ip": request.client.host if request.client else None
        }
        
        # Save success to storage
        key = f"auth_success_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(report.user_agent) % 10000}"
        put_json(key, success_data)
        
        logger.info(f"[AUTH_SUCCESS] {report.auth_method} | {report.user_agent}")
        return {"status": "logged"}
        
    except Exception as e:
        logger.error(f"Failed to log auth success: {e}")
        return {"status": "failed", "error": str(e)}

@router.get("/auth-stats")
async def get_auth_stats():
    """Get authentication statistics for monitoring"""
    try:
        # Get recent auth errors and successes
        error_files = list_files("auth_errors_")
        success_files = list_files("auth_success_")

        error_count = len(error_files)
        success_count = len(success_files)

        # Get recent errors for analysis
        recent_errors = []
        for name in error_files:
            try:
                error_data = get_json(name)
                if error_data:
                    recent_errors.append(error_data)
            except Exception:
                continue
        
        # Sort by timestamp and get last 10
        recent_errors = sorted(recent_errors, key=lambda x: x.get('timestamp', ''), reverse=True)[:10]
        
        return {
            "total_errors": error_count,
            "total_successes": success_count,
            "success_rate": round(success_count / (success_count + error_count) * 100, 2) if (success_count + error_count) > 0 else 0,
            "recent_errors": recent_errors
        }
        
    except Exception as e:
        logger.error(f"Failed to get auth stats: {e}")
        return {"error": str(e)}
