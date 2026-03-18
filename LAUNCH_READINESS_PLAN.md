# Dicta-Notes: Launch Readiness Plan

This document is a phased implementation plan to address all items from the codebase assessment and prepare Dicta-Notes for production launch.

---

## Assessment Verification Summary

The assessment is **accurate**. Key findings verified:

| Finding | Status |
|---------|--------|
| No CORS middleware | ✅ Confirmed – `main.py` has no `CORSMiddleware` |
| Port mismatch (8001 vs 8000) | ✅ Confirmed – vite default & proxy use 8001; uvicorn default is 8000 |
| No `.env.production` | ✅ Confirmed – does not exist |
| `.env` in `.gitignore` | ✅ Root & backend `.gitignore` include `.env` |
| Hardcoded Firebase bucket | ✅ Confirmed – `firebase/__init__.py` line 75: `'dicta-notes.firebasestorage.app'` |
| PyJWT + pyjwt duplicate | ✅ Confirmed – both in `requirements.txt` |
| Unpinned deps (numpy, requests, etc.) | ✅ Confirmed |
| Dockerfile single uvicorn worker | ✅ Confirmed |
| Debug endpoint | ✅ Confirmed – `debug_mode` is auth-protected but leaks dev/prod info |
| `isolatedModules: false` | ✅ Confirmed – `tsconfig.json` line 21 |
| firebase.json missing security headers | ✅ Confirmed |
| Export "not implemented" | ⚠️ Partial – `TierAwareExportButton` calls backend; SessionDetail has **dead** `handleExport` with toast |

---

## Phase 0: IMMEDIATE – Security (Do First)

### 0.1 Rotate Exposed API Keys
**Priority: CRITICAL**

- [ ] Rotate **all** keys referenced in `.env`:
  - Firebase Service Account
  - Gemini API Key
  - Resend API Key
  - Zoom Client Secret
  - Google Search Console credentials
- [ ] Store production secrets in **Google Cloud Secret Manager** (not `.env` in prod)
- [ ] If `.env` was ever committed: run `git log -p -- .env` and scrub with `git filter-repo` or BFG Repo-Cleaner
- [ ] Add `.env.example` with placeholder values only

### 0.2 Add CORS Middleware
**Priority: CRITICAL**

- [x] Add `starlette.middleware.cors.CORSMiddleware` to `main.py`
- [ ] Use explicit allowed origins (avoid `["*"]` in production)
- [ ] Allow production frontend URL(s), e.g. `https://dicta-notes.web.app`

---

## Phase 1: Week 1 – Critical Blockers

### 1.1 Fix Port Mismatch
**File:** `frontend/vite.config.ts`

- [x] Change default `VITE_API_URL` from `http://localhost:8001` → `http://localhost:8000`
- [ ] Change `VITE_WS_API_URL` from `ws://localhost:8001` → `ws://localhost:8000`
- [ ] Change proxy `target` from `http://127.0.0.1:8001` → `http://127.0.0.1:8000`
- [ ] Or: make backend run on 8001 via `uvicorn main:app --port 8001` (document in README)

### 1.2 Create frontend `.env.production`
**File:** Create `frontend/.env.production`

- [x] Add production API URL (e.g. Cloud Run URL) — `.env.production.example` created
- [ ] Add `VITE_FIREBASE_CONFIG` for production Firebase config
- [ ] Ensure `.env.production` is **not** committed if it contains secrets (use build-time env in CI instead)

Example:
```
VITE_API_URL=https://dicta-notes-backend-xxxxx.run.app
VITE_WS_API_URL=wss://dicta-notes-backend-xxxxx.run.app
VITE_FIREBASE_CONFIG={"apiKey":"...","projectId":"dicta-notes",...}
```

### 1.3 Startup Validation of Required Secrets
**File:** `frontend/backend/main.py`

- [x] Add startup check that validates required env vars / secrets before accepting traffic
- [ ] Exit with non-zero code if critical secrets are missing (e.g. `FIREBASE_SERVICE_ACCOUNT`)
- [ ] Log clear error messages for each missing item

### 1.4 Make Firebase Storage Bucket Configurable
**File:** `frontend/backend/app/apis/firebase/__init__.py`

- [x] Replace hardcoded `'dicta-notes.firebasestorage.app'` with:
  - `os.environ.get("FIREBASE_STORAGE_BUCKET", "dicta-notes.firebasestorage.app")`
- [ ] Or use `get_secret("FIREBASE_STORAGE_BUCKET")` for production

---

## Phase 2: Week 2 – Production Hardening

### 2.1 Replace `print()` with Structured Logging
**Scope:** 25+ backend files

- [ ] Add `import logging` and configure logger in `main.py`
- [ ] Replace `print(...)` with `logging.info()`, `logging.warning()`, `logging.error()` as appropriate
- [ ] Use JSON logging for Cloud Logging compatibility (e.g. `python-json-logger`)

### 2.2 Pin Dependencies in `requirements.txt`
**File:** `frontend/backend/requirements.txt`

- [x] Remove duplicate: keep `PyJWT` only (remove `pyjwt`)
- [ ] Pin versions for: `numpy`, `requests`, `openai`, `beautifulsoup4`, `google-generativeai`, `pydub`, `firebase-admin`, `Pillow`, `python-docx`, `reportlab`, `httpx`, `pydantic`, `google-cloud-*`, `resend`, etc.
- [ ] Run `pip freeze > requirements.lock` (optional) or pin major.minor versions

### 2.3 Dockerfile Production Mode
**File:** `frontend/backend/Dockerfile`

- [x] Use Gunicorn + Uvicorn workers for production:
  ```dockerfile
  CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8080"]
  ```
- [ ] Add `gunicorn` to `requirements.txt`

### 2.4 Remove or Restrict Debug Endpoint
**File:** `frontend/backend/app/apis/debug_mode/__init__.py`

- [x] Option B: Add admin-only check — returns 404 in PROD (implemented)
- [ ] Option B: Add admin-only check (e.g. allowlist of user IDs) and return 403 for others
- [ ] Option C: Add `disableAuth: true` only in dev and gate by env (not ideal)

### 2.5 Add Security Headers to firebase.json
**File:** `firebase.json`

- [x] Add headers block for HTML:
  - `X-Frame-Options: DENY` or `SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (start conservative, tighten over time)

---

## Phase 3: Week 3 – Feature Parity & Cleanup

### 3.1 Fix tsconfig `isolatedModules`
**File:** `frontend/tsconfig.json`

- [x] Set `"isolatedModules": true` (Vite/esbuild expects this)
- [ ] Fix any resulting type/import errors

### 3.2 Clean Up Dead Code
**File:** `frontend/src/pages/SessionDetail.tsx`

- [x] Remove the unused `handleExport` function that showed "Backend not implemented yet"
- [ ] Remove `ExportOptions` type if it becomes unused

### 3.3 Stub Features – Decide
Choose one for each:

| Feature | Option A | Option B |
|---------|----------|----------|
| PayPal billing | Implement or wire to Stripe | Keep "coming soon" toast, hide from main nav |
| Non-profit application | Implement API | Remove or keep as placeholder |
| Speaker name editing | Persist via backend | Keep current behavior, document as known limitation |
| Audio cloud persistence | Add Firebase Storage upload | Keep IndexedDB only for now |
| Language selection for transcription | Make configurable | Document as future enhancement |

### 3.4 Cosmetic Cleanup
- [ ] Search for `Databutton storage` and similar comments; update to "Firebase Storage"
- [ ] Optionally remove `DATABUTTON_EXTENSIONS` fallbacks later (low priority)

---

## Phase 4: Pre-Launch – Operations

### 4.1 Cloud Monitoring & Alerting
- [ ] Set up Cloud Monitoring dashboards for:
  - Request rate, latency, error rate
  - Transcription API usage
  - Firebase/Firestore usage
- [ ] Configure alerts for error rate > threshold, high latency, or quota exhaustion

### 4.2 Firestore Backups
- [ ] Enable scheduled Firestore exports to Cloud Storage
- [ ] Document restore procedure

### 4.3 Load Testing
- [ ] Run load test against transcription endpoint (e.g. k6, locust)
- [ ] Verify rate limiting (50 req/min) and scaling behavior
- [ ] Test Cloud Run cold starts

### 4.4 Documentation
- [ ] Update README with production deployment steps
- [ ] Document required environment variables
- [ ] Add runbook for common operations

---

## Suggested Execution Order

```
Week 0 (Immediate):
  [0.1] Rotate keys
  [0.2] Add CORS

Week 1:
  [1.1] Port mismatch
  [1.2] .env.production
  [1.3] Startup validation
  [1.4] Configurable bucket

Week 2:
  [2.1] Structured logging
  [2.2] Pin dependencies
  [2.3] Dockerfile/Gunicorn
  [2.4] Debug endpoint
  [2.5] Security headers

Week 3:
  [3.1] isolatedModules
  [3.2] Dead code cleanup
  [3.3] Stub feature decisions
  [3.4] Cosmetic cleanup

Pre-Launch:
  [4.1] Monitoring
  [4.2] Backups
  [4.3] Load test
  [4.4] Documentation
```

---

## Checklist Summary

| Phase | # Items | Est. Effort |
|-------|---------|-------------|
| 0 – Immediate | 2 | 1–2 hours |
| 1 – Critical Blockers | 4 | 4–6 hours |
| 2 – Production Hardening | 5 | 8–12 hours |
| 3 – Feature Parity | 4 | 4–8 hours |
| 4 – Pre-Launch Ops | 4 | 8–16 hours |

**Total estimated effort:** 25–44 hours

---

---

## Implementation Progress Log

| Date | Item | Status |
|------|------|--------|
| 2025-02-13 | Plan created | Done |
| 2025-02-13 | 0.2 Add CORS middleware | Done |
| 2025-02-13 | 1.1 Fix port mismatch (8001→8000) | Done |
| 2025-02-13 | 1.2 Create .env.production.example | Done |
| 2025-02-13 | 1.3 Startup validation for secrets | Done |
| 2025-02-13 | 1.4 Configurable Firebase bucket | Done |
| 2025-02-13 | 2.2 Pin dependencies, remove pyjwt duplicate | Done |
| 2025-02-13 | 2.3 Dockerfile Gunicorn production mode | Done |
| 2025-02-13 | 2.4 Debug endpoint restricted (404 in PROD) | Done |
| 2025-02-13 | 2.5 Security headers (firebase.json) | Done |
| 2025-02-13 | 3.1 tsconfig isolatedModules: true | Done |
| 2025-02-13 | 3.2 Remove dead handleExport code | Done |
| 2025-02-13 | Backend .env.example created | Done |

*Document generated from codebase assessment. Update this plan as items are completed.*
