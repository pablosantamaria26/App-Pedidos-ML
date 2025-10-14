// === Service Worker PWA - Pedidos ML ===
const CACHE_NAME = 'pedidos-ml-v2';
const URLS_TO_CACHE = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // ⚠️ Si la solicitud es hacia Google Apps Script, no la interceptamos
  if (url.includes('script.google.com')) {
    return; // deja pasar el fetch normal, sin cache
  }

  // ✅ Para todos los demás recursos, usar cache-first
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
