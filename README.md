# Dicta-Notes

AI-powered meeting transcription and translation application.

## Stack

- **Frontend**: React + TypeScript (Vite) with `yarn` as package manager
- **Backend**: Python FastAPI server with `uv` as package manager
- **Hosting**: Firebase Hosting (frontend) + Google Cloud Run (backend)
- **Storage**: Firebase Storage + Firestore
- **Secrets**: Google Cloud Secret Manager

## Quickstart

### Local Development

1. Install dependencies:

```bash
make
```

2. Set up environment variables:

```bash
# Backend - Create .env file in frontend/backend/
GOOGLE_CLOUD_PROJECT=dicta-notes
FIREBASE_STORAGE_BUCKET=dicta-notes.firebasestorage.app

# Frontend - Update frontend/.env
VITE_API_URL=http://localhost:8000
VITE_WS_API_URL=ws://localhost:8000
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"dicta-notes",...}
```

3. Start the backend and frontend servers in separate terminals:

```bash
make run-backend
make run-frontend
```

The backend server runs on port 8000 and the frontend development server runs on port 5173. Visit <http://localhost:5173> to view the application.

## Deployment

### Backend (Cloud Run)

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
  --set-env-vars GOOGLE_CLOUD_PROJECT=dicta-notes,FIREBASE_STORAGE_BUCKET=dicta-notes.firebasestorage.app
```

### Frontend (Firebase Hosting)

1. Build the frontend:

```bash
cd frontend
yarn build
```

2. Deploy to Firebase Hosting:

```bash
firebase deploy --only hosting
```

## Configuration

### Secrets Management

All secrets are stored in Google Cloud Secret Manager. For local development, you can use environment variables as fallback.

Required secrets:
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_PLAN_IDS`
- `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_ACCOUNT_ID`
- `BING_INDEXNOW_API_KEY`
- `SUPPORT_EMAIL`
- `FIREBASE_SERVICE_ACCOUNT`
- `GOOGLE_SEARCH_CONSOLE_CREDENTIALS`

### Service Account

The Cloud Run service needs a service account with:
- Secret Manager Secret Accessor
- Cloud Storage Object Admin
- Firestore User

## Migration Notes

See `MIGRATION_NOTES.md` for details about migrating from Databutton to Firebase/GCP.
