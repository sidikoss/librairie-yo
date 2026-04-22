// Service Worker — Librairie YO v2
// Stratégie :
//   • Assets Vite (JS/CSS versionnés) → Cache-first, mise à jour en fond
//   • App shell (/, /index.html)      → Network-first, fallback cache
//   • Firebase REST, APIs externes    → Network-only (jamais en cache)

const CACHE = 'yo-v2';

// Ressources à pré-cacher à l'installation
const PRECACHE = ['/', '/index.html'];

// ── Installation ─────────────────────────────────────────────
self.addEventListener('install', e => {
  // skipWaiting : le nouveau SW prend la main immédiatement
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
});

// ── Activation : purge des anciens caches ────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Helper : requêtes à ne jamais mettre en cache ────────────
function isUncacheable(url) {
  return (
    url.pathname.startsWith('/api/reader/')   ||
    url.hostname.includes('firebaseio.com')   ||
    url.hostname.includes('googleapis.com')   ||
    url.hostname.includes('anthropic.com')    ||
    url.hostname.includes('telegram.org')     ||
    url.hostname.includes('wa.me')            ||
    url.hostname.includes('cdnjs.cloudflare') // PDF.js worker chargé à la demande
  );
}

// ── Interception des requêtes ─────────────────────────────────
self.addEventListener('fetch', e => {
  // Non-GET et APIs externes → réseau direct
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (isUncacheable(url)) return;

  // Assets Vite (contiennent un hash dans le nom) → Cache-First
  // Ces fichiers ont Cache-Control: immutable côté Vercel
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) {
          // Sert l'asset instantanément depuis le cache
          // Met à jour en arrière-plan pour la prochaine visite
          fetch(e.request)
            .then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res)); })
            .catch(() => {});
          return cached;
        }
        // Pas en cache : télécharge et stocke
        return fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request.clone(), res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // App shell (/) → Network-First avec fallback cache (offline)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match('/').then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Autres ressources statiques (favicon, etc.) → Stale-While-Revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
