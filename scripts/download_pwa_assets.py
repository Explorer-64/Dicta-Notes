#!/usr/bin/env python3
"""Script to download PWA assets (icons and splash screens) from Databutton CDN.

This script downloads all icons and splash screens referenced in the PWA config
and saves them to the appropriate directories for Firebase Hosting.

Usage:
    python scripts/download_pwa_assets.py
"""

import os
import requests
from pathlib import Path
import sys

# Base URL for Databutton CDN
DATABUTTON_CDN_BASE = "https://static.databutton.com/public/8dd83451-8b31-4e1c-9f5f-7283e708e5ac"

# Icons to download
ICONS = [
    "icon-a93e7a03-016x016-favicon.png",
    "icon-a93e7a03-032x032-favicon.png",
    "icon-a93e7a03-048x048-android-legacy.png",
    "icon-a93e7a03-072x072-android-legacy.png",
    "icon-a93e7a03-096x096-android-legacy.png",
    "icon-a93e7a03-120x120-ios.png",
    "icon-a93e7a03-144x144-android.png",
    "icon-a93e7a03-152x152-ios-ipad.png",
    "icon-a93e7a03-167x167-ios-ipad-pro.png",
    "icon-a93e7a03-180x180-ios.png",
    "icon-a93e7a03-192x192-any.png",
    "icon-a93e7a03-192x192-maskable.png",
    "icon-a93e7a03-256x256-windows.png",
    "icon-a93e7a03-384x384-android.png",
    "icon-a93e7a03-512x512-any.png",
    "icon-a93e7a03-512x512-maskable.png",
    "icon-a93e7a03-1024x1024-appstore.png",
]

# Splash screens to download
SPLASH_SCREENS = [
    "splash_screens-1efa1cf5-63d7-441e-a468-918a54fe0d05-iPhone_XS_Max.png",
    "splash_screens-2ad39a7c-ef38-4843-897b-c52dd6de82bb-iPad_10.2.png",
    "splash_screens-2e206bbc-7290-47e3-af4c-257edf3f2a8-iPhone_X.png",
    "splash_screens-31803924-e7ab-4735-8d2e-9f4d672c4bb5-iPad_Pro_11.png",
    "splash_screens-5217d4de-2d71-4283-9e4b-5c53ff6cb5e-iPad_10.5.png",
    "splash_screens-69b090af-5768-466b-bc2c-9b66a1930b28-iPhone_8_Plus.png",
    "splash_screens-6d3d2cde-9d6b-4417-a4a5-3d83c205c08d-iPad_Air_10.9.png",
    "splash_screens-82d4e77a-9538-42ac-8426-4c094e33422b-iPhone_XR.png",
    "splash_screens-8392b4ee-d0e5-459e-ae99-808a0e5411a1-iPhone_14.png",
    "splash_screens-b19987ef-ceb5-4fb5-b728-d175b4e79c06-iPhone_15_Pro_Max.png",
    "splash_screens-da5f03f6-7a13-48a0-a4bf-5af88c2ef61d-iPhone_8.png",
    "splash_screens-e6c7e8db-4f97-4fa3-a0eb-a329ca817ca7-iPad_Pro_12.9.png",
    "splash_screens-e9d4e583-1a1e-43f5-b434-7727f44a396-iPhone_5.png",
    "splash_screens-eb5463aa-7464-4c99-a8d7-1f2bfaf3a043-iPad_Mini_8.3.png",
    "splash_screens-f538c618-9d99-4957-8b0f-2da3ad3b5560-iPhone_15_Pro.png",
    "splash_screens-1c491388-7bc5-4b03-8401-47fd1314ff19-iPad_9.7.png",
]

def download_file(url: str, dest_path: Path) -> bool:
    """Download a file from URL to destination path."""
    try:
        print(f"  Downloading: {dest_path.name}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Create parent directory if it doesn't exist
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write file
        with open(dest_path, 'wb') as f:
            f.write(response.content)
        
        print(f"    ✓ Saved to {dest_path}")
        return True
    except Exception as e:
        print(f"    ✗ Error downloading {url}: {e}")
        return False

def main():
    # Get project root (parent of scripts directory)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    frontend_dir = project_root / "frontend"
    public_dir = frontend_dir / "public"
    icons_dir = public_dir / "icons"
    splash_dir = public_dir / "splash"
    
    print("Downloading PWA assets from Databutton CDN...")
    print(f"Destination: {public_dir}")
    print()
    
    # Download icons
    print("=== Downloading Icons ===")
    icons_success = 0
    for icon_name in ICONS:
        url = f"{DATABUTTON_CDN_BASE}/{icon_name}"
        dest_path = icons_dir / icon_name
        if download_file(url, dest_path):
            icons_success += 1
    
    print(f"\nIcons: {icons_success}/{len(ICONS)} downloaded")
    print()
    
    # Download splash screens
    print("=== Downloading Splash Screens ===")
    splash_success = 0
    for splash_name in SPLASH_SCREENS:
        url = f"{DATABUTTON_CDN_BASE}/{splash_name}"
        dest_path = splash_dir / splash_name
        if download_file(url, dest_path):
            splash_success += 1
    
    print(f"\nSplash Screens: {splash_success}/{len(SPLASH_SCREENS)} downloaded")
    print()
    
    # Summary
    total = len(ICONS) + len(SPLASH_SCREENS)
    total_success = icons_success + splash_success
    
    print("=" * 60)
    print(f"Download Summary: {total_success}/{total} files downloaded")
    print("=" * 60)
    
    if total_success == total:
        print("\n✓ All assets downloaded successfully!")
        print("\nNext steps:")
        print("1. Update pwa-config.ts to use local paths (/icons/...)")
        print("2. Update PWAHead.tsx to use local paths")
        print("3. Update pwa_manifest/__init__.py to use local paths")
    else:
        print(f"\n⚠ Warning: {total - total_success} files failed to download")
        print("Please check the errors above and retry if needed.")

if __name__ == "__main__":
    main()
