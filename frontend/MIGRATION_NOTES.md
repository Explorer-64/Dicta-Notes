# Migration Notes - Databutton to Firebase/GCP

## PWA Assets Migration Required

The following files reference Databutton CDN URLs for icons and splash screens. These assets need to be downloaded and stored locally:

### Files with Databutton CDN references:
1. `frontend/src/utils/pwa-config.ts` - Contains all icon and splash screen URLs
2. `frontend/src/components/PWAHead.tsx` - Contains apple-touch-icon URLs
3. `frontend/backend/app/apis/pwa_manifest/__init__.py` - Contains manifest icon URLs

### Action Required:
1. Download all icons from Databutton CDN:
   - All icon sizes (16x16 through 1024x1024)
   - All splash screens for various devices
   
2. Store them in:
   - `frontend/public/icons/` for icons
   - `frontend/public/splash/` for splash screens

3. Update the URLs in the files above to use local paths:
   - Change from: `https://static.databutton.com/public/...`
   - Change to: `/icons/icon-...` or `/splash/splash-...`

### Icon Sizes Needed:
- 16x16, 32x32, 48x48, 72x72, 96x96, 120x120, 144x144, 152x152, 167x167, 180x180, 192x192 (any and maskable), 256x256, 384x384, 512x512 (any and maskable), 1024x1024

### Splash Screens Needed:
- iPhone XS Max, iPad 10.2, iPhone X, iPad Pro 11, iPad 10.5, iPhone 8 Plus, iPad Air 10.9, iPhone XR, iPhone 14, iPhone 15 Pro Max, iPhone 8, iPad Pro 12.9, iPhone 5, iPad Mini 8.3, iPhone 15 Pro, iPad 9.7

## Environment Variables

Update these in your deployment:
- `VITE_API_URL` - Set to your Cloud Run backend URL
- `VITE_WS_API_URL` - Set to your WebSocket URL (if different)
- `VITE_FIREBASE_CONFIG` - Firebase configuration JSON
- `GOOGLE_CLOUD_PROJECT` - GCP project ID (for backend)

## Backend Secrets

All secrets have been migrated to use Google Cloud Secret Manager. Ensure:
1. All secrets are created in Secret Manager
2. Service account has Secret Manager access
3. Local development can use `.env` file as fallback

## Storage Migration

All storage operations now use Firebase Storage. The `storage_manager.py` module provides a unified interface.

## Remaining Tasks

1. Download and migrate PWA assets (icons/splash screens)
2. Update Cloud Run deployment configuration
3. Set up Firebase Hosting
4. Run data migration scripts (Phase 5)
5. Test end-to-end functionality
