import time
from app.libs.secret_manager import get_secret
import requests
import jwt

def get_zoom_access_token():
    """
    Generates a server-to-server OAuth access token for the Zoom API.
    """
    client_id = get_secret("ZOOM_CLIENT_ID")
    client_secret = get_secret("ZOOM_CLIENT_SECRET")
    account_id = get_secret("ZOOM_ACCOUNT_ID")

    if not all([client_id, client_secret, account_id]):
        raise ValueError("Zoom API credentials are not fully configured.")

    # Generate JWT
    payload = {
        "iss": client_id,
        "exp": int(time.time()) + 3600,  # Token valid for 1 hour
    }
    encoded_jwt = jwt.encode(payload, client_secret, algorithm="HS256")

    # Request access token
    token_url = "https://zoom.us/oauth/token"
    params = {
        "grant_type": "account_credentials",
        "account_id": account_id,
    }
    headers = {
        "Authorization": f"Bearer {encoded_jwt}"
    }
    
    response = requests.post(token_url, params=params, headers=headers)
    response.raise_for_status()  # Will raise an exception for HTTP error codes

    token_data = response.json()
    return token_data.get("access_token")
