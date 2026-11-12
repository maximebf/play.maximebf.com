// Offline support for the catalog.
// - Network-first for everything: online you always get the latest deploy,
//   offline you get the last copy saved in the cache.
// - On install, posters are discovered from index.html, so adding a game needs no change here.

const CACHE = 'play-v2';
const CORE = [
  './',
  'styles.css',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const res = await fetch('./', { cache: 'no-cache' });
    const html = await res.clone().text();
    const posters = [...html.matchAll(/src="(games\/[^"]+)"/g)].map((m) => m[1]);
    await cache.put('./', res);
    await cache.addAll([...CORE.slice(1), ...posters]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // All navigations share one cache entry: the catalog page.
  const key = req.mode === 'navigate' ? './' : req;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) await cache.put(key, res.clone());
      return res;
    } catch {
      return (await cache.match(key, { ignoreSearch: true })) || Response.error();
    }
  })());
});
