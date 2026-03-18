# Translation System — Architecture Reference

> This document describes the full translation system as implemented in **dicta-notes**.
> Use it as the canonical reference when implementing the same system in other StackApps.

---

## Overview

The translation system provides:
- **On-demand page translation** via Gemini AI (one click, full page)
- **Firestore-backed shared cache** — translate once, all users benefit
- **Session persistence** — navigate between pages without re-translating
- **Preferred language auto-translate** — users with a non-English browser language get the app in their language automatically on every visit

---

## Architecture at a Glance

```
User browser
  └── GlobalTranslation.tsx (React component, mounted at app root)
        ├── reads/writes preferredLanguage (Zustand store → localStorage)
        ├── reads/writes session language (sessionStorage)
        └── calls brain client (auto-generated HTTP client)
              ├── POST /routes/translation_cache/get-translation  → Firestore cache lookup
              ├── POST /routes/translation_cache/save-translation → Firestore cache write
              └── POST /routes/translate                          → Gemini AI (cache miss only)

Backend (FastAPI on Cloud Run)
  ├── app/apis/translation_cache/__init__.py  — cache read/write endpoints
  ├── app/apis/translate/__init__.py          — Gemini translation endpoint
  └── routers.json                            — auth config per router
```

---

## Part 1: Backend

### 1.1 Translation endpoint (`/routes/translate`)

Calls Gemini to translate text. Requires auth (standard — do not set `disableAuth`).

Input: `{ text: string, target_language: string }`
Output: `{ translated_text: string }`

Use `gemini-2.5-flash` or later. (`gemini-2.0-flash` is deprecated and will 500.)

### 1.2 Translation cache endpoints (`/routes/translation_cache/`)

File: `app/apis/translation_cache/__init__.py`

**Critical: these endpoints must be public** (`disableAuth: true` in `routers.json`).
The cache is a shared global resource — anonymous users need it too, and requiring auth
would cause silent 401 fallbacks and defeat the purpose.

The sensitive endpoints (`/update-metrics`, `/cleanup`) are still protected at the
Python level via non-Optional `AuthorizedUser` dependency — the router-level
`disableAuth` only removes the JWT gate, it doesn't affect Python-level auth params.

#### Cache key generation

```python
def generate_cache_key(path: str, language: str, content: str) -> str:
    content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
    safe_path = path.strip("/").replace("/", "_") or "root"
    return f"{safe_path}-{language}-{content_hash}"
```

**Why `safe_path`?** Firestore document IDs cannot contain forward slashes — they are
interpreted as path separators. `/` becomes `root`, `/sessions` becomes `sessions`,
`/sessions/detail` becomes `sessions_detail`. Without this, Firestore throws:
`A document must have an even number of path elements`.

#### Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/get-translation` | POST | None | Check Firestore cache for a translation |
| `/save-translation` | POST | None | Write a new translation to Firestore cache |
| `/update-metrics` | POST | Required | Increment global hit/miss counters |
| `/cleanup` | POST | Required | Delete cache entries older than 30 days |

Request bodies (not query params — this is critical for brain client calls):

```python
class GetTranslationRequest(BaseModel):
    path: str            # URL path, e.g. "/sessions"
    language: str        # ISO code, e.g. "es"
    original_content: str  # the raw text being translated

class SaveTranslationRequest(BaseModel):
    path: str
    language: str
    original_content: str
    translated_content: str
```

The cache entry in Firestore (`translationCache/{cache_key}`):
```json
{
  "originalHash": "<sha256 of original_content>",
  "translatedContent": "...",
  "language": "es",
  "path": "/sessions",
  "timestamp": 1741234567000
}
```

Cache validity is confirmed by comparing `originalHash` — if the source content
changes, the old cache entry is ignored (hash mismatch).

### 1.3 `routers.json`

```json
"translation_cache": { "name": "translation_cache", "version": "...", "disableAuth": true },
"translate":         { "name": "translate",          "version": "...", "disableAuth": false }
```

---

## Part 2: Frontend utility — `translationCache.ts`

File: `src/utils/translationCache.ts`

This wraps the brain client calls and provides a clean API for the component.

```ts
import brain from 'brain';

export async function getCachedTranslation(
  path: string,
  language: string,
  originalContent: string
): Promise<string | null> {
  const response = await brain.get_cached_translation({
    path,
    language,
    original_content: originalContent,
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.cache_hit || !data.cached_translation) return null;
  // IMPORTANT: return .translatedContent (string), not the whole object
  return data.cached_translation.translatedContent;
}

export async function saveTranslationToCache(
  path: string,
  language: string,
  originalContent: string,
  translatedContent: string
): Promise<void> {
  await brain.save_translation({
    path,
    language,
    original_content: originalContent,
    translated_content: translatedContent,
  });
}
```

**Common mistake**: returning `data.cached_translation` (object) instead of
`data.cached_translation.translatedContent` (string). This causes `[object Object]`
to be rendered in the DOM on cache hits.

**Brain client call pattern**: always pass params as a single object argument
(POST body), never as individual arguments or query params. The brain client
serialises the object as JSON body automatically.

---

## Part 3: Language preference store — `languageStore.ts`

File: `src/utils/languageStore.ts`

A Zustand store persisted to `localStorage` via `persist` middleware.

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      preferredLanguage: getBrowserLanguage(),  // navigator.language.split('-')[0]
      isInitialized: false,
      setPreferredLanguage: async (language, user) => { ... },
      initializeLanguagePreference: async (user) => { ... },
    }),
    { name: 'app-language' }  // localStorage key — use a unique key per app
  )
);

function getBrowserLanguage(): string {
  return navigator.language.split('-')[0] || 'en';
}
```

Key points:
- `preferredLanguage` defaults to the **browser language** — a Korean user gets `'ko'`
  without any setup.
- For authenticated users, `initializeLanguagePreference` loads the saved preference
  from the backend API and overrides the default.
- The `persist` middleware means `preferredLanguage` is available **synchronously on
  mount** from `localStorage` — no async wait needed.
- Call `setPreferredLanguage(lang, user)` when the user manually picks a language.
  For authenticated users this also saves to the backend so it syncs across devices.

---

## Part 4: GlobalTranslation component

File: `src/components/GlobalTranslation.tsx`

Mount this **once at the app root** (e.g. inside `App.tsx` or `AppLayout.tsx`),
inside a `<BrowserRouter>` so it has access to `useLocation`.

```tsx
// In App.tsx / AppLayout.tsx
import GlobalTranslation from 'components/GlobalTranslation';

function AppLayout() {
  return (
    <>
      <GlobalTranslation />
      <Outlet />  {/* or your page content */}
    </>
  );
}
```

### 4.1 What it renders

A floating toolbar (fixed position, bottom-right) with:
- Language selector `<select>`
- "Translate page" button
- Revert button — shown only when the page is translated, labelled with the actual
  previous language name (e.g., "↩ 한국어" not a generic "Back to Original")

### 4.2 Core translation flow (`handleTranslatePage`)

```
0. Capture current document.lang as previousLanguage (before overwriting anything)
1. Walk DOM: collect all visible text nodes (skip script/style/code)
2. Group text nodes into chunks (keep under token limit, ~2000 chars)
3. For each chunk:
   a. Call getCachedTranslation(pathname, language, chunkText)
   b. Cache hit  → use cached translation directly
   c. Cache miss → call brain.translate({ text, target_language })
                 → call saveTranslationToCache(pathname, language, chunkText, result)
4. Replace text node content with translated text in-place
5. Store original text nodes in state (for revert)
6. Set document lang attribute: document.documentElement.setAttribute('lang', language)
7. sessionStorage.setItem('session_translation_lang', language)
```

Step 0 is critical — `previousLanguage` must be captured **before** the DOM is
modified so that revert knows the exact state to return to.

### 4.3 Session persistence across navigation

```ts
// On route change (location.pathname changes):
useEffect(() => {
  // 1. Reset stale DOM refs — old text nodes are from the previous page's DOM
  setIsPageTranslated(false);
  setOriginalTextNodes([]);
  setOriginalMarkedElements([]);
  setCurrentTranslatedLanguage(null);
  document.documentElement.setAttribute('lang', 'en');

  // 2. Determine which language to use
  const sessionLang = sessionStorage.getItem('session_translation_lang');
  const activeLang =
    sessionLang && sessionLang !== 'en'
      ? sessionLang
      : preferredLanguage && preferredLanguage !== 'en'
      ? preferredLanguage
      : null;

  // 3. Trigger auto-translate if a language is active
  if (activeLang) {
    setTargetLanguage(activeLang);
    sessionStorage.setItem('session_translation_lang', activeLang);
    setShouldAutoTranslate(true);  // flag for the second effect
  }
}, [location.pathname, preferredLanguage]);

// Separate effect to fire handleTranslatePage AFTER targetLanguage state updates
useEffect(() => {
  if (!shouldAutoTranslate) return;
  setShouldAutoTranslate(false);
  const timer = setTimeout(() => {
    handleTranslatePage();
  }, 300);  // 300ms delay lets the new page's content render
  return () => clearTimeout(timer);
}, [shouldAutoTranslate, handleTranslatePage]);
```

**Why two effects?** `handleTranslatePage` is a `useCallback` that closes over
`targetLanguage`. If you call it in the same effect where you call `setTargetLanguage`,
it uses the stale value. The two-effect pattern guarantees a re-render cycle between
setting state and calling the callback.

**Why `sessionStorage`?**
- Persists within a tab across navigation (React Router route changes don't clear it)
- Cleared when the tab is closed or a new tab is opened
- Preferred language (`localStorage`) provides the fallback for new tabs/sessions

### 4.4 Revert to previous language

The revert button restores the page to whatever language it was in **before** the
current translation was applied — not hardcoded to English. A Korean user who lends
their laptop to a French person: French translates the page, clicks revert → page
goes back to Korean, not English.

**State needed:**
```ts
const [previousLanguage, setPreviousLanguage] = useState<string>('en');
```

Set it at the very start of `handleTranslatePage`:
```ts
const langBeforeTranslation = document.documentElement.getAttribute('lang') || 'en';
setPreviousLanguage(langBeforeTranslation);
```

The revert function:
```ts
function revertToOriginal() {
  // Restore all original text nodes — these hold the pre-translation content
  // (e.g. Korean text that was in the DOM before French was applied)
  originalTextNodes.forEach(item => { item.node.textContent = item.content; });
  originalMarkedElements.forEach(item => { item.element.textContent = item.content; });

  setIsPageTranslated(false);
  setOriginalTextNodes([]);
  setOriginalMarkedElements([]);
  setCurrentTranslatedLanguage(null);

  // Restore lang attribute to what it was BEFORE this translation
  document.documentElement.setAttribute('lang', previousLanguage);

  // Restore sessionStorage so the next navigation auto-translates to the right language
  if (previousLanguage && previousLanguage !== 'en') {
    sessionStorage.setItem('session_translation_lang', previousLanguage);
  } else {
    sessionStorage.removeItem('session_translation_lang');
  }

  // Toast names the actual language, e.g. "Reverted to 한국어"
  const label = previousLanguage !== 'en'
    ? `Reverted to ${getLanguageName(previousLanguage)}`
    : 'Reverted to original';
  toast.success(label);
}
```

**Revert button UI** — show only when `isPageTranslated` is true, and label it with
the previous language name so the user knows exactly where they're going back to:
```tsx
{isPageTranslated && (
  <Button onClick={revertToOriginal}>
    ↩ {previousLanguage !== 'en' ? getLanguageName(previousLanguage) : 'Original'}
  </Button>
)}

---

## Part 5: User experience summary

| Scenario | Behaviour |
|---|---|
| New user, English browser | App in English, no auto-translate |
| New user, Korean browser | `preferredLanguage = 'ko'`, app auto-translates to Korean on every page |
| User manually picks Spanish | `preferredLanguage = 'es'` saved to localStorage (+ backend if logged in), app auto-translates to Spanish on every visit |
| User navigates to another page | Auto-retranslates using session lang (fast — hits Firestore cache) |
| User closes tab, reopens | Starts fresh, then auto-translates using `preferredLanguage` from localStorage |
| Second user hits same page | Cache hit from Firestore — instant, no Gemini call |
| Korean user, French person translates to French, clicks revert | Returns to Korean (not English), session lang restored to Korean |
| User clicks "Revert" from English base | Returns to original English, stops auto-translating for that session |

---

## Part 6: Replication checklist for a new app

- [ ] Copy `src/utils/translationCache.ts` — update brain method names to match the
      new app's generated brain client
- [ ] Copy `src/utils/languageStore.ts` — change the `persist` key (`name: 'app-language'`)
      to something unique for the app (e.g. `'invoicing-wizard-language'`)
- [ ] Copy `src/components/GlobalTranslation.tsx` — update any app-specific styling
- [ ] Mount `<GlobalTranslation />` in `AppLayout` or `App.tsx` inside `<BrowserRouter>`
- [ ] Copy `app/apis/translation_cache/__init__.py` — no changes needed
- [ ] Copy `app/apis/translate/__init__.py` — no changes needed (uses `gemini-2.5-flash`)
- [ ] Add to `routers.json`:
  ```json
  "translation_cache": { "name": "translation_cache", "version": "...", "disableAuth": true },
  "translate":         { "name": "translate",          "version": "...", "disableAuth": false }
  ```
- [ ] Register the routers in `main.py` (`import_api_routers` list)
- [ ] Regenerate the brain client (`openapi.json` → `brain/`) so the new endpoints appear
- [ ] Add `language_preference` API endpoints if you want per-user language sync across
      devices (see `app/apis/language_preference/__init__.py` in dicta-notes)
- [ ] The `translationCache` Firestore collection is **shared** across all StackApps
      (same Firebase project) — translations cached by one app benefit others for the
      same content automatically

---

## Part 7: Known gotchas

1. **Firestore document ID slashes** — always sanitize URL paths with
   `.strip("/").replace("/", "_") or "root"` before using as document ID.

2. **Return `.translatedContent` not the whole cache object** — returning the
   `CachedTranslation` object instead of its `.translatedContent` string renders
   `[object Object]` in the DOM.

3. **`disableAuth: true` on translation_cache** — without this, anonymous users get
   401 on every cache call and the cache is silently bypassed.

4. **Gemini model** — use `gemini-2.5-flash` or later. `gemini-2.0-flash` is
   deprecated and returns 500.

5. **Brain client POST body** — always pass params as a single object `{ key: value }`,
   never as positional args or URL query params.

6. **Two-effect pattern for auto-translate** — setting `targetLanguage` and calling
   `handleTranslatePage` in the same effect uses a stale closure. Use a `shouldAutoTranslate`
   boolean flag as the bridge between the two effects.

7. **300ms render delay** — new page content needs a render cycle before text nodes
   exist in the DOM. `setTimeout(..., 300)` before calling `handleTranslatePage` on
   route change prevents translating an empty page.

8. **Revert goes to previousLanguage, not English** — capture `document.lang` at the
   START of `handleTranslatePage` as `previousLanguage`. Revert restores DOM nodes AND
   sets `document.lang` and `sessionStorage` back to that value. Never hardcode `'en'`
   as the revert target — a Korean user's "original" is Korean, not English.
