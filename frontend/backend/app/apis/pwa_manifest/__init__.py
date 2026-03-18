from fastapi import APIRouter, Response
import json

router = APIRouter(prefix="/pwa")

@router.get("/manifest.json")
def get_manifest():
    """Serve a dynamically generated web app manifest for PWA installation"""
    manifest = {
        "name": "Dicta-Notes",
        "short_name": "Dicta-Notes",
        "id": "com.dictanotes.app",
        "description": "AI-powered meeting transcription and note-taking app",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#4f46e5",
        "icons": [
            {
                "src": "/icons/icon-192x192-any.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "/icons/icon-192x192-maskable.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "maskable"
            },
            {
                "src": "/icons/icon-512x512-any.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "/icons/icon-512x512-maskable.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "maskable"
            }
        ]
    }
    
    return Response(
        content=json.dumps(manifest),
        media_type="application/json"
    )

@router.get("/service-worker.js")
def get_pwa_service_worker():
    """Serve a dynamically generated service worker for offline capabilities"""
    # Basic service worker with cache strategy
    service_worker = """
    // Dicta-Notes PWA Service Worker
    const CACHE_NAME = 'com.dictanotes.app.cache-v1';
    const OFFLINE_URL = '/offline';
    const OFFLINE_ASSETS = [
      '/',
      '/index.html',
      '/offline',
      '/icons/icon-192x192-any.png',
      '/icons/icon-512x512-any.png'
    ];
    
    // Additional assets to cache - JS bundles contain our utility functions
    const JS_ASSETS = [
      '/assets/index-*.js',  // Main JS bundle
      '/assets/app-*.js',   // App JS bundle
      '/assets/vendor-*.js' // Vendor JS bundle
    ];

    // Install event - cache basic offline assets
    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(async (cache) => {
            console.log('[ServiceWorker] Pre-caching offline assets');
            await cache.addAll(OFFLINE_ASSETS);
            
            // Get a list of all asset files from the root directory matching our patterns
            const cachePromises = [];
            
            // Find and cache JS assets using glob-like pattern matching
            // First, fetch the root to get asset references
            console.log('[ServiceWorker] Caching JavaScript bundles');
            try {
              const response = await fetch('/');
              if (response.ok) {
                const text = await response.text();
                
                // Extract all script URLs from HTML
                const scriptRegex = /<script.*?src="([^"]+)".*?>/g;
                let match;
                const scriptUrls = [];
                
                while ((match = scriptRegex.exec(text)) !== null) {
                  if (match[1] && !match[1].includes('http')) {
                    scriptUrls.push(match[1]);
                    console.log('[ServiceWorker] Found script:', match[1]);
                  }
                }
                
                // Cache all found scripts
                for (const url of scriptUrls) {
                  try {
                    const res = await fetch(url);
                    if (res.ok) {
                      await cache.put(url, res);
                      console.log('[ServiceWorker] Cached script:', url);
                    }
                  } catch (err) {
                    console.warn('[ServiceWorker] Failed to cache script:', url, err);
                  }
                }
              }
            } catch (err) {
              console.warn('[ServiceWorker] Error caching JavaScript assets:', err);
            }
            
            console.log('[ServiceWorker] Asset caching complete');
            return self.skipWaiting();
          })
      );
    });

    // Activate event - clean up old caches
    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((keyList) => {
          return Promise.all(keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache', key);
              return caches.delete(key);
            }
          }));
        })
      );
      // Immediately claim clients so updates take effect right away
      return self.clients.claim();
    });

    // Fetch event - handle network requests with cache fallback
    self.addEventListener('fetch', (event) => {
      // Skip cross-origin requests
      if (!event.request.url.startsWith(self.location.origin)) {
        return;
      }

      // Handle API requests differently - let them pass through WITHOUT service worker interference
      // This is critical to prevent timeouts on API calls
      if (event.request.url.includes('/api/') || 
          event.request.url.includes('/_projects/') ||
          event.request.url.includes('/routes/')) {
        // Let the request go directly to the network without any SW handling
        event.respondWith(fetch(event.request));
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
            .catch((error) => {
              console.log('[Service Worker] Network fetch failed for navigation, trying cache:', event.request.url, error);
              // If offline, serve the offline page
              return caches.match(OFFLINE_URL);
            })
        );
        return;
      }

      // For other requests, use stale-while-revalidate strategy
      event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            // Always try network first for fresh content
            const networkFetch = fetchWithTimeout(event.request)
              .then(networkResponse => {
                // Only clone and cache if we have a valid response
                if (networkResponse && networkResponse.status === 200) {
                  try {
                    // Create a clone before using the response
                    const clonedResponse = networkResponse.clone();
                    
                    // Cache asynchronously without blocking the response
                    caches.open(CACHE_NAME)
                      .then(cache => {
                        try {
                          cache.put(event.request, clonedResponse);
                        } catch (error) {
                          console.error('[Service Worker] Cache put error:', error.message);
                        }
                      })
                      .catch(error => {
                        console.error('[Service Worker] Cache open error:', error.message);
                      });
                  } catch (error) {
                    console.error('[Service Worker] Response clone error:', error.message);
                  }
                }
                return networkResponse;
              })
              .catch(error => {
                console.log('[Service Worker] Network fetch failed for default request, trying cache:', event.request.url, error);
                // Return cached response as fallback
                return cachedResponse || caches.match(OFFLINE_URL);
              });
              
            // Return cached response immediately if available, otherwise wait for network
            return cachedResponse || networkFetch;
          })
      );
    });

    // Handle messages from the client
    self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
      }
    });
    """
    
    return Response(
        content=service_worker,
        media_type="application/javascript"
    )

@router.get("/offline")
def get_offline_page():
    """Serve an offline page for when the user is offline"""
    offline_html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dicta-Notes - Offline</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                background-color: #f9fafb;
            }
            .header {
                padding: 1rem;
                border-bottom: 1px solid #e5e7eb;
                background-color: white;
                display: flex;
                align-items: center;
            }
            .logo {
                font-weight: bold;
                font-size: 1.25rem;
            }
            .container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            .offline-card {
                background-color: white;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                padding: 2rem;
                text-align: center;
                max-width: 28rem;
                width: 100%;
            }
            .icon {
                width: 3rem;
                height: 3rem;
                margin-bottom: 1.5rem;
                background-color: #eef2ff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: auto;
                margin-right: auto;
            }
            h1 {
                margin-top: 0;
                margin-bottom: 0.5rem;
                font-size: 1.5rem;
            }
            p {
                margin-top: 0;
                margin-bottom: 1.5rem;
                color: #6b7280;
            }
            .button {
                display: inline-block;
                background-color: #4f46e5;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-weight: 500;
                cursor: pointer;
                text-decoration: none;
            }
            .button:hover {
                background-color: #4338ca;
            }
        </style>
    </head>
    <body>
        <header class="header">
            <div class="logo">Dicta-Notes</div>
        </header>
        <main class="container">
            <div class="offline-card">
                <div class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                        <line x1="12" y1="20" x2="12.01" y2="20"></line>
                    </svg>
                </div>
                <h1>You're offline</h1>
                <p>It seems you've lost your internet connection. DictaNotes requires an internet connection for most features.</p>
                <a href="/" class="button">Try again</a>
            </div>
        </main>
    </body>
    </html>
    """
    
    return Response(
        content=offline_html,
        media_type="text/html"
    )
