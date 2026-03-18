import logging
from fastapi import APIRouter
from typing import Dict, Any, List, Optional

logger = logging.getLogger("dicta.user_analytics")
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.apis.firebase import initialize_firebase, FIREBASE_ADMIN_AVAILABLE
from app.auth import AuthorizedUser

router = APIRouter(prefix="/user-analytics", tags=["User Analytics"])

# Import Firebase Admin SDK for user management
try:
    import firebase_admin
    from firebase_admin import auth
except ImportError:
    logger.warning("firebase_admin module not available for user analytics")

class FirebaseUserData(BaseModel):
    uid: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    creation_time: datetime
    last_sign_in_time: Optional[datetime] = None
    email_verified: bool = False
    disabled: bool = False
    provider_data: List[Dict[str, Any]] = []

class UserConversionAnalytics(BaseModel):
    total_auth_users: int
    users_with_sessions: int
    users_without_sessions: int
    conversion_rate: float
    recent_signups_no_activity: int
    avg_time_to_first_session_hours: Optional[float] = None
    all_users: List[FirebaseUserData]
    users_zero_sessions: List[FirebaseUserData]

@router.get("/firebase-users")
async def get_all_firebase_users(user: AuthorizedUser) -> Dict[str, Any]:
    """
    Get all Firebase Auth users for admin analytics.
    Returns comprehensive user data including signup vs usage conversion metrics.
    """
    
    if not FIREBASE_ADMIN_AVAILABLE:
        return {
            "error": "Firebase Admin SDK not available",
            "total_users": 0,
            "users": []
        }
    
    try:
        # Initialize Firebase if needed
        initialize_firebase()
        
        # Get all users from Firebase Auth
        all_users = []
        page = auth.list_users()
        
        while page:
            for firebase_user in page.users:
                user_data = {
                    "uid": firebase_user.uid,
                    "email": firebase_user.email,
                    "display_name": firebase_user.display_name,
                    "creation_time": datetime.fromtimestamp(firebase_user.user_metadata.creation_timestamp / 1000).isoformat() if firebase_user.user_metadata.creation_timestamp else None,
                    "last_sign_in_time": datetime.fromtimestamp(firebase_user.user_metadata.last_sign_in_timestamp / 1000).isoformat() if firebase_user.user_metadata.last_sign_in_timestamp else None,
                    "email_verified": firebase_user.email_verified,
                    "disabled": firebase_user.disabled,
                    "provider_data": [
                        {
                            "provider_id": provider.provider_id,
                            "uid": provider.uid,
                            "display_name": provider.display_name,
                            "email": provider.email
                        } for provider in firebase_user.provider_data
                    ]
                }
                all_users.append(user_data)
            
            # Get next page if available
            page = page.get_next_page() if page.has_next_page else None
        
        logger.info("Retrieved %d Firebase Auth users", len(all_users))
        
        return {
            "total_users": len(all_users),
            "users": all_users,
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error("Error retrieving Firebase Auth users: %s", e)
        return {
            "error": f"Failed to retrieve users: {str(e)}",
            "total_users": 0,
            "users": []
        }

@router.get("/conversion-analytics")
async def get_user_conversion_analytics(user: AuthorizedUser, days_back: int = 30) -> UserConversionAnalytics:
    """
    Get comprehensive user conversion analytics comparing Firebase Auth users to session creators.
    
    Args:
        days_back: Number of days to look back for recent signup analysis
    
    Returns:
        UserConversionAnalytics with conversion rates and user lists
    """
    
    if not FIREBASE_ADMIN_AVAILABLE:
        return UserConversionAnalytics(
            total_auth_users=0,
            users_with_sessions=0,
            users_without_sessions=0,
            conversion_rate=0.0,
            recent_signups_no_activity=0,
            all_users=[],
            users_zero_sessions=[]
        )
    
    try:
        from app.apis.firebase import get_firestore_db
        from google.cloud.firestore_v1.base_query import FieldFilter
        
        # Get all Firebase Auth users
        firebase_users_response = await get_all_firebase_users(user)
        all_firebase_users = firebase_users_response.get("users", [])
        
        if not all_firebase_users:
            logger.info("No Firebase users found")
            return UserConversionAnalytics(
                total_auth_users=0,
                users_with_sessions=0,
                users_without_sessions=0,
                conversion_rate=0.0,
                recent_signups_no_activity=0,
                all_users=[],
                users_zero_sessions=[]
            )
        
        # Get all user IDs who have created sessions
        db = get_firestore_db()
        if not db:
            logger.warning("Could not connect to Firestore")
            return UserConversionAnalytics(
                total_auth_users=len(all_firebase_users),
                users_with_sessions=0,
                users_without_sessions=len(all_firebase_users),
                conversion_rate=0.0,
                recent_signups_no_activity=0,
                all_users=[FirebaseUserData(**user) for user in all_firebase_users],
                users_zero_sessions=[FirebaseUserData(**user) for user in all_firebase_users]
            )
        
        # Get unique user IDs from sessions
        sessions_ref = db.collection('sessions')
        sessions_docs = sessions_ref.stream()
        
        users_with_sessions = set()
        session_creation_times = {}  # uid -> first session time
        
        # Get all Firebase Auth user IDs for filtering
        firebase_user_ids = {user["uid"] for user in all_firebase_users}
        logger.debug("Firebase Auth user IDs: %s", firebase_user_ids)
        
        anonymous_sessions = set()
        authenticated_sessions = set()
        
        for doc in sessions_docs:
            data = doc.to_dict()
            user_id = data.get('userId')
            if user_id:
                # Only count sessions from Firebase Auth users, not anonymous
                if user_id in firebase_user_ids:
                    users_with_sessions.add(user_id)
                    authenticated_sessions.add(user_id)
                    
                    # Track first session time for time-to-conversion analysis
                    session_time = data.get('created_at') or data.get('timestamp')
                    if session_time and user_id not in session_creation_times:
                        if hasattr(session_time, 'timestamp'):
                            session_creation_times[user_id] = session_time.timestamp()
                        elif isinstance(session_time, datetime):
                            session_creation_times[user_id] = session_time.timestamp()
                else:
                    # Track anonymous sessions for debugging
                    anonymous_sessions.add(user_id)
        
        logger.info("Found %d Firebase Auth users with sessions", len(authenticated_sessions))
        logger.debug("Found %d anonymous sessions (excluded from conversion)", len(anonymous_sessions))
        logger.debug("Anonymous user IDs: %s", list(anonymous_sessions)[:10])
        
        # Categorize users
        users_zero_sessions = []
        recent_signups_no_activity = 0
        time_to_first_session_hours = []
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        for firebase_user in all_firebase_users:
            user_id = firebase_user["uid"]
            creation_time_str = firebase_user.get("creation_time")
            
            if user_id not in users_with_sessions:
                users_zero_sessions.append(firebase_user)
                
                # Check if recent signup with no activity
                if creation_time_str:
                    try:
                        creation_time = datetime.fromisoformat(creation_time_str.replace('Z', '+00:00'))
                        if creation_time >= cutoff_date:
                            recent_signups_no_activity += 1
                    except Exception as e:
                        logger.warning("Error parsing creation time %s: %s", creation_time_str, e)
            else:
                # Calculate time to first session
                if creation_time_str and user_id in session_creation_times:
                    try:
                        creation_time = datetime.fromisoformat(creation_time_str.replace('Z', '+00:00'))
                        first_session_time = datetime.fromtimestamp(session_creation_times[user_id])
                        time_diff_hours = (first_session_time - creation_time).total_seconds() / 3600
                        if time_diff_hours >= 0:  # Only positive time differences
                            time_to_first_session_hours.append(time_diff_hours)
                    except Exception as e:
                        logger.warning("Error calculating time to first session: %s", e)
        
        # Calculate metrics
        total_auth_users = len(all_firebase_users)
        users_with_sessions_count = len(users_with_sessions)
        users_without_sessions_count = len(users_zero_sessions)
        conversion_rate = (users_with_sessions_count / total_auth_users * 100) if total_auth_users > 0 else 0.0
        avg_time_to_first_session = sum(time_to_first_session_hours) / len(time_to_first_session_hours) if time_to_first_session_hours else None
        
        logger.info("Conversion Analytics: %d/%d = %.1f%%", users_with_sessions_count, total_auth_users, conversion_rate)
        logger.info("Recent signups with no activity: %d", recent_signups_no_activity)
        if avg_time_to_first_session is not None:
            logger.info("Average time to first session: %.1f hours", avg_time_to_first_session)
        else:
            logger.info("No time data available")
        
        return UserConversionAnalytics(
            total_auth_users=total_auth_users,
            users_with_sessions=users_with_sessions_count,
            users_without_sessions=users_without_sessions_count,
            conversion_rate=round(conversion_rate, 2),
            recent_signups_no_activity=recent_signups_no_activity,
            avg_time_to_first_session_hours=round(avg_time_to_first_session, 2) if avg_time_to_first_session else None,
            all_users=[FirebaseUserData(**user) for user in all_firebase_users],
            users_zero_sessions=[FirebaseUserData(**user) for user in users_zero_sessions]
        )
        
    except Exception as e:
        logger.error("Error in conversion analytics: %s", e)
        return UserConversionAnalytics(
            total_auth_users=0,
            users_with_sessions=0,
            users_without_sessions=0,
            conversion_rate=0.0,
            recent_signups_no_activity=0,
            all_users=[],
            users_zero_sessions=[]
        )

