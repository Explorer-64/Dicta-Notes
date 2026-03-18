// Dicta-Notes PWA Service Worker
const CACHE_NAME = 'com.dictanotes.app.cache-v5';
const OFFLINE_URL = '/offline';
const IS_LOCALHOST = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/offline',
  '/icons/icon-192x192-any.png',
  '/icons/icon-512x512-any.png'
];

// Install event
self.addEventListener('install', (event) => {
  if (IS_LOCALHOST) {
    // In development, skip caching entirely and activate immediately
    console.log('[ServiceWorker] Development mode — skipping cache, activating immediately');
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[ServiceWorker] Pre-caching offline assets');
        await cache.addAll(OFFLINE_ASSETS);
        console.log('[ServiceWorker] Asset caching complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      // In dev, delete ALL caches to prevent stale content
      return Promise.all(keyList.map((key) => {
        if (IS_LOCALHOST || key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - handle network requests with cache fallback
self.addEventListener('fetch', (event) => {
  // In development, NEVER intercept — let all requests go straight to Vite
  if (IS_LOCALHOST) {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Let API requests pass through without service worker interference
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('/_projects/') ||
      event.request.url.includes('/routes/')) {
    return;
  }

  // Set a timeout for fetch requests to prevent hanging
  const fetchWithTimeout = (request, timeoutMs = 10000) => {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const signal = controller.signal;

      const timeout = setTimeout(() => {
        controller.abort();
        console.log('[Service Worker] Fetch timeout, aborting:', request.url);
      }, timeoutMs);

      fetch(request, { signal })
        .then(response => {
          clearTimeout(timeout);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  };

  // For navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(event.request)
        .catch(async (error) => {
          console.log('[Service Worker] Network fetch failed for navigation, trying cache:', event.request.url, error);
          const cached = await caches.match(OFFLINE_URL);
          return cached || new Response('<h1>Offline</h1><p>Please check your connection.</p>', { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/html' } });
        })
    );
    return;
  }

  // For other requests, network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned)).catch(() => {});
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
