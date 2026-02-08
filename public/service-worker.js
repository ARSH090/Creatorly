// Service Worker for Creatorly PWA
// Handles caching, offline support, and background sync

const CACHE_NAME = 'creatorly-v1';
const RUNTIME_CACHE = 'creatorly-runtime-v1';
const API_CACHE = 'creatorly-api-v1';

const URLS_TO_CACHE = [
  '/',
  '/dashboard',
  '/auth/login',
  '/auth/register',
  '/offline',
];

const API_ROUTES = [
  '/api/products',
  '/api/user',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching essential files');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome extensions
  if (
    request.method !== 'GET' ||
    url.hostname === 'chrome-extension'
  ) {
    return;
  }

  // API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first with network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML/Pages - Network first with cache fallback
  event.respondWith(networkFirstStrategy(request));
});

// Network first strategy
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(
        request.url.includes('/api/') ? API_CACHE : RUNTIME_CACHE
      );
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Network request failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }

    // Return error response
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Cache first strategy
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Cache-first request failed:', request.url);
    return new Response('Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return /\.(png|jpg|jpeg|gif|svg|css|js|woff|woff2)$/i.test(pathname);
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-failed-payments') {
    event.waitUntil(syncFailedPayments());
  }
});

async function syncFailedPayments() {
  try {
    const db = await openFailedPaymentsDB();
    const failedPayments = await db
      .transaction('failed_payments', 'readonly')
      .objectStore('failed_payments')
      .getAll();

    for (const payment of failedPayments) {
      try {
        await fetch('/api/payments/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment),
        });
        // Remove from IndexedDB on success
        deleteFailedPayment(payment.id);
      } catch (error) {
        console.log('Sync payment still failing:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    badge: '/icons/badge-72x72.png',
    icon: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'creatorly-notification',
    requireInteraction: false,
  };

  if (event.data) {
    const data = event.data.json();
    options.title = data.title || 'Creatorly';
    options.body = data.body || 'You have a new notification';
  }

  event.waitUntil(
    self.registration.showNotification('Creatorly', options)
  );
});

// Message handling for clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
