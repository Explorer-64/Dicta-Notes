"""Feature gating endpoints for tier-based access control.

Provides endpoints for checking if users can access specific features
based on their subscription tier.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.auth import AuthorizedUser
from app.libs.tier_management import TierManager

router = APIRouter()

# Initialize tier manager
tier_manager = TierManager()

class FeatureCheckResponse(BaseModel):
    """Response for feature gate checks."""
    can_access: bool
    message: Optional[str] = None
    tier: str
    
class TranslationCheckResponse(BaseModel):
    """Response for translation feature check."""
    can_translate: bool
    message: Optional[str] = None
    tier: str

class ExportFormatCheckRequest(BaseModel):
    """Request to check export format access."""
    format: str  # 'txt', 'markdown', or 'pdf'

class ExportFormatCheckResponse(BaseModel):
    """Response for export format check."""
    can_export: bool
    message: Optional[str] = None
    tier: str
    format: str

class SessionCreationCheckResponse(BaseModel):
    """Response for session creation check."""
    can_create: bool
    message: Optional[str] = None
    tier: str
    current_session_count: Optional[int] = None
    session_limit: Optional[int] = None
    quota_minutes_used: float
    quota_minutes_limit: float
    quota_minutes_remaining: float

class TeamSharingCheckResponse(BaseModel):
    """Response for team sharing check."""
    can_share: bool
    message: Optional[str] = None
    tier: str
    team_size_limit: Optional[int] = None

class ApiAccessCheckResponse(BaseModel):
    """Response for API access check."""
    can_use_api: bool
    message: Optional[str] = None
    tier: str


@router.get("/check-translation", response_model=TranslationCheckResponse)
def check_translation_access(user: AuthorizedUser) -> TranslationCheckResponse:
    """Check if user can access translation features.
    
    Free: No translation
    Individual+: Translation enabled
    """
    user_id = user.sub
    can_translate, message = tier_manager.can_use_translation(user_id)
    tier_data = tier_manager.get_user_tier_data(user_id)
    
    return TranslationCheckResponse(
        can_translate=can_translate,
        message=message,
        tier=tier_data['tier']
    )


@router.post("/check-export-format", response_model=ExportFormatCheckResponse)
def check_export_format_access(
    request: ExportFormatCheckRequest,
    user: AuthorizedUser
) -> ExportFormatCheckResponse:
    """Check if user can export in specified format.
    
    Free: TXT only
    Individual+: TXT, Markdown, PDF
    """
    user_id = user.sub
    can_export, message = tier_manager.can_export_format(user_id, request.format)
    tier_data = tier_manager.get_user_tier_data(user_id)
    
    return ExportFormatCheckResponse(
        can_export=can_export,
        message=message,
        tier=tier_data['tier'],
        format=request.format
    )


@router.get("/check-session-creation", response_model=SessionCreationCheckResponse)
def check_session_creation_access(user: AuthorizedUser) -> SessionCreationCheckResponse:
    """Check if user can create a new session.
    
    Checks both:
    1. Quota limits (minutes per month)
    2. Session count limits (Free: 3 max, Individual+: unlimited)
    """
    user_id = user.sub
    can_create, message = tier_manager.can_create_session(user_id)
    tier_data = tier_manager.get_user_tier_data(user_id)
    tier = tier_data['tier']
    
    # Get session count for Free tier
    session_count = None
    session_limit = None
    if tier == 'free':
        from app.apis.firebase import get_firestore_db
        firestore_db = get_firestore_db()
        if firestore_db:
            sessions_ref = firestore_db.collection('sessions').where('userId', '==', user_id)
            session_count = len(list(sessions_ref.stream()))
        session_limit = 3
    
    # Get quota info
    quota_limit = tier_manager.get_monthly_limit(tier)
    quota_used = tier_data.get('usage_this_month', 0)
    quota_remaining = max(0, quota_limit - quota_used)
    
    return SessionCreationCheckResponse(
        can_create=can_create,
        message=message,
        tier=tier,
        current_session_count=session_count,
        session_limit=session_limit,
        quota_minutes_used=quota_used,
        quota_minutes_limit=quota_limit,
        quota_minutes_remaining=quota_remaining
    )


@router.get("/check-team-sharing", response_model=TeamSharingCheckResponse)
def check_team_sharing_access(user: AuthorizedUser) -> TeamSharingCheckResponse:
    """Check if user can use team sharing features.
    
    Free/Individual: No team sharing
    Professional: Up to 5 team members
    Business: Unlimited team members
    """
    user_id = user.sub
    can_share, message = tier_manager.can_use_team_sharing(user_id)
    tier_data = tier_manager.get_user_tier_data(user_id)
    tier = tier_data['tier']
    team_size_limit = tier_manager.get_team_size_limit(tier)
    
    return TeamSharingCheckResponse(
        can_share=can_share,
        message=message,
        tier=tier,
        team_size_limit=team_size_limit
    )


@router.get("/check-api-access", response_model=ApiAccessCheckResponse)
def check_api_access(user: AuthorizedUser) -> ApiAccessCheckResponse:
    """Check if user can use REST API access.
    
    Business Only: API access
    """
    user_id = user.sub
    can_use_api, message = tier_manager.can_use_api_access(user_id)
    tier_data = tier_manager.get_user_tier_data(user_id)
    
    return ApiAccessCheckResponse(
        can_use_api=can_use_api,
        message=message,
        tier=tier_data['tier']
    )


@router.get("/my-tier-info")
def get_my_tier_info(user: AuthorizedUser) -> Dict[str, Any]:
    """Get complete tier information for the current user.
    
    Returns all tier data including:
    - Current tier
    - Usage this month
    - Monthly limit
    - Remaining minutes
    - Feature access summary
    """
    user_id = user.sub
    tier_data = tier_manager.get_user_tier_data(user_id)
    tier = tier_data['tier']
    
    quota_limit = tier_manager.get_monthly_limit(tier)
    quota_used = tier_data.get('usage_this_month', 0)
    quota_remaining = max(0, quota_limit - quota_used)
    
    # Check feature access
    can_translate, _ = tier_manager.can_use_translation(user_id)
    can_share, _ = tier_manager.can_use_team_sharing(user_id)
    can_use_api, _ = tier_manager.can_use_api_access(user_id)
    has_priority = tier_manager.has_priority_processing(tier)
    
    return {
        'tier': tier,
        'usage_this_month': quota_used,
        'monthly_limit': quota_limit,
        'remaining_minutes': quota_remaining,
        'billing_anniversary': tier_data.get('billing_anniversary'),
        'is_grandfathered': tier_data.get('is_grandfathered', False),
        'is_nonprofit': tier_data.get('is_nonprofit', False),
        'features': {
            'translation': can_translate,
            'team_sharing': can_share,
            'api_access': can_use_api,
            'priority_processing': has_priority,
            'export_formats': {
                'txt': True,
                'markdown': tier != 'free',
                'pdf': tier != 'free',
            },
            'team_size_limit': tier_manager.get_team_size_limit(tier),
        }
    }
