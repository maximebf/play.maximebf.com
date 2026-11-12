// Offline support for the catalog.
// - The page itself is network-first, so a new deploy shows up on the next online visit.
// - Everything else (CSS, posters, icons) is served from cache and refreshed in the background.
// - On install, posters are discovered from index.html, so adding a game needs no change here.

const CACHE = 'play-v1';
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

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put('./', res.clone());
        return res;
      } catch {
        return (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req)
      .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => undefined);
    if (cached) { event.waitUntil(fresh); return cached; }
    return (await fresh) || Response.error();
  })());
});
