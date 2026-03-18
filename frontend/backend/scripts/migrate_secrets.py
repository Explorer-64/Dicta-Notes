#!/usr/bin/env python3
"""Script to migrate secrets from Databutton to Google Cloud Secret Manager.

This script helps migrate all secrets from Databutton to Secret Manager.
Run this script after setting up Secret Manager in your GCP project.

Usage:
    python scripts/migrate_secrets.py --project-id dicta-notes
"""

import argparse
import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import databutton as db
    DATABUTTON_AVAILABLE = True
except ImportError:
    DATABUTTON_AVAILABLE = False
    print("Warning: databutton package not available. Cannot read from Databutton.")

try:
    from google.cloud import secretmanager
    SECRET_MANAGER_AVAILABLE = True
except ImportError:
    SECRET_MANAGER_AVAILABLE = False
    print("Error: google-cloud-secret-manager not installed. Install it first.")


# List of all secrets to migrate
SECRETS_TO_MIGRATE = [
    "GEMINI_API_KEY",
    "RESEND_API_KEY",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_PLAN_IDS",
    "ZOOM_CLIENT_ID",
    "ZOOM_CLIENT_SECRET",
    "ZOOM_ACCOUNT_ID",
    "BING_INDEXNOW_API_KEY",
    "SUPPORT_EMAIL",
    "FIREBASE_SERVICE_ACCOUNT",
    "GOOGLE_SEARCH_CONSOLE_CREDENTIALS",
]


def create_secret(client: secretmanager.SecretManagerServiceClient, project_id: str, secret_id: str) -> bool:
    """Create a secret in Secret Manager if it doesn't exist."""
    parent = f"projects/{project_id}"
    
    try:
        # Check if secret already exists
        secret_path = f"{parent}/secrets/{secret_id}"
        try:
            client.get_secret(request={"name": secret_path})
            print(f"  Secret '{secret_id}' already exists, skipping creation")
            return True
        except Exception:
            # Secret doesn't exist, create it
            pass
        
        # Create the secret
        secret = client.create_secret(
            request={
                "parent": parent,
                "secret_id": secret_id,
                "secret": {"replication": {"automatic": {}}},
            }
        )
        print(f"  Created secret '{secret_id}'")
        return True
    except Exception as e:
        print(f"  Error creating secret '{secret_id}': {e}")
        return False


def add_secret_version(client: secretmanager.SecretManagerServiceClient, project_id: str, secret_id: str, payload: str) -> bool:
    """Add a version to an existing secret."""
    parent = f"projects/{project_id}/secrets/{secret_id}"
    
    try:
        # Add the secret version
        version = client.add_secret_version(
            request={
                "parent": parent,
                "payload": {"data": payload.encode("UTF-8")},
            }
        )
        print(f"  Added version to secret '{secret_id}'")
        return True
    except Exception as e:
        print(f"  Error adding version to secret '{secret_id}': {e}")
        return False


def migrate_secret(project_id: str, secret_id: str, dry_run: bool = False) -> bool:
    """Migrate a single secret from Databutton to Secret Manager."""
    print(f"\nMigrating secret: {secret_id}")
    
    # Get secret value from Databutton
    if not DATABUTTON_AVAILABLE:
        print(f"  ERROR: Cannot read from Databutton. Install databutton package.")
        return False
    
    try:
        secret_value = db.secrets.get(secret_id)
        if not secret_value:
            print(f"  WARNING: Secret '{secret_id}' not found in Databutton")
            return False
        
        print(f"  Found secret in Databutton (length: {len(secret_value)} chars)")
    except Exception as e:
        print(f"  ERROR: Failed to read secret from Databutton: {e}")
        return False
    
    if dry_run:
        print(f"  DRY RUN: Would migrate secret '{secret_id}' to Secret Manager")
        return True
    
    # Create Secret Manager client
    if not SECRET_MANAGER_AVAILABLE:
        print(f"  ERROR: Secret Manager not available")
        return False
    
    client = secretmanager.SecretManagerServiceClient()
    
    # Create secret if it doesn't exist
    if not create_secret(client, project_id, secret_id):
        return False
    
    # Add secret version
    if not add_secret_version(client, project_id, secret_id, secret_value):
        return False
    
    print(f"  ✓ Successfully migrated '{secret_id}'")
    return True


def main():
    parser = argparse.ArgumentParser(description="Migrate secrets from Databutton to Secret Manager")
    parser.add_argument("--project-id", required=True, help="GCP Project ID")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode (don't actually migrate)")
    parser.add_argument("--secret", help="Migrate a specific secret (default: migrate all)")
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("DRY RUN MODE - No changes will be made\n")
    
    secrets_to_migrate = [args.secret] if args.secret else SECRETS_TO_MIGRATE
    
    print(f"Migrating secrets to project: {args.project_id}")
    print(f"Total secrets to migrate: {len(secrets_to_migrate)}\n")
    
    success_count = 0
    for secret_id in secrets_to_migrate:
        if migrate_secret(args.project_id, secret_id, dry_run=args.dry_run):
            success_count += 1
    
    print(f"\n{'='*60}")
    print(f"Migration complete: {success_count}/{len(secrets_to_migrate)} secrets migrated")
    
    if not args.dry_run and success_count == len(secrets_to_migrate):
        print("\n✓ All secrets successfully migrated!")
        print("\nNext steps:")
        print("1. Verify secrets in Google Cloud Console")
        print("2. Update your code to use app.libs.secret_manager.get_secret()")
        print("3. Set GOOGLE_CLOUD_PROJECT environment variable in Cloud Run")


if __name__ == "__main__":
    main()
