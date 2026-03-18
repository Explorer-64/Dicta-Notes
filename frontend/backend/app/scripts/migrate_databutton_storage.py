#!/usr/bin/env python3
"""Script to migrate data from Databutton storage to Firebase Storage.

This script migrates all files (binary, JSON, text) from Databutton storage
to Firebase Storage, preserving the same key structure.

Usage:
    python scripts/migrate_databutton_storage.py --project-id dicta-notes [--dry-run]
"""

import argparse
import sys
import os
from pathlib import Path
from typing import List, Dict, Any
import json

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import databutton as db
    DATABUTTON_AVAILABLE = True
except ImportError:
    DATABUTTON_AVAILABLE = False
    print("Warning: databutton package not available. Cannot read from Databutton.")

from app.libs.storage_manager import put_binary, put_json, put_text, list_files
from app.apis.firebase import initialize_firebase


def migrate_binary_files(dry_run: bool = False) -> Dict[str, Any]:
    """Migrate all binary files from Databutton to Firebase Storage."""
    if not DATABUTTON_AVAILABLE:
        return {"success": False, "error": "Databutton package not available"}
    
    stats = {
        "total": 0,
        "migrated": 0,
        "failed": 0,
        "errors": []
    }
    
    try:
        print("\n=== Migrating Binary Files ===")
        binary_files = db.storage.binary.list()
        stats["total"] = len(binary_files)
        
        for file_info in binary_files:
            file_key = file_info.name
            print(f"  Migrating binary file: {file_key}")
            
            if dry_run:
                stats["migrated"] += 1
                continue
            
            try:
                # Get file from Databutton
                file_data = db.storage.binary.get(file_key)
                
                # Determine content type
                content_type = 'application/octet-stream'
                if file_key.endswith('.mp3') or 'audio' in file_key.lower():
                    content_type = 'audio/mp3'
                elif file_key.endswith('.png') or 'image' in file_key.lower():
                    content_type = 'image/png'
                elif file_key.endswith('.jpg') or file_key.endswith('.jpeg'):
                    content_type = 'image/jpeg'
                
                # Upload to Firebase Storage
                put_binary(file_key, file_data, content_type=content_type)
                stats["migrated"] += 1
                print(f"    ✓ Migrated {file_key}")
                
            except Exception as e:
                stats["failed"] += 1
                error_msg = f"Failed to migrate {file_key}: {str(e)}"
                stats["errors"].append(error_msg)
                print(f"    ✗ {error_msg}")
        
        return {"success": True, **stats}
        
    except Exception as e:
        return {"success": False, "error": str(e), **stats}


def migrate_json_files(dry_run: bool = False) -> Dict[str, Any]:
    """Migrate all JSON files from Databutton to Firebase Storage."""
    if not DATABUTTON_AVAILABLE:
        return {"success": False, "error": "Databutton package not available"}
    
    stats = {
        "total": 0,
        "migrated": 0,
        "failed": 0,
        "errors": []
    }
    
    try:
        print("\n=== Migrating JSON Files ===")
        json_files = db.storage.json.list()
        stats["total"] = len(json_files)
        
        for file_info in json_files:
            file_key = file_info.name
            print(f"  Migrating JSON file: {file_key}")
            
            if dry_run:
                stats["migrated"] += 1
                continue
            
            try:
                # Get file from Databutton
                file_data = db.storage.json.get(file_key)
                
                # Upload to Firebase Storage
                put_json(file_key, file_data)
                stats["migrated"] += 1
                print(f"    ✓ Migrated {file_key}")
                
            except Exception as e:
                stats["failed"] += 1
                error_msg = f"Failed to migrate {file_key}: {str(e)}"
                stats["errors"].append(error_msg)
                print(f"    ✗ {error_msg}")
        
        return {"success": True, **stats}
        
    except Exception as e:
        return {"success": False, "error": str(e), **stats}


def migrate_text_files(dry_run: bool = False) -> Dict[str, Any]:
    """Migrate all text files from Databutton to Firebase Storage."""
    if not DATABUTTON_AVAILABLE:
        return {"success": False, "error": "Databutton package not available"}
    
    stats = {
        "total": 0,
        "migrated": 0,
        "failed": 0,
        "errors": []
    }
    
    try:
        print("\n=== Migrating Text Files ===")
        text_files = db.storage.text.list()
        stats["total"] = len(text_files)
        
        for file_info in text_files:
            file_key = file_info.name
            print(f"  Migrating text file: {file_key}")
            
            if dry_run:
                stats["migrated"] += 1
                continue
            
            try:
                # Get file from Databutton
                file_data = db.storage.text.get(file_key)
                
                # Upload to Firebase Storage
                put_text(file_key, file_data)
                stats["migrated"] += 1
                print(f"    ✓ Migrated {file_key}")
                
            except Exception as e:
                stats["failed"] += 1
                error_msg = f"Failed to migrate {file_key}: {str(e)}"
                stats["errors"].append(error_msg)
                print(f"    ✗ {error_msg}")
        
        return {"success": True, **stats}
        
    except Exception as e:
        return {"success": False, "error": str(e), **stats}


def verify_migration() -> Dict[str, Any]:
    """Verify that files were migrated successfully."""
    print("\n=== Verifying Migration ===")
    
    try:
        # List files in Firebase Storage
        firebase_files = list_files()
        
        # Count files by type
        binary_count = len([f for f in firebase_files if not f.endswith(('.json', '.txt'))])
        json_count = len([f for f in firebase_files if f.endswith('.json')])
        text_count = len([f for f in firebase_files if f.endswith('.txt')])
        
        print(f"  Files in Firebase Storage:")
        print(f"    Binary: {binary_count}")
        print(f"    JSON: {json_count}")
        print(f"    Text: {text_count}")
        print(f"    Total: {len(firebase_files)}")
        
        return {
            "success": True,
            "total_files": len(firebase_files),
            "by_type": {
                "binary": binary_count,
                "json": json_count,
                "text": text_count
            }
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Migrate data from Databutton storage to Firebase Storage")
    parser.add_argument("--project-id", required=True, help="GCP Project ID")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode (don't actually migrate)")
    parser.add_argument("--type", choices=["binary", "json", "text", "all"], default="all", help="Type of files to migrate")
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("DRY RUN MODE - No changes will be made\n")
    
    # Initialize Firebase
    print("Initializing Firebase...")
    initialize_firebase()
    
    results = {}
    
    # Migrate based on type
    if args.type in ["binary", "all"]:
        results["binary"] = migrate_binary_files(dry_run=args.dry_run)
    
    if args.type in ["json", "all"]:
        results["json"] = migrate_json_files(dry_run=args.dry_run)
    
    if args.type in ["text", "all"]:
        results["text"] = migrate_text_files(dry_run=args.dry_run)
    
    # Verify migration
    if not args.dry_run:
        results["verification"] = verify_migration()
    
    # Print summary
    print("\n" + "="*60)
    print("Migration Summary")
    print("="*60)
    
    for file_type, result in results.items():
        if file_type == "verification":
            continue
        print(f"\n{file_type.upper()}:")
        print(f"  Total: {result.get('total', 0)}")
        print(f"  Migrated: {result.get('migrated', 0)}")
        print(f"  Failed: {result.get('failed', 0)}")
        if result.get('errors'):
            print(f"  Errors: {len(result['errors'])}")
            for error in result['errors'][:5]:  # Show first 5 errors
                print(f"    - {error}")
    
    if not args.dry_run and "verification" in results:
        print(f"\nVERIFICATION:")
        print(f"  Total files in Firebase: {results['verification'].get('total_files', 0)}")
    
    print("\n" + "="*60)
    
    if not args.dry_run:
        print("\n✓ Migration complete!")
        print("\nNext steps:")
        print("1. Verify all files are accessible in Firebase Storage")
        print("2. Test application functionality")
        print("3. Update Firestore documents to reference new storage URLs if needed")


if __name__ == "__main__":
    main()
