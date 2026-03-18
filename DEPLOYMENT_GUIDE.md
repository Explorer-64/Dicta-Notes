# Deployment Guide - Dicta-Notes

This guide will walk you through completing the remaining manual steps to deploy your application.

## ✅ Step 1: Download PWA Assets

The configuration files have been updated to use local paths. Now you need to download the actual icon and splash screen files.

### Option A: Using the Python Script (Recommended)

1. Open a terminal/command prompt in the project root
2. Install requests if needed: `pip install requests`
3. Run the download script:
   ```bash
   python scripts/download_pwa_assets.py
   ```

This will download all icons to `frontend/public/icons/` and splash screens to `frontend/public/splash/`.

### Option B: Manual Download

If the script doesn't work, you can download the files manually:

1. Create directories:
   ```
   frontend/public/icons/
   frontend/public/splash/
   ```

2. Download each file from these URLs (replace `FILENAME` with the actual filename):
   - Icons: `https://static.databutton.com/public/8dd83451-8b31-4e1c-9f5f-7283e708e5ac/FILENAME`
   - Splash screens: `https://static.databutton.com/public/8dd83451-8b31-4e1c-9f5f-7283e708e5ac/FILENAME`

**Icon files to download:**
- icon-a93e7a03-016x016-favicon.png
- icon-a93e7a03-032x032-favicon.png
- icon-a93e7a03-048x048-android-legacy.png
- icon-a93e7a03-072x072-android-legacy.png
- icon-a93e7a03-096x096-android-legacy.png
- icon-a93e7a03-120x120-ios.png
- icon-a93e7a03-144x144-android.png
- icon-a93e7a03-152x152-ios-ipad.png
- icon-a93e7a03-167x167-ios-ipad-pro.png
- icon-a93e7a03-180x180-ios.png
- icon-a93e7a03-192x192-any.png
- icon-a93e7a03-192x192-maskable.png
- icon-a93e7a03-256x256-windows.png
- icon-a93e7a03-384x384-android.png
- icon-a93e7a03-512x512-any.png
- icon-a93e7a03-512x512-maskable.png
- icon-a93e7a03-1024x1024-appstore.png

**Splash screen files to download:**
- splash_screens-1efa1cf5-63d7-441e-a468-918a54fe0d05-iPhone_XS_Max.png
- splash_screens-2ad39a7c-ef38-4843-897b-c52dd6de82bb-iPad_10.2.png
- splash_screens-2e206bbc-7290-47e3-af4c-257edf3f2a8-iPhone_X.png
- splash_screens-31803924-e7ab-4735-8d2e-9f4d672c4bb5-iPad_Pro_11.png
- splash_screens-5217d4de-2d71-4283-9e4b-5c53ff6cb5e-iPad_10.5.png
- splash_screens-69b090af-5768-466b-bc2c-9b66a1930b28-iPhone_8_Plus.png
- splash_screens-6d3d2cde-9d6b-4417-a4a5-3d83c205c08d-iPad_Air_10.9.png
- splash_screens-82d4e77a-9538-42ac-8426-4c094e33422b-iPhone_XR.png
- splash_screens-8392b4ee-d0e5-459e-ae99-808a0e5411a1-iPhone_14.png
- splash_screens-b19987ef-ceb5-4fb5-b728-d175b4e79c06-iPhone_15_Pro_Max.png
- splash_screens-da5f03f6-7a13-48a0-a4bf-5af88c2ef61d-iPhone_8.png
- splash_screens-e6c7e8db-4f97-4fa3-a0eb-a329ca817ca7-iPad_Pro_12.9.png
- splash_screens-e9d4e583-1a1e-43f5-b434-7727f44a396-iPhone_5.png
- splash_screens-eb5463aa-7464-4c99-a8d7-1f2bfaf3a043-iPad_Mini_8.3.png
- splash_screens-f538c618-9d99-4957-8b0f-2da3ad3b5560-iPhone_15_Pro.png
- splash_screens-1c491388-7bc5-4b03-8401-47fd1314ff19-iPad_9.7.png

---

## ✅ Step 2: Google Cloud Setup

### 2.1 Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `dicta-notes`
3. Navigate to **APIs & Services** > **Library**
4. Enable the following APIs:
   - **Cloud Run API**
   - **Cloud Build API**
   - **Secret Manager API**
   - **Cloud Storage API**
   - **Firestore API**
   - **Cloud Resource Manager API**

### 2.2 Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `dicta-notes-backend`
4. Description: `Service account for Dicta-Notes Cloud Run backend`
5. Click **Create and Continue**
6. Grant the following roles:
   - **Secret Manager Secret Accessor**
   - **Storage Object Admin** (or **Cloud Storage Object Admin**)
   - **Cloud Datastore User** (for Firestore)
7. Click **Continue** then **Done**

### 2.3 Migrate Secrets

1. Make sure you have access to your Databutton secrets
2. Install required packages:
   ```bash
   pip install databutton google-cloud-secret-manager
   ```
3. Run the migration script:
   ```bash
   cd frontend/backend
   python scripts/migrate_secrets.py --project-id dicta-notes
   ```

   **Note:** If you don't have access to Databutton, you'll need to manually create secrets in Google Cloud Secret Manager:
   - Go to **Secret Manager** in Google Cloud Console
   - Click **Create Secret** for each secret
   - Required secrets:
     - `GEMINI_API_KEY`
     - `RESEND_API_KEY`
     - `PAYPAL_CLIENT_ID`
     - `PAYPAL_CLIENT_SECRET`
     - `PAYPAL_PLAN_IDS`
     - `ZOOM_CLIENT_ID`
     - `ZOOM_CLIENT_SECRET`
     - `ZOOM_ACCOUNT_ID`
     - `BING_INDEXNOW_API_KEY`
     - `SUPPORT_EMAIL`
     - `FIREBASE_SERVICE_ACCOUNT`
     - `GOOGLE_SEARCH_CONSOLE_CREDENTIALS`

---

## ✅ Step 3: Run Data Migration

Migrate your data from Databutton storage to Firebase Storage:

1. Make sure Firebase is initialized (check your Firebase configuration)
2. Run the migration script:
   ```bash
   cd frontend/backend/app/scripts
   python migrate_databutton_storage.py --project-id dicta-notes
   ```

   **Note:** This requires:
   - Access to Databutton storage
   - Firebase credentials configured
   - Google Cloud project set up

   You can run with `--dry-run` first to see what will be migrated:
   ```bash
   python migrate_databutton_storage.py --project-id dicta-notes --dry-run
   ```

---

## ✅ Step 4: Deploy and Test

### 4.1 Deploy Backend (Cloud Run)

1. Build and deploy:
   ```bash
   cd frontend/backend
   gcloud builds submit --config cloudbuild.yaml
   ```

   Or manually:
   ```bash
   gcloud run deploy dicta-notes-backend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --service-account dicta-notes-backend@dicta-notes.iam.gserviceaccount.com \
     --set-env-vars GOOGLE_CLOUD_PROJECT=dicta-notes,FIREBASE_STORAGE_BUCKET=dicta-notes.firebasestorage.app
   ```

2. Note the Cloud Run URL (e.g., `https://dicta-notes-backend-xxxxx.run.app`)

### 4.2 Update Frontend Environment Variables

1. Update `frontend/.env.production` (or create it) with:
   ```
   VITE_API_URL=https://your-cloud-run-url.run.app
   VITE_WS_API_URL=wss://your-cloud-run-url.run.app
   VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"dicta-notes",...}
   ```

### 4.3 Build Frontend

```bash
cd frontend
yarn build
```

This creates the `dist` folder with all assets including your PWA icons and splash screens.

### 4.4 Deploy Frontend (Firebase Hosting)

1. Make sure you're logged in to Firebase:
   ```bash
   firebase login
   ```

2. Initialize Firebase (if not already done):
   ```bash
   firebase init hosting
   ```
   - Select existing project: `dicta-notes`
   - Public directory: `frontend/dist`
   - Configure as single-page app: Yes
   - Set up automatic builds: No (or Yes if using GitHub Actions)

3. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

### 4.5 Test Your Deployment

1. Visit your Firebase Hosting URL (shown after deployment)
2. Test PWA installation:
   - On mobile: Add to home screen
   - On desktop: Look for install prompt in browser
3. Verify icons and splash screens load correctly
4. Test API connectivity to Cloud Run backend
5. Test authentication and core features

---

## Troubleshooting

### PWA Assets Not Loading
- Verify files are in `frontend/public/icons/` and `frontend/public/splash/`
- Check that files were copied to `frontend/dist/` after build
- Verify Firebase Hosting serves static files correctly

### Backend Not Accessible
- Check Cloud Run service is running
- Verify service account has correct permissions
- Check environment variables are set correctly
- Review Cloud Run logs: `gcloud run services logs read dicta-notes-backend`

### Secrets Not Found
- Verify secrets exist in Secret Manager
- Check service account has "Secret Manager Secret Accessor" role
- Verify `GOOGLE_CLOUD_PROJECT` environment variable is set

### Data Migration Issues
- Ensure you have access to Databutton storage
- Check Firebase Storage bucket exists and is accessible
- Verify Firebase credentials are configured

---

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure CDN for better performance
3. Set up monitoring and alerts
4. Configure backup strategies
5. Review security settings

---

## Need Help?

- Check the main `README.md` for general setup
- Review `MIGRATION_NOTES.md` for migration details
- Check Google Cloud Console for service status
- Review Firebase Console for hosting status
