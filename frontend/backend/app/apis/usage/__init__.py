import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("dicta.usage")
from app.auth import AuthorizedUser
from app.libs.tier_management import get_tier_manager
from app.apis.firebase import get_firestore_db
from typing import Optional

router = APIRouter()

# Pydantic models
class TrackUsageRequest(BaseModel):
    session_id: str
    minutes_used: float

class TrackUsageResponse(BaseModel):
    success: bool
    minutes_used: float
    total_usage: float
    limit: float
    remaining: float
    message: str

class QuotaCheckResponse(BaseModel):
    can_transcribe: bool
    can_start: bool
    remaining_minutes: float
    minutes_used: float
    total_used: float
    limit: float
    tier: str
    reset_date: Optional[float] = None
    message: Optional[str] = None

class UsageStatsResponse(BaseModel):
    minutes_used: float
    minutes_remaining: float
    limit: int
    reset_date: Optional[float] = None
    warning_threshold_reached: bool
    limit_reached: bool


@router.post("/track-usage")
async def track_usage(request: TrackUsageRequest, user: AuthorizedUser) -> TrackUsageResponse:
    """
    Track usage after a transcription session completes.
    Uses TierManager for reliable tracking.
    """
    try:
        tier_manager = get_tier_manager()
        
        # Increment usage using tier_manager
        result = tier_manager.increment_usage(
            user_id=user.sub,
            minutes=request.minutes_used,
            session_id=request.session_id
        )
        
        return TrackUsageResponse(
            success=True,
            minutes_used=request.minutes_used,
            total_usage=result.get('usage_this_month', 0),
            limit=result.get('limit', 0),
            remaining=result.get('remaining_minutes', 0),
            message="Usage tracked successfully"
        )
        
    except Exception as e:
        logger.error("Error tracking usage: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to track usage: {str(e)}"
        )


@router.get("/check-quota")
async def check_quota(user: AuthorizedUser) -> QuotaCheckResponse:
    """
    Check if user can start a new transcription session.
    """
    try:
        tier_manager = get_tier_manager()
        
        # Check if user can start a session
        can_start, reason = tier_manager.can_start_session(user.sub)
        
        # Get current usage stats
        tier_data = tier_manager.get_user_tier_data(user.sub)
        minutes_used = tier_data.get('usage_this_month', 0)
        tier = tier_data.get('tier', 'free')
        limit = tier_manager.get_monthly_limit(tier)
        
        remaining = max(0, limit - minutes_used)
        
        return QuotaCheckResponse(
            can_transcribe=can_start,
            can_start=can_start,
            remaining_minutes=remaining,
            minutes_used=minutes_used,
            total_used=minutes_used,
            limit=limit,
            tier=tier,
            message=reason if not can_start else "Quota available"
        )
        
    except Exception as e:
        logger.error("Error checking quota: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check quota: {str(e)}"
        )


@router.get("/usage-stats")
async def get_usage_stats(user: AuthorizedUser) -> UsageStatsResponse:
    """
    Get detailed usage statistics for the current user.
    """
    try:
        tier_manager = get_tier_manager()
        tier_data = tier_manager.get_user_tier_data(user.sub)
        
        current_usage = tier_data.get('usage_this_month', 0)
        tier = tier_data.get('tier', 'free')
        limit = tier_manager.get_monthly_limit(tier)
        billing_anniversary = tier_data.get('billing_anniversary')
        
        reset_date = None
        if billing_anniversary:
             # Convert datetime to timestamp
             reset_date = billing_anniversary.timestamp()
        
        remaining = max(0, limit - current_usage)
        limit_reached = current_usage >= limit
        warning_threshold_reached = current_usage >= (limit * 0.9) # Warn at 90%
        
        return UsageStatsResponse(
            minutes_used=round(current_usage, 1),
            minutes_remaining=round(remaining, 1),
            limit=limit,
            reset_date=reset_date,
            warning_threshold_reached=warning_threshold_reached,
            limit_reached=limit_reached
        )
        
    except Exception as e:
        logger.error("Error getting usage stats: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get usage stats") from None

class UserUsageStats(BaseModel):
    userId: str
    email: str | None = None
    minutes_used: float
    minutes_remaining: float
    tier: str
    limit_reached: bool

class AllUsersUsageResponse(BaseModel):
    users: list[UserUsageStats]

class ResetUsageRequest(BaseModel):
    userId: str

@router.post("/reset-usage")
async def reset_usage_endpoint(request: ResetUsageRequest, user: AuthorizedUser):
    """
    Admin-only endpoint to reset usage for a user.
    """
    # Check if user is admin
    admin_emails = [
        "abereimer64@gmail.com",
        "dward@wevad.com",
        "dianareimer90@gmail.com"
    ]
    
    if user.email not in admin_emails and not user.email.endswith('@databutton.com'):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    try:
        tier_manager = get_tier_manager()
        tier_manager.reset_usage(request.userId)
        return {"success": True, "message": f"Usage reset for user {request.userId}"}
    except Exception as e:
        logger.error("Error resetting usage: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to reset usage") from e

@router.get("/all-users-usage")
async def get_all_users_usage(user: AuthorizedUser) -> AllUsersUsageResponse:
    """
    Admin-only endpoint to get usage for all users.
    """
    # Check if user is admin
    admin_emails = [
        "abereimer64@gmail.com",
        "dward@wevad.com",
        "dianareimer90@gmail.com"
    ]
    
    if user.email not in admin_emails and not user.email.endswith('@databutton.com'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        from firebase_admin import auth as firebase_auth
        tier_manager = get_tier_manager()
        
        db = get_firestore_db()
        if not db:
            raise HTTPException(status_code=500, detail="Could not get Firestore client")
        
        users_ref = db.collection('users')
        all_users = users_ref.stream()
        
        users_list = []
        
        for doc in all_users:
            user_id = doc.id
            data = doc.to_dict()
            
            usage = data.get('usageThisMonth', 0)
            tier = data.get('tier', 'free')
            limit = tier_manager.get_monthly_limit(tier)
            
            # Try to get user email from Firebase Auth
            email = None
            try:
                firebase_user = firebase_auth.get_user(user_id)
                email = firebase_user.email
            except Exception:
                email = "Unknown"
            
            remaining = max(0, limit - usage)
            
            users_list.append(UserUsageStats(
                userId=user_id,
                email=email,
                minutes_used=usage,
                minutes_remaining=remaining,
                tier=tier,
                limit_reached=usage >= limit
            ))
        
        # Sort by minutes used (descending)
        users_list.sort(key=lambda x: x.minutes_used, reverse=True)
        
        return AllUsersUsageResponse(users=users_list)
        
    except Exception as e:
        logger.error("Error getting all users usage: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to get users usage") from e
