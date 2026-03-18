"""Subscription tier management and enforcement.

This module defines subscription tiers, their limits, pricing,
and provides helper functions for tier management.
"""

import logging
from typing import Dict, Optional, Literal

logger = logging.getLogger("dicta.tier_management")
from datetime import datetime, timedelta
from google.cloud import firestore as firestore_module
# Tier type definition
TierType = Literal['free', 'individual', 'professional', 'business']

# Tier configuration
TIER_CONFIG = {
    'free': {
        'name': 'Public Beta',
        'monthly_minutes': 9999,
        'price_monthly': 0,
        'max_users': 5,
        'features': ['basic_transcription', 'speaker_detection', 'translation', 'export', 'team_sharing'],
    },
    'individual': {
        'name': 'Individual',
        'monthly_minutes': 300,
        'price_monthly': 4.99,
        'max_users': 1,
        'features': ['basic_transcription', 'speaker_detection', 'translation', 'export'],
    },
    'professional': {
        'name': 'Professional',
        'monthly_minutes': 600,
        'price_monthly': 9.99,
        'max_users': 2,
        'features': ['basic_transcription', 'speaker_detection', 'translation', 'export', 'priority_support'],
    },
    'business': {
        'name': 'Business',
        'monthly_minutes': 1200,
        'price_monthly': 49.99,
        'max_users': 5,
        'features': ['basic_transcription', 'speaker_detection', 'translation', 'export', 'priority_support', 'team_sharing'],
    },
}


class TierManager:
    """Manages subscription tier operations."""
    
    def __init__(self):
        from app.apis.firebase import get_firestore_db
        self.db = get_firestore_db()
    
    def get_tier_config(self, tier: TierType) -> Dict:
        """Get configuration for a specific tier."""
        return TIER_CONFIG.get(tier, TIER_CONFIG['free'])
    
    def get_monthly_limit(self, tier: TierType) -> int:
        """Get monthly minute limit for a tier."""
        config = self.get_tier_config(tier)
        return config['monthly_minutes']
    
    def get_tier_price(self, tier: TierType, is_grandfathered: bool = False, 
                       nonprofit_discount_percent: float = 0) -> float:
        """Calculate tier price with discounts applied.
        
        Args:
            tier: The subscription tier
            is_grandfathered: Legacy beta user gets 10% off
            nonprofit_discount_percent: Non-profit discount (default 40%)
        
        Returns:
            Final price after discounts
        """
        config = self.get_tier_config(tier)
        base_price = config['price_monthly']
        
        if base_price == 0:
            return 0
        
        # Apply grandfathered discount (10% for legacy beta users)
        if is_grandfathered:
            base_price *= 0.9
        
        # Apply non-profit discount (default 40%)
        if nonprofit_discount_percent > 0:
            base_price *= (1 - nonprofit_discount_percent / 100)
        
        return round(base_price, 2)
    
    def get_user_tier_data(self, user_id: str) -> Dict:
        """Get user's tier and subscription data from Firestore.
        
        Returns:
            Dict with tier, usage, billing info, and discount flags
        """
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                # Initialize new user with free tier
                return self._initialize_user_tier(user_id)
            
            user_data = user_doc.to_dict()
            subscription = user_data.get('subscription', {})
            
            # Determine status from new structure or legacy field
            status = subscription.get('status') or user_data.get('subscriptionStatus')
            
            return {
                'tier': user_data.get('tier', 'free'),
                'usage_this_month': user_data.get('usageThisMonth', 0),
                'billing_anniversary': user_data.get('billingAnniversary'),
                'subscriptionStatus': status,
                'is_grandfathered': user_data.get('isGrandfathered', False),
                'is_nonprofit': user_data.get('isNonProfit', False),
                'nonprofit_discount_percent': user_data.get('nonProfitDiscountPercent', 0),
            }
        except Exception as e:
            logger.error("Error getting user tier data for %s: %s", user_id, e)
            raise
    
    def _initialize_user_tier(self, user_id: str) -> Dict:
        """Initialize a new user with free tier."""
        try:
            now = datetime.utcnow()
            # Set billing anniversary to 1st of next month (Reset Date)
            if now.month == 12:
                billing_anniversary = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                billing_anniversary = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Default to free tier for all new users
            tier = 'free'
            
            user_data = {
                'tier': tier,
                'usageThisMonth': 0,
                'billingAnniversary': billing_anniversary,
                'isGrandfathered': False,
                'isNonProfit': False,
                'nonProfitDiscountPercent': 0,
            }
            
            user_ref = self.db.collection('users').document(user_id)
            user_ref.set(user_data, merge=True)
            
            logger.info("Initialized user %s with %s tier", user_id, tier)
            
            return {
                'tier': tier,
                'usage_this_month': 0,
                'billing_anniversary': billing_anniversary,
                'is_grandfathered': False,
                'is_nonprofit': False,
                'nonprofit_discount_percent': 0,
            }
        except Exception as e:
            logger.error("Error initializing user tier for %s: %s", user_id, e)
            raise
    
    def can_start_session(self, user_id: str) -> tuple[bool, Optional[str]]:
        """Check if user can start a new transcription session.
        
        Returns:
            Tuple of (can_start, message)
        """
        try:
            tier_data = self.get_user_tier_data(user_id)
            tier = tier_data['tier']
            usage = tier_data['usage_this_month']
            limit = self.get_monthly_limit(tier)
            
            if usage >= limit:
                billing_anniversary = tier_data.get('billing_anniversary')
                if billing_anniversary:
                    reset_date = billing_anniversary.strftime('%B %d, %Y')
                    message = f"You've reached your {limit}-minute monthly limit. Resets on {reset_date}."
                else:
                    message = f"You've reached your {limit}-minute monthly limit."
                return False, message
            
            return True, None
        except Exception as e:
            logger.error("Error checking session start permission for %s: %s", user_id, e)
            # Allow session on error to avoid blocking users
            return True, None
    
    def increment_usage(self, user_id: str, minutes: float, session_id: str) -> Dict:
        """Increment user's usage and log it.
        
        Uses Firestore transaction to prevent race conditions.
        
        Returns:
            Updated usage stats
        """
        try:
            user_ref = self.db.collection('users').document(user_id)
            
            @firestore_module.transactional
            def update_in_transaction(transaction, user_ref):
                user_doc = user_ref.get(transaction=transaction)
                
                if not user_doc.exists:
                    # Initialize user if doesn't exist
                    self._initialize_user_tier(user_id)
                    user_doc = user_ref.get(transaction=transaction)
                
                user_data = user_doc.to_dict()
                current_usage = user_data.get('usageThisMonth', 0)
                new_usage = current_usage + minutes
                
                transaction.update(user_ref, {
                    'usageThisMonth': new_usage,
                })
                
                return new_usage, user_data.get('tier', 'free')
            
            transaction = self.db.transaction()
            new_usage, tier = update_in_transaction(transaction, user_ref)
            
            # Log usage to usage_logs collection
            self._log_usage(user_id, session_id, minutes, tier)
            
            limit = self.get_monthly_limit(tier)
            remaining = max(0, limit - new_usage)
            
            logger.info("Updated usage for %s: %s/%s minutes", user_id, new_usage, limit)
            
            return {
                'success': True,
                'usage_this_month': new_usage,
                'remaining_minutes': remaining,
                'limit': limit,
            }
        except Exception as e:
            logger.error("Error incrementing usage for %s: %s", user_id, e)
            raise
    
    def _log_usage(self, user_id: str, session_id: str, minutes: float, tier: str):
        """Log usage to usage_logs collection for analytics."""
        try:
            log_ref = self.db.collection('usage_logs').document()
            log_ref.set({
                'userId': user_id,
                'sessionId': session_id,
                'minutesUsed': minutes,
                'timestamp': firestore_module.SERVER_TIMESTAMP,
                'tier': tier,
            })
            logger.info("Logged %s minutes for session %s", minutes, session_id)
        except Exception as e:
            logger.warning("Failed to log usage: %s", e)
            # Don't raise - logging failure shouldn't break usage tracking
    
    def reset_usage(self, user_id: str):
        """Reset usage counter for billing anniversary."""
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_ref.update({
                'usageThisMonth': 0,
            })
            logger.info("Reset usage for %s", user_id)
        except Exception as e:
            logger.error("Error resetting usage for %s: %s", user_id, e)
            raise
    
    def can_use_translation(self, user_id: str) -> tuple[bool, Optional[str]]:
        """Check if user can use translation feature.
        
        Free: No translation
        Individual+: Translation enabled
        
        Returns:
            Tuple of (can_translate, message)
        """
        try:
            # PUBLIC BETA: Always allow translation
            return True, None
        except Exception as e:
            logger.error("Error checking translation permission for %s: %s", user_id, e)
            return False, "Unable to verify translation access."
    
    def can_export_format(self, user_id: str, format: str) -> tuple[bool, Optional[str]]:
        """Check if user can export in specified format.
        
        Free: TXT only
        Individual+: TXT, Markdown, PDF
        
        Args:
            format: 'txt', 'markdown', or 'pdf'
        
        Returns:
            Tuple of (can_export, message)
        """
        try:
            # PUBLIC BETA: Always allow all formats
            if format.lower() in ['txt', 'markdown', 'pdf']:
                return True, None
            
            return False, f"Unsupported export format: {format}"
        except Exception as e:
            logger.error("Error checking export permission for %s: %s", user_id, e)
            return False, "Unable to verify export access."
    
    def can_create_session(self, user_id: str) -> tuple[bool, Optional[str]]:
        """Check if user can create a new session.
        
        Checks both quota and session count limits.
        Free: 3 sessions max
        Individual+: Unlimited sessions
        
        Returns:
            Tuple of (can_create, message)
        """
        try:
            # PUBLIC BETA: Unlimited sessions for everyone
            return True, None
        except Exception as e:
            logger.error("Error checking session creation for %s: %s", user_id, e)
            # Allow on error to avoid blocking users
            return True, None
    
    def can_use_team_sharing(self, user_id: str) -> tuple[bool, Optional[str]]:
        """Check if user can use team sharing features.
        
        Free/Individual: No team sharing (1 member only)
        Beta: Up to 5 team members (generous beta access)
        Professional: Up to 2 team members
        Business: Up to 5 team members
        
        Returns:
            Tuple of (can_share, message)
        """
        try:
            tier_data = self.get_user_tier_data(user_id)
            tier = tier_data['tier']
            
            if tier in ['free', 'individual']:
                return False, "Team sharing is available on Professional plan and above."
            
            return True, None
        except Exception as e:
            logger.error("Error checking team sharing for %s: %s", user_id, e)
            return False, "Unable to verify team sharing access."
    
    def get_team_size_limit(self, tier: TierType) -> Optional[int]:
        """Get maximum team size for a tier.
        
        Returns:
            Number of team members allowed, or None for unlimited
        """
        limits = {
            'free': 1,
            'individual': 1,
            'professional': 2,
            'business': 5,
        }
        return limits.get(tier, 1)
    
    def has_priority_processing(self, tier: TierType) -> bool:
        """Check if tier has priority processing.
        
        Professional+ gets priority queue
        """
        return tier in ['professional', 'business']
    
    def can_use_api_access(self, user_id: str) -> tuple[bool, Optional[str]]:
        """Check if user can use REST API access.
        
        Business Only: API access
        
        Returns:
            Tuple of (can_use_api, message)
        """
        try:
            tier_data = self.get_user_tier_data(user_id)
            tier = tier_data['tier']
            
            if tier != 'business':
                return False, "REST API access is available on Business plan only."
            
            return True, None
        except Exception as e:
            logger.error("Error checking API access for %s: %s", user_id, e)
            return False, "Unable to verify API access."
    
    def calculate_billing_anniversary(self, subscription_start: datetime) -> datetime:
        """Calculate next billing anniversary from subscription start date.
        
        Args:
            subscription_start: When subscription started
        
        Returns:
            Next billing anniversary datetime
        """
        now = datetime.utcnow()
        
        # Start with the subscription day of month
        anniversary_day = subscription_start.day
        
        # Calculate this month's anniversary
        try:
            this_month_anniversary = now.replace(day=anniversary_day, hour=0, minute=0, second=0, microsecond=0)
        except ValueError:
            # Handle edge case where day doesn't exist in current month (e.g., Feb 31)
            # Use last day of month instead
            next_month = now.replace(day=1) + timedelta(days=32)
            this_month_anniversary = (next_month.replace(day=1) - timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        
        # If this month's anniversary has passed, calculate next month's
        if this_month_anniversary <= now:
            next_month = (this_month_anniversary.replace(day=1) + timedelta(days=32)).replace(day=1)
            try:
                anniversary = next_month.replace(day=anniversary_day)
            except ValueError:
                # Last day of next month
                following_month = next_month + timedelta(days=32)
                anniversary = (following_month.replace(day=1) - timedelta(days=1)).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
        else:
            anniversary = this_month_anniversary
        
        return anniversary


# Singleton instance
_tier_manager = None

def get_tier_manager() -> TierManager:
    """Get singleton TierManager instance."""
    global _tier_manager
    if _tier_manager is None:
        _tier_manager = TierManager()
    return _tier_manager
