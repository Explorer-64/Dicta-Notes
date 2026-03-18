from fastapi import APIRouter
from typing import Dict, Any
from app.apis.firebase import get_firestore_db, initialize_firebase
from app.auth import AuthorizedUser

router = APIRouter(prefix="/firebase-rules")

@router.get("/get-firestore-rules")
async def get_firestore_rules(user: AuthorizedUser) -> Dict[str, Any]:
    """Get Firestore rules for testing"""
    try:
        # Initialize Firebase if not already done
        initialize_firebase()
        
        # Predefined rules that include userPreferences collection
        rules = {
            "recommended_rules": """
            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                // Common rules
                match /{document=**} {
                  allow read, write: if false; // Default deny
                }
                
                // User preferences - each user can only access their own preferences
                match /userPreferences/{userId} {
                  allow read: if request.auth != null && request.auth.uid == userId;
                  allow write: if request.auth != null && request.auth.uid == userId;
                }
                
                // Translation cache - read by all authenticated users, write by authenticated users
                match /translationCache/{cacheId} {
                  allow read: if request.auth != null;
                  allow write: if request.auth != null;
                }
                
                // Sessions collection - users can access their own sessions
                match /sessions/{sessionId} {
                  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
                  allow write: if request.auth != null && 
                              (resource.data.userId == request.auth.uid || 
                               request.resource.data.userId == request.auth.uid);
                  
                  // Live transcript segments - PUBLIC READ for multi-device viewing
                  // Anyone with session link can read live transcript segments
                  match /live_transcript_segments/{segmentId} {
                    allow read: if true; // PUBLIC READ ACCESS for sharing
                    allow write: if request.auth != null; // Only authenticated users can write
                  }
                }
                
                // Gemini Live Sessions - support new session ID format (gemini-live-*)
                match /geminiLiveSessions/{sessionId} {
                  allow read: if request.auth != null;
                  allow write: if request.auth != null;
                  
                  // Gemini segments subcollection
                  match /segments/{segmentId} {
                    allow read: if request.auth != null;
                    allow write: if request.auth != null;
                  }
                  
                  // Multilingual segments subcollection
                  match /multilingualSegments/{segmentId} {
                    allow read: if request.auth != null;
                    allow write: if request.auth != null;
                  }
                }
                
                // Multilingual translations - allow read/write for authenticated users
                match /multilingualTranslations/{translationId} {
                  allow read: if request.auth != null;
                  allow write: if request.auth != null;
                }
                
                // Live multilingual segments - more permissive for real-time sharing
                match /liveMultilingualSegments/{sessionId}/{segmentId} {
                  allow read: if request.auth != null;
                  allow write: if request.auth != null;
                }
                
                // Error logs - allow authenticated users to read and write error logs
                match /errorLogs/{errorId} {
                  allow read: if request.auth != null;
                  allow write: if request.auth != null;
                }
              }
            }
            """
        }
        
        return {
            "success": True,
            "rules": rules
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
