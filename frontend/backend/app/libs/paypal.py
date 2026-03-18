import logging
import requests
from app.libs.secret_manager import get_secret
from fastapi import HTTPException

logger = logging.getLogger("dicta.paypal")

def get_paypal_access_token():
    """Get PayPal OAuth access token"""
    client_id = get_secret("PAYPAL_CLIENT_ID")
    client_secret = get_secret("PAYPAL_CLIENT_SECRET")
    
    url = "https://api-m.paypal.com/v1/oauth2/token"
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US",
    }
    data = {
        "grant_type": "client_credentials"
    }
    
    response = requests.post(
        url,
        headers=headers,
        data=data,
        auth=(client_id, client_secret)
    )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get PayPal access token: {response.text}"
        )
    
    return response.json()["access_token"]

def cancel_subscription(subscription_id: str, reason: str = "User requested cancellation"):
    """
    Cancel a PayPal subscription by ID.
    Returns True if successful, raises HTTPException otherwise.
    """
    try:
        # Get access token
        access_token = get_paypal_access_token()
        
        # Cancel subscription in PayPal
        url = f"https://api-m.paypal.com/v1/billing/subscriptions/{subscription_id}/cancel"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        data = {
            "reason": reason
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        # 204 No Content is success
        if response.status_code != 204:
            logger.error("PayPal API error: %s", response.text)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to cancel subscription: {response.text}"
            )
            
        logger.info(f"Cancelled subscription {subscription_id}")
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error cancelling subscription: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel subscription: {str(e)}"
        )
