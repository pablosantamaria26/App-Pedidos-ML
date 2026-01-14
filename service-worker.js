// === Service Worker v10 — Pedidos ML (final PWA GitHub) ===

const CACHE_NAME = "pedidos-ml-v16";
const OFFLINE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

// 🟢 INSTALACIÓN
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
  console.log("✅ Service Worker instalado correctamente");
});

// 🟢 ACTIVACIÓN
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  console.log("✅ Service Worker activado y limpio");
  self.clients.claim();
});

// 🟢 FETCH — solo GET local (no intercepta Google Script)
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.href.includes("https://script.google.com/macros/")) return;

  e.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return resp;
        })
        .catch(() => caches.match("./index.html"))
    )
  );
});
