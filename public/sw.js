// Kill switch. The app no longer uses a service worker — on a rapidly-redeployed
// PWA it caused stale-bundle "client-side exception" white screens. This SW
// unregisters itself and clears all caches so every client fetches fresh.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil((async () => {
    try { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } catch {}
    try { await self.registration.unregister(); } catch {}
    try { const cs = await self.clients.matchAll(); cs.forEach((c) => c.navigate(c.url)); } catch {}
  })())
);
self.addEventListener("fetch", () => {});
