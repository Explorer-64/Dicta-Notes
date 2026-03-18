"""Secret Manager wrapper for Google Cloud Secret Manager.

This module provides a unified interface for accessing secrets from Google Cloud Secret Manager,
with fallback to environment variables for local development.
"""

import os
import logging
from typing import Optional
from functools import lru_cache

logger = logging.getLogger("dicta.secret_manager")

try:
    from google.cloud import secretmanager
    SECRET_MANAGER_AVAILABLE = True
except ImportError:
    SECRET_MANAGER_AVAILABLE = False
    logger.warning("google-cloud-secret-manager not available. Using environment variables.")


# Cache for secrets to reduce API calls
_secret_cache: dict[str, str] = {}


def get_secret(secret_name: str, project_id: Optional[str] = None) -> str:
    """
    Get a secret from Google Cloud Secret Manager or environment variable.

    Args:
        secret_name: Name of the secret (without the full resource path)
        project_id: GCP project ID. If None, will try to get from environment or detect.

    Returns:
        The secret value as a string

    Raises:
        ValueError: If secret is not found and no environment variable fallback exists
    """
    # Check cache first
    if secret_name in _secret_cache:
        return _secret_cache[secret_name]

    # Try environment variable first (for local development)
    env_value = os.environ.get(secret_name)
    if env_value:
        _secret_cache[secret_name] = env_value
        return env_value

    # If Secret Manager is not available, return None or raise error
    if not SECRET_MANAGER_AVAILABLE:
        raise ValueError(
            f"Secret '{secret_name}' not found in environment variables and "
            "Secret Manager is not available. Install google-cloud-secret-manager."
        )

    # Get project ID
    if not project_id:
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GCP_PROJECT")
        if not project_id:
            # Try to detect from Firebase config or other sources
            # For now, raise error if not found
            raise ValueError(
                f"Project ID not found. Set GOOGLE_CLOUD_PROJECT environment variable "
                f"or pass project_id parameter."
            )

    try:
        # Create Secret Manager client
        client = secretmanager.SecretManagerServiceClient()

        # Build the resource name of the secret version
        name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"

        # Access the secret version
        response = client.access_secret_version(request={"name": name})

        # Decode the secret value
        secret_value = response.payload.data.decode("UTF-8")

        # Cache the secret
        _secret_cache[secret_name] = secret_value

        return secret_value
    except Exception as e:
        # If secret not found in Secret Manager, try environment variable as fallback
        env_value = os.environ.get(secret_name)
        if env_value:
            _secret_cache[secret_name] = env_value
            return env_value

        raise ValueError(
            f"Secret '{secret_name}' not found in Secret Manager or environment variables: {e}"
        )


def clear_cache():
    """Clear the secret cache. Useful for testing or when secrets are rotated."""
    global _secret_cache
    _secret_cache.clear()
