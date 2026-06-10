// Minimal SW: installable, but never serves stale content.
// On activate it purges any caches a prior version created, then claims clients,
// so a new deploy can't be served an old shell. Fetch is pass-through (no cache).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil((async () => {
    try { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); } catch {}
    await self.clients.claim();
  })())
);
self.addEventListener("fetch", () => {});
