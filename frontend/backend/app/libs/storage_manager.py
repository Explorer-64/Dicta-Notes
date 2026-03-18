"""Unified storage manager for Firebase Storage.

This module provides a unified interface for storing and retrieving files from Firebase Storage,
replacing Databutton storage functionality.
"""

import json
import logging
import os
from typing import Optional, List, Dict, Any
from urllib.parse import quote

logger = logging.getLogger("dicta.storage_manager")

try:
    from firebase_admin import storage
    from app.apis.firebase import initialize_firebase
    FIREBASE_STORAGE_AVAILABLE = True
except ImportError:
    FIREBASE_STORAGE_AVAILABLE = False
    logger.warning("Firebase Storage not available.")


def _get_storage_bucket():
    """Get the Firebase Storage bucket."""
    if not FIREBASE_STORAGE_AVAILABLE:
        return None

    # Ensure Firebase is initialized
    initialize_firebase()

    try:
        bucket = storage.bucket()
        return bucket
    except Exception as e:
        logger.error("Error getting storage bucket: %s", e)
        return None


def _sanitize_key(key: str) -> str:
    """Sanitize storage key to be safe for Firebase Storage paths."""
    # Replace spaces and special characters
    safe_key = key.replace(" ", "_").replace("/", "_")
    # Remove any leading/trailing slashes
    safe_key = safe_key.strip("/")
    return safe_key


def put_binary(key: str, data: bytes, content_type: Optional[str] = None) -> str:
    """
    Store binary data in Firebase Storage.

    Args:
        key: Storage key/path for the file
        data: Binary data to store
        content_type: Optional content type (e.g., 'audio/mp3')

    Returns:
        Firebase Storage URL or gs:// path
    """
    bucket = _get_storage_bucket()
    if not bucket:
        raise RuntimeError("Firebase Storage bucket not available")

    safe_key = _sanitize_key(key)
    blob = bucket.blob(safe_key)

    if content_type:
        blob.content_type = content_type

    blob.upload_from_string(data, content_type=content_type)

    # Make publicly accessible
    try:
        blob.make_public()
        return blob.public_url
    except Exception:
        # If public access fails, return gs:// URL
        return f"gs://{bucket.name}/{safe_key}"


def get_binary(key: str) -> Optional[bytes]:
    """
    Retrieve binary data from Firebase Storage.

    Args:
        key: Storage key/path for the file

    Returns:
        Binary data or None if not found
    """
    bucket = _get_storage_bucket()
    if not bucket:
        return None

    safe_key = _sanitize_key(key)
    blob = bucket.blob(safe_key)

    if not blob.exists():
        return None

    try:
        return blob.download_as_bytes()
    except Exception as e:
        logger.error("Error retrieving binary data: %s", e)
        return None


def put_json(key: str, data: Dict[str, Any]) -> str:
    """
    Store JSON data in Firebase Storage.

    Args:
        key: Storage key/path for the file
        data: Dictionary to store as JSON

    Returns:
        Firebase Storage URL
    """
    json_str = json.dumps(data, indent=2)
    return put_text(key, json_str)


def get_json(key: str, default: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Retrieve JSON data from Firebase Storage.

    Args:
        key: Storage key/path for the file
        default: Default value if not found

    Returns:
        Dictionary or default value
    """
    text_data = get_text(key)
    if text_data is None:
        return default

    try:
        return json.loads(text_data)
    except json.JSONDecodeError as e:
        logger.error("Error parsing JSON data: %s", e)
        return default


def put_text(key: str, data: str) -> str:
    """
    Store text data in Firebase Storage.

    Args:
        key: Storage key/path for the file
        data: Text data to store

    Returns:
        Firebase Storage URL
    """
    return put_binary(key, data.encode('utf-8'), content_type='text/plain')


def get_text(key: str) -> Optional[str]:
    """
    Retrieve text data from Firebase Storage.

    Args:
        key: Storage key/path for the file

    Returns:
        Text data or None if not found
    """
    binary_data = get_binary(key)
    if binary_data is None:
        return None

    try:
        return binary_data.decode('utf-8')
    except UnicodeDecodeError as e:
        logger.error("Error decoding text data: %s", e)
        return None


def list_files(prefix: str = "") -> List[str]:
    """
    List files in Firebase Storage with the given prefix.

    Args:
        prefix: Prefix to filter files

    Returns:
        List of file keys/paths
    """
    bucket = _get_storage_bucket()
    if not bucket:
        return []

    safe_prefix = _sanitize_key(prefix)
    blobs = bucket.list_blobs(prefix=safe_prefix)

    return [blob.name for blob in blobs]


def list_files_with_meta(prefix: str = "") -> List[Dict[str, Any]]:
    """
    List files in Firebase Storage with name and size (for compatibility with cleanup/stats).
    Returns list of dicts with 'name' and 'size' keys.
    """
    bucket = _get_storage_bucket()
    if not bucket:
        return []

    safe_prefix = _sanitize_key(prefix)
    blobs = bucket.list_blobs(prefix=safe_prefix)

    return [{"name": blob.name, "size": blob.size if hasattr(blob, 'size') else 0} for blob in blobs]


def delete_file(key: str) -> bool:
    """
    Delete a file from Firebase Storage.

    Args:
        key: Storage key/path for the file

    Returns:
        True if deleted, False otherwise
    """
    bucket = _get_storage_bucket()
    if not bucket:
        return False

    safe_key = _sanitize_key(key)
    blob = bucket.blob(safe_key)

    if not blob.exists():
        return False

    try:
        blob.delete()
        return True
    except Exception as e:
        logger.error("Error deleting file: %s", e)
        return False


def can_connect() -> bool:
    """
    Check if storage is accessible (read-only, no writes).
    Safe to call frequently (e.g. from health checks).
    """
    bucket = _get_storage_bucket()
    if not bucket:
        return False
    try:
        # Minimal read-only operation: list up to 1 blob
        next(iter(bucket.list_blobs(max_results=1)), None)
        return True
    except Exception:
        return False


def exists(key: str) -> bool:
    """
    Check if a file exists in Firebase Storage.

    Args:
        key: Storage key/path for the file

    Returns:
        True if exists, False otherwise
    """
    bucket = _get_storage_bucket()
    if not bucket:
        return False

    safe_key = _sanitize_key(key)
    blob = bucket.blob(safe_key)

    return blob.exists()
