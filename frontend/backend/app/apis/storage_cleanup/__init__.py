import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("dicta.storage_cleanup")
from typing import List, Dict, Any, Optional
import time
from collections import defaultdict
from app.libs.storage_manager import list_files_with_meta, delete_file

router = APIRouter()

class StorageStats(BaseModel):
    total_files: int
    total_size: int
    by_type: Dict[str, Dict[str, Any]]
    by_pattern: Dict[str, Dict[str, Any]]
    oldest_file: Optional[str] = None
    newest_file: Optional[str] = None

class CleanupOptions(BaseModel):
    patterns: List[str] = []  # File patterns to match (e.g., 'audio_', 'test_')
    older_than_days: Optional[int] = None  # Delete files older than X days
    file_types: List[str] = []  # Specific file types to target
    dry_run: bool = True  # Preview mode by default
    max_files: Optional[int] = None  # Limit number of files to delete

class CleanupResult(BaseModel):
    success: bool
    files_deleted: int
    size_freed: int
    errors: List[str] = []
    deleted_files: List[str] = []
    dry_run: bool

def _infer_file_type(filename: str) -> str:
    """Infer storage type from filename (Firebase Storage has a single namespace)."""
    if filename.endswith('.json'):
        return 'json'
    if filename.endswith('.txt'):
        return 'text'
    return 'binary'


@router.get("/storage-stats", response_model=StorageStats)
def get_storage_stats() -> StorageStats:
    """Get comprehensive storage statistics"""
    try:
        # Get all storage files (single namespace in Firebase)
        raw_files = list_files_with_meta("")
        all_files = [
            {
                'name': f['name'],
                'size': f['size'],
                'type': _infer_file_type(f['name']),
                'category': _categorize_file(f['name'])
            }
            for f in raw_files
        ]
        
        # Calculate statistics
        total_files = len(all_files)
        total_size = sum(f['size'] for f in all_files)
        
        # Group by type
        by_type = defaultdict(lambda: {'count': 0, 'size': 0, 'files': []})
        for file in all_files:
            by_type[file['type']]['count'] += 1
            by_type[file['type']]['size'] += file['size']
            by_type[file['type']]['files'].append(file['name'])
        
        # Group by pattern/category
        by_pattern = defaultdict(lambda: {'count': 0, 'size': 0, 'files': []})
        for file in all_files:
            category = file['category']
            by_pattern[category]['count'] += 1
            by_pattern[category]['size'] += file['size']
            by_pattern[category]['files'].append(file['name'])
        
        return StorageStats(
            total_files=total_files,
            total_size=total_size,
            by_type=dict(by_type),
            by_pattern=dict(by_pattern)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get storage stats: {str(e)}") from e

@router.post("/cleanup-by-options", response_model=CleanupResult)
def cleanup_storage_by_options(options: CleanupOptions) -> CleanupResult:
    """Clean up storage files based on specified criteria"""
    try:
        files_to_delete = []
        errors = []
        
        # Get all files (single namespace)
        raw_files = list_files_with_meta("")
        all_files = [
            {'name': f['name'], 'size': f['size'], 'type': _infer_file_type(f['name'])}
            for f in raw_files
        ]
        
        logger.info("Found %d total files in storage", len(all_files))
        
        # Filter files based on criteria
        for file in all_files:
            should_delete = True
            
            # Check patterns
            if options.patterns:
                pattern_match = any(pattern in file['name'] for pattern in options.patterns)
                if not pattern_match:
                    should_delete = False
            
            # Check file types
            if options.file_types and file['type'] not in options.file_types:
                should_delete = False
            
            if should_delete:
                files_to_delete.append(file)
        
        logger.info("Identified %d files for deletion", len(files_to_delete))
        
        # Apply max files limit
        if options.max_files and len(files_to_delete) > options.max_files:
            files_to_delete = files_to_delete[:options.max_files]
            logger.info("Limited to %d files", options.max_files)
        
        deleted_files = []
        total_size_freed = 0
        
        if not options.dry_run:
            # Actually delete files
            for file in files_to_delete:
                try:
                    delete_file(file['name'])
                    deleted_files.append(file['name'])
                    total_size_freed += file['size']
                    logger.info("Deleted %s (%d bytes)", file['name'], file['size'])
                    
                except Exception as e:
                    error_msg = f"Failed to delete {file['name']}: {str(e)}"
                    errors.append(error_msg)
                    logger.error("%s", error_msg)
        else:
            # Dry run - just calculate what would be deleted
            deleted_files = [f['name'] for f in files_to_delete]
            total_size_freed = sum(f['size'] for f in files_to_delete)
            logger.info("DRY RUN: Would delete %d files (%d bytes)", len(files_to_delete), total_size_freed)
        
        return CleanupResult(
            success=len(errors) == 0,
            files_deleted=len(deleted_files),
            size_freed=total_size_freed,
            errors=errors,
            deleted_files=deleted_files,
            dry_run=options.dry_run
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}") from e

@router.post("/cleanup-audio", response_model=CleanupResult)
def cleanup_audio_files(dry_run: bool = True, max_files: Optional[int] = None) -> CleanupResult:
    """Quick cleanup specifically for audio files"""
    options = CleanupOptions(
        patterns=["audio_"],
        file_types=["binary"],
        dry_run=dry_run,
        max_files=max_files
    )
    return cleanup_storage_by_options(options)

@router.post("/cleanup-test-data", response_model=CleanupResult)
def cleanup_test_data(dry_run: bool = True, max_files: Optional[int] = None) -> CleanupResult:
    """Quick cleanup for common test data patterns"""
    options = CleanupOptions(
        patterns=["audio_", "test_", "dual-rec-", "gemini-live-"],
        dry_run=dry_run,
        max_files=max_files
    )
    return cleanup_storage_by_options(options)

def _categorize_file(filename: str) -> str:
    """Categorize files by their naming patterns"""
    if filename.startswith('audio_'):
        return 'audio_files'
    elif 'test' in filename.lower():
        return 'test_files'
    elif 'dual-rec' in filename:
        return 'dual_recording'
    elif 'gemini-live' in filename:
        return 'gemini_live'
    elif filename.endswith('.mp3'):
        return 'audio_files'
    elif filename.endswith(('.json', '.txt')):
        return 'text_data'
    else:
        return 'other'

def _format_bytes(bytes_size: int) -> str:
    """Format bytes into human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} TB"

