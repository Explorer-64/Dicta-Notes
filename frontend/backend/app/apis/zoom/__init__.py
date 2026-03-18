import logging
from fastapi import APIRouter, HTTPException

logger = logging.getLogger("dicta.zoom")
from app.libs.zoom_client import get_zoom_access_token
import requests
from pydantic import BaseModel, Field

router = APIRouter(prefix="/zoom", tags=["Zoom"])


class MeetingDetails(BaseModel):
    topic: str = Field(..., example="My Awesome Meeting")
    start_time: str | None = Field(None, example="2024-09-12T10:00:00Z")
    duration: int = Field(60, example=60)  # In minutes
    timezone: str = Field("UTC", example="America/Los_Angeles")


@router.get("/health")
def zoom_health_check():
    return {"status": "ok"}


@router.get("/meetings")
def list_meetings():
    """
    Lists all meetings for the user associated with the Zoom account.
    """
    try:
        access_token = get_zoom_access_token()
        
        user_id = "me"  # 'me' refers to the user who owns the app
        meetings_url = f"https://api.zoom.us/v2/users/{user_id}/meetings"
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(meetings_url, headers=headers)
        response.raise_for_status()
        
        return response.json()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except requests.exceptions.RequestException as e:
        # Log the error for debugging
        logger.error("Error fetching Zoom meetings: %s", e.response.text if e.response else e)
        raise HTTPException(status_code=500, detail="Failed to fetch meetings from Zoom.")


@router.post("/meetings")
def create_meeting(details: MeetingDetails):
    """
    Creates a new Zoom meeting for the user.
    """
    try:
        access_token = get_zoom_access_token()
        
        user_id = "me"
        meetings_url = f"https://api.zoom.us/v2/users/{user_id}/meetings"
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        payload = details.model_dump()
        
        response = requests.post(meetings_url, headers=headers, json=payload)
        response.raise_for_status()
        
        return response.json()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except requests.exceptions.RequestException as e:
        logger.error("Error creating Zoom meeting: %s", e.response.text if e.response else e)
        raise HTTPException(status_code=500, detail="Failed to create meeting in Zoom.")
