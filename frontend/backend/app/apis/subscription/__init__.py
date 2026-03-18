"""Subscription management API endpoints."""

import logging
from fastapi import APIRouter, HTTPException

logger = logging.getLogger("dicta.subscription")
from pydantic import BaseModel
from typing import Optional
from google.cloud import firestore
from app.auth import AuthorizedUser
from app.libs.tier_management import get_tier_manager, TIER_CONFIG
import json
router = APIRouter()

class SubscriptionStatusResponse(BaseModel):
    tier: str
    tier_name: str
    monthly_minutes: int
    usage_this_month: float
    remaining_minutes: float
    billing_anniversary: Optional[str] = None
    subscription_status: Optional[str] = None
    is_grandfathered: bool
    is_nonprofit: bool
    price: float
    features: list[str]

class UsageResponse(BaseModel):
    minutes_used: float
    minutes_remaining: float
    monthly_limit: int
    percentage_used: float
    tier: str
    reset_date: Optional[str] = None


@router.get("/subscription/status")
async def get_subscription_status(user: AuthorizedUser) -> SubscriptionStatusResponse:
    """Get current subscription status and usage for the user."""
    try:
        tier_manager = get_tier_manager()
        tier_data = tier_manager.get_user_tier_data(user.sub)
        
        tier = tier_data['tier']
        config = tier_manager.get_tier_config(tier)
        usage = tier_data['usage_this_month']
        limit = config['monthly_minutes']
        remaining = max(0, limit - usage)
        
        # Calculate price with discounts
        price = tier_manager.get_tier_price(
            tier,
            tier_data['is_grandfathered'],
            tier_data['nonprofit_discount_percent']
        )
        
        # Format billing anniversary
        billing_anniversary = None
        if tier_data.get('billing_anniversary'):
            billing_anniversary = tier_data['billing_anniversary'].strftime('%Y-%m-%d')
        
        return SubscriptionStatusResponse(
            tier=tier,
            tier_name=config['name'],
            monthly_minutes=limit,
            usage_this_month=usage,
            remaining_minutes=remaining,
            billing_anniversary=billing_anniversary,
            subscription_status=tier_data.get('subscriptionStatus'),
            is_grandfathered=tier_data['is_grandfathered'],
            is_nonprofit=tier_data['is_nonprofit'],
            price=price,
            features=config['features'],
        )
    except Exception as e:
        logger.error("Error getting subscription status: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get subscription status")


@router.get("/subscription/usage")
async def get_usage(user: AuthorizedUser) -> UsageResponse:
    """Get detailed usage statistics."""
    try:
        tier_manager = get_tier_manager()
        tier_data = tier_manager.get_user_tier_data(user.sub)
        
        tier = tier_data['tier']
        limit = tier_manager.get_monthly_limit(tier)
        usage = tier_data['usage_this_month']
        remaining = max(0, limit - usage)
        percentage = (usage / limit * 100) if limit > 0 else 0
        
        reset_date = None
        if tier_data.get('billing_anniversary'):
            reset_date = tier_data['billing_anniversary'].strftime('%Y-%m-%d')
        
        return UsageResponse(
            minutes_used=usage,
            minutes_remaining=remaining,
            monthly_limit=limit,
            percentage_used=round(percentage, 1),
            tier=tier,
            reset_date=reset_date,
        )
    except Exception as e:
        logger.error("Error getting usage: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get usage")
