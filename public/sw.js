// Service worker kill-switch:
// - remove stale cached app shells
// - unregister old worker to avoid serving outdated checkout bundles

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      await self.clients.claim();

      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clients) {
        client.postMessage({ type: "SW_CACHE_CLEARED" });
        if ("navigate" in client) {
          client.navigate(client.url);
        }
      }

      await self.registration.unregister();
    })(),
  );
});

self.addEventListener("fetch", () => {
  // no-op: we no longer intercept requests
});
