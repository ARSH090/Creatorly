const CACHE_NAME = 'creatorly-v2';
const OFFLINE_URL = '/offline';
const URLS_TO_PRECACHE = ['/', '/dashboard', '/auth/login', OFFLINE_URL];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_PRECACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() =>
                caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
            )
        );
        return;
    }
    if (event.request.url.includes('/api/')) return;
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const { title = 'Creatorly', body = '', icon = '/favicon.png', url = '/dashboard' } = data;

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon,
            badge: '/favicon.png',
            data: { url },
            vibrate: [200, 100, 200],
            tag: 'creatorly-notification',
            renotify: true,
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            const url = event.notification.data?.url || '/dashboard';
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
