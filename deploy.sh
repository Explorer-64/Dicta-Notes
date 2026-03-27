#!/bin/bash
set -e

echo "==> Committing and pushing to GitHub..."
git add -A
git diff --cached --quiet || git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')"
git push origin main

echo "==> Building frontend..."
cd frontend
yarn build
cd ..

echo "==> Deploying frontend to Firebase Hosting..."
firebase deploy --only hosting

echo "==> Deploying backend to Cloud Run..."
cd frontend/backend
gcloud builds submit --config cloudbuild.yaml
cd ../..

echo "==> Done."
