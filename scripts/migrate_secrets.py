"""
One-time script to migrate secrets from .env to Google Cloud Secret Manager.
Run from the project root:
    python scripts/migrate_secrets.py
"""
import os
import sys
import json

# Load .env from backend
env_path = os.path.join(os.path.dirname(__file__), "../frontend/backend/.env")

try:
    from dotenv import dotenv_values
except ImportError:
    print("Installing python-dotenv...")
    os.system(f"{sys.executable} -m pip install python-dotenv -q")
    from dotenv import dotenv_values

try:
    from google.cloud import secretmanager
except ImportError:
    print("Installing google-cloud-secret-manager...")
    os.system(f"{sys.executable} -m pip install google-cloud-secret-manager -q")
    from google.cloud import secretmanager

PROJECT_ID = "dicta-notes"

def get_sm_client(env_values):
    """Create Secret Manager client authenticated with the service account from .env."""
    import json
    import tempfile
    sa_json = env_values.get("FIREBASE_SERVICE_ACCOUNT") or env_values.get("GOOGLE_APPLICATION_CREDENTIALS")
    if sa_json:
        try:
            from google.oauth2 import service_account
            from google.cloud import secretmanager
            sa_info = json.loads(sa_json)
            creds = service_account.Credentials.from_service_account_info(
                sa_info,
                scopes=["https://www.googleapis.com/auth/cloud-platform"],
            )
            return secretmanager.SecretManagerServiceClient(credentials=creds)
        except Exception as e:
            print(f"Could not load service account credentials: {e}")
    return secretmanager.SecretManagerServiceClient()

# Secrets to migrate (env var name → Secret Manager name, must match get_secret() calls)
SECRETS_TO_MIGRATE = [
    "FIREBASE_SERVICE_ACCOUNT",
    "FIREBASE_CONFIG",
    "GEMINI_API_KEY",
    "RESEND_API_KEY",
    "SUPPORT_EMAIL",
    "BING_INDEXNOW_API_KEY",
    "GOOGLE_SEARCH_CONSOLE_CREDENTIALS",
    "ZOOM_ACCOUNT_ID",
    "ZOOM_CLIENT_ID",
    "ZOOM_CLIENT_SECRET",
]

def create_or_update_secret(client, project_id: str, secret_name: str, value: str):
    parent = f"projects/{project_id}"
    secret_path = f"{parent}/secrets/{secret_name}"

    # Try to create; if it already exists, just add a new version
    try:
        client.create_secret(
            request={
                "parent": parent,
                "secret_id": secret_name,
                "secret": {"replication": {"automatic": {}}},
            }
        )
        print(f"  Created secret: {secret_name}")
    except Exception as e:
        if "already exists" in str(e).lower() or "409" in str(e):
            print(f"  Secret already exists, adding new version: {secret_name}")
        else:
            raise

    # Add version
    client.add_secret_version(
        request={
            "parent": secret_path,
            "payload": {"data": value.encode("UTF-8")},
        }
    )
    print(f"  OK: {secret_name}")


def main():
    env_values = dotenv_values(env_path)
    client = get_sm_client(env_values)

    missing = []
    for name in SECRETS_TO_MIGRATE:
        value = env_values.get(name)
        if not value:
            missing.append(name)
            continue
        try:
            create_or_update_secret(client, PROJECT_ID, name, value)
        except Exception as e:
            print(f"  ERROR with {name}: {e}")

    print()
    if missing:
        print(f"WARNING: The following secrets were NOT in .env (need to be added manually):")
        for m in missing:
            print(f"  - {m}")
    else:
        print("All secrets migrated successfully.")

    # Remind about PayPal (not in .env)
    paypal = ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_PLAN_IDS"]
    print()
    print("NOTE: These secrets are used by the backend but were not in .env:")
    for p in paypal:
        print(f"  - {p}")
    print("Add them to Secret Manager manually if PayPal integration is active.")


if __name__ == "__main__":
    main()
