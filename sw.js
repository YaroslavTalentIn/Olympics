// sw.js — Talentin Olympics Final (GitHub Pages PWA)
const CACHE = 'talentin-olympics-final-v9';
const BASE = self.registration.scope;

const CORE = [
  '', 'index.html', 'manifest.json', 'sw.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'
].map(p => new URL(p, BASE).toString());

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Navigations: network-first, fallback to cached index
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
        const fresh = await fetch(new Request(req, { cache: 'reload' }));
        const cache = await caches.open(CACHE);
        cache.put(new URL('index.html', BASE).toString(), fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(new URL('index.html', BASE).toString())) || Response.error();
      }
    })());
    return;
  }

  // Same-origin: cache-first
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, resp.clone());
        return resp;
      } catch {
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Cross-origin: passthrough
  event.respondWith(fetch(req));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
```
