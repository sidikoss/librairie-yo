// Service Worker — Librairie YO
// Stratégie : Cache-first pour assets statiques (JS/CSS)
//             Network-only pour Firebase REST et APIs externes

const CACHE = 'yo-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', '/index.html']).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Jamais en cache : Firebase REST, APIs, analytics
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('anthropic.com') ||
    url.hostname.includes('telegram.org') ||
    url.hostname.includes('wa.me') ||
    e.request.method !== 'GET'
  ) return;

  // Assets Vite (JS/CSS versionnés) → cache-first puis network en fond
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) {
          // Sert depuis le cache instantanément, met à jour en fond
          fetch(e.request).then(res => {
            if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res));
          }).catch(() => {});
          return cached;
        }
        return fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request.clone(), res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // App shell (/) → network-first avec fallback cache
  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
  }
});
