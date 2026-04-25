const CACHE_NAME = "librairie-yo-v1";
const STATIC_CACHE = "librairie-yo-static-v1";
const DYNAMIC_CACHE = "librairie-yo-dynamic-v1";
const IMAGE_CACHE = "librairie-yo-images-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/catalogue",
  "/panier",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const STATIC_ASSETS_fb = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[ServiceWorker] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");
  
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.origin !== location.origin) return;

  if (request.destination === "image") {
    event.respondWith handleImageRequest(request);
    return;
  }

  if (request.url.includes("/api/")) {
    event.respondWith handleApiRequest(request);
    return;
  }

  event.respondWith handleStaticRequest(request));
});

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response("", { status: 408 });
  }
}

async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cachedResponse || new Response("{}", { status: 503 }));

  return cachedResponse || networkPromise;
}

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response("Page not found", { status: 404 });
  }
}

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || "Nouvelle notification de Librairie YO",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: "open", title: "Ouvrir" },
      { action: "close", title: "Fermer" },
    ],
    tag: data.tag || "librairie-yo-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Librairie YO", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

const CACHE_PATTERNS = {
  api: /\/api\//,
  images: /\.(jpg|jpeg|png|gif|webp|svg|ico)/,
  fonts: /\.(woff2?|ttf|otf|eot)/,
  scripts: /\.js$/,
  styles: /\.css$/,
};

function getCacheName(request) {
  const url = request.url;
  
  if (CACHE_PATTERNS.images.test(url)) return IMAGE_CACHE;
  if (CACHE_PATTERNS.api.test(url)) return DYNAMIC_CACHE;
  if (CACHE_PATTERNS.scripts.test(url) || CACHE_PATTERNS.styles.test(url)) return STATIC_CACHE;
  
  return DYNAMIC_CACHE;
}

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[App] ServiceWorker registered:", registration.scope);
          
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[App] New content available, refresh to update");
              }
            });
          });
        })
        .catch((error) => {
          console.error("[App] ServiceWorker registration failed:", error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      registration?.unregister();
    });
  }
}