# Running Dicta-Notes on Port 5174

The Vite config has been updated to use port **5174** instead of 5173 to avoid conflicts with your other app.

## Start the Dev Server

```bash
cd frontend
yarn dev
```

The app will now run on: **http://localhost:5174**

## What to Test

Once the server is running:

1. **Open http://localhost:5174** in your browser
2. **Check the browser console** (F12) for any errors
3. **Check the Network tab** to see if PWA assets load:
   - Try accessing: `http://localhost:5174/icons/icon-a93e7a03-192x192-any.png`
   - Should return 200 (if files were downloaded) or 404 (if files are missing)

## Verify PWA Assets

### Option 1: Check Browser DevTools
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Check **Manifest** section - should show icons with paths like `/icons/...`
4. Check **Service Workers** - should show registered service worker

### Option 2: Check Network Requests
1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for requests to `/icons/` and `/splash/` paths
5. Check if they return 200 (success) or 404 (missing files)

## If Assets Are Missing (404 errors)

If you see 404 errors for icon/splash files, you need to download them:

```bash
# From project root
python scripts/download_pwa_assets.py
```

This will download all icons to `frontend/public/icons/` and splash screens to `frontend/public/splash/`.

## Expected Behavior

- ✅ App loads on http://localhost:5174
- ✅ No 404 errors for icon/splash files (if files are downloaded)
- ✅ PWA manifest accessible at `/api/pwa/manifest.json`
- ✅ Icons visible in browser tab and PWA install prompt
