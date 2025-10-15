// === Service Worker v3 (Optimizado para Pedidos ML) ===

const CACHE_NAME = "pedidos-ml-v6";
const OFFLINE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./service-worker.js"
];

// ✅ INSTALACIÓN
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
  console.log("✅ Service Worker instalado");
});

// ✅ ACTIVACIÓN
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  console.log("✅ Service Worker activado");
  self.clients.claim();
});

// ✅ FETCH con bypass a Google Script
self.addEventListener("fetch", e => {
  const req = e.request;
  const url = req.url;

  // 🚫 NO interceptar las peticiones al backend de Apps Script
  if (url.includes("https://script.google.com/macros/")) return;

  e.respondWith(
    caches.match(req)
      .then(res => res || fetch(req).then(fresh => {
        // Cache dinámico
        const clone = fresh.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return fresh;
      }))
      .catch(() => caches.match("./index.html"))
  );
});
