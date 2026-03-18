#!/usr/bin/env python3
"""Script to verify PWA assets were downloaded correctly."""

from pathlib import Path

def verify_assets():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    frontend_dir = project_root / "frontend"
    public_dir = frontend_dir / "public"
    icons_dir = public_dir / "icons"
    splash_dir = public_dir / "splash"
    
    print("Verifying PWA assets...")
    print(f"Checking: {public_dir}")
    print()
    
    # Check icons
    icon_files = [
        "icon-a93e7a03-016x016-favicon.png",
        "icon-a93e7a03-192x192-any.png",
        "icon-a93e7a03-512x512-any.png",
    ]
    
    print("=== Checking Icons ===")
    icons_found = 0
    icons_missing = []
    
    if icons_dir.exists():
        for icon_file in icon_files:
            icon_path = icons_dir / icon_file
            if icon_path.exists():
                size = icon_path.stat().st_size
                print(f"  ✓ {icon_file} ({size:,} bytes)")
                icons_found += 1
            else:
                print(f"  ✗ {icon_file} - MISSING")
                icons_missing.append(icon_file)
        
        # Count all icon files
        all_icons = list(icons_dir.glob("*.png"))
        print(f"\n  Total icon files found: {len(all_icons)}")
    else:
        print(f"  ✗ Icons directory does not exist: {icons_dir}")
    
    print()
    
    # Check splash screens
    splash_files = [
        "splash_screens-1efa1cf5-63d7-441e-a468-918a54fe0d05-iPhone_XS_Max.png",
        "splash_screens-8392b4ee-d0e5-459e-ae99-808a0e5411a1-iPhone_14.png",
    ]
    
    print("=== Checking Splash Screens ===")
    splash_found = 0
    splash_missing = []
    
    if splash_dir.exists():
        for splash_file in splash_files:
            splash_path = splash_dir / splash_file
            if splash_path.exists():
                size = splash_path.stat().st_size
                print(f"  ✓ {splash_file} ({size:,} bytes)")
                splash_found += 1
            else:
                print(f"  ✗ {splash_file} - MISSING")
                splash_missing.append(splash_file)
        
        # Count all splash files
        all_splash = list(splash_dir.glob("*.png"))
        print(f"\n  Total splash screen files found: {len(all_splash)}")
    else:
        print(f"  ✗ Splash directory does not exist: {splash_dir}")
    
    print()
    print("=" * 60)
    
    if icons_dir.exists() and splash_dir.exists():
        all_icons_count = len(list(icons_dir.glob("*.png"))) if icons_dir.exists() else 0
        all_splash_count = len(list(splash_dir.glob("*.png"))) if splash_dir.exists() else 0
        
        expected_icons = 17
        expected_splash = 16
        
        print(f"Summary:")
        print(f"  Icons: {all_icons_count}/{expected_icons}")
        print(f"  Splash Screens: {all_splash_count}/{expected_splash}")
        print()
        
        if all_icons_count >= expected_icons and all_splash_count >= expected_splash:
            print("✓ All assets are present!")
            return True
        else:
            print("⚠ Some assets are missing. Run download script again:")
            print("  python scripts/download_pwa_assets.py")
            return False
    else:
        print("✗ Asset directories not found!")
        print("  Run the download script first:")
        print("  python scripts/download_pwa_assets.py")
        return False

if __name__ == "__main__":
    verify_assets()
