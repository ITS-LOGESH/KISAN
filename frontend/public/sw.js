// Kisan Service Worker — Offline & Shell Caching
const CACHE_NAME = 'kisan-shell-v2';
const API_CACHE_NAME = 'kisan-api-v2';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png'
];

// Install: Pre-cache App Shell & take control immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Pre-caching partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Immediately purge all previous cache versions (v1, obsolete shells)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            console.log('[SW] Deleting obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Fetch with timeout
function fetchWithTimeout(request, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Network request timed out'));
    }, timeoutMs);

    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Never intercept Vite development server modules, HMR or WebSockets
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('/node_modules/') ||
    url.searchParams.has('t') ||
    url.searchParams.has('v') ||
    url.pathname.includes('vite') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return; // Pass through to browser network stack
  }

  // 2. API Requests
  if (url.pathname.startsWith('/api/')) {
    if (event.request.method === 'GET') {
      event.respondWith(
        fetchWithTimeout(event.request, 10000)
          .then((networkRes) => {
            if (networkRes && networkRes.ok && networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(API_CACHE_NAME).then((cache) => {
                cache.put(event.request, resClone);
              }).catch(() => {});
            }
            return networkRes;
          })
          .catch(async (err) => {
            // Network genuinely failed (e.g. offline)
            const cachedRes = await caches.match(event.request);
            if (cachedRes) {
              const headers = new Headers(cachedRes.headers);
              headers.set('X-Kisan-Offline-Cached', 'true');
              return new Response(await cachedRes.blob(), {
                status: cachedRes.status,
                statusText: cachedRes.statusText,
                headers: headers
              });
            }
            // If offline and uncached: honest 503 response
            if (!self.navigator.onLine) {
              return new Response(
                JSON.stringify({
                  status: 'UNAVAILABLE',
                  error: 'offline',
                  detail: 'Data unavailable offline. Connect to the internet to load fresh telemetry.'
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json', 'X-Kisan-Offline-Empty': 'true' }
                }
              );
            }
            // Online but timed out / error: propagate error so application can handle cleanly
            throw err;
          })
      );
      return;
    } else {
      // Non-GET requests (mutations)
      event.respondWith(
        fetch(event.request).catch(() => {
          return new Response(
            JSON.stringify({
              error: 'offline',
              detail: 'This action requires an active internet connection.'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );
      return;
    }
  }

  // 3. Navigation Requests (SPA route handling)
  // Network-First with Cache-Fallback: Always attempt fresh HTML so updates are immediate
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resCopy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, resCopy);
            }).catch(() => {});
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html');
          const cachedRoot = await caches.match('/');
          return cachedIndex || cachedRoot;
        })
    );
    return;
  }

  // 4. Static Production Assets (Bundles in /assets/, icons, fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((res) => {
        if (
          res &&
          res.status === 200 &&
          (event.request.url.startsWith(self.location.origin) ||
           event.request.url.includes('googleapis') ||
           event.request.url.includes('gstatic') ||
           event.request.url.includes('unpkg'))
        ) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
