# Testing PWA Assets Setup

## Quick Verification

Since the download script may not have completed successfully, let's verify and test the setup:

### Step 1: Check if Files Exist

Run this in your terminal (PowerShell or Command Prompt):
```powershell
# Check icons directory
Test-Path "frontend\public\icons\icon-a93e7a03-192x192-any.png"

# Check splash directory  
Test-Path "frontend\public\splash\splash_screens-1efa1cf5-63d7-441e-a468-918a54fe0d05-iPhone_XS_Max.png"

# Count files
(Get-ChildItem "frontend\public\icons\*.png" -ErrorAction SilentlyContinue).Count
(Get-ChildItem "frontend\public\splash\*.png" -ErrorAction SilentlyContinue).Count
```

**Expected:** 
- Icons: 17 files
- Splash screens: 16 files

### Step 2: If Files Are Missing - Re-download

If files are missing, try running the download script again:

```bash
python scripts/download_pwa_assets.py
```

**Common issues:**
- Missing `requests` library: `pip install requests`
- Network issues: Check your internet connection
- Permission issues: Run as administrator if needed

### Step 3: Test the Build

Once files are downloaded, test that Vite copies them correctly:

```bash
cd frontend
yarn build
```

After building, check:
```powershell
# Check if files are in dist folder
Test-Path "frontend\dist\icons\icon-a93e7a03-192x192-any.png"
Test-Path "frontend\dist\splash\splash_screens-1efa1cf5-63d7-441e-a468-918a54fe0d05-iPhone_XS_Max.png"
```

### Step 4: Test Locally

Start the dev server and check browser console:

```bash
cd frontend
yarn dev
```

Then:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to access: `http://localhost:5173/icons/icon-a93e7a03-192x192-any.png`
4. Check if the file loads (should show 200 status)

### Step 5: Verify Configuration

Check that the paths in your code match:

1. **pwa-config.ts** - Should have paths like `/icons/...` and `/splash/...`
2. **PWAHead.tsx** - Should have paths like `/icons/...`
3. **pwa_manifest/__init__.py** - Should have paths like `/icons/...`

All paths should start with `/` (not `https://static.databutton.com/...`)

## Manual Download Alternative

If the script keeps failing, you can download files manually:

1. Create directories:
   ```
   frontend/public/icons/
   frontend/public/splash/
   ```

2. Download each file from:
   ```
   https://static.databutton.com/public/8dd83451-8b31-4e1c-9f5f-7283e708e5ac/FILENAME
   ```

3. Save to the appropriate directory

## Next Steps After Verification

Once files are confirmed:
1. ✅ Files exist in `frontend/public/icons/` and `frontend/public/splash/`
2. ✅ Build works: `yarn build` copies files to `dist/`
3. ✅ Dev server serves files correctly
4. ✅ Ready to deploy!
