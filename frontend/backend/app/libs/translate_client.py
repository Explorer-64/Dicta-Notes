"""Google Cloud Translation client utility"""
from google.cloud import translate_v2 as translate
from app.libs.secret_manager import get_secret
import json

def get_translate_client():
    """Create and return a Google Cloud Translation client using Firebase service account"""
    service_account_info = get_secret("FIREBASE_SERVICE_ACCOUNT")
    if not service_account_info:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT secret is not set.")
    
    credentials_dict = json.loads(service_account_info)
    
    # Create the translation client with service account credentials
    client = translate.Client.from_service_account_info(credentials_dict)
    return client
