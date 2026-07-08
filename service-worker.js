// === Service Worker v60 — Pedidos ML (App-Pedidos-ML) ===
// HTML: NETWORK-FIRST con timeout → la app se actualiza sola al abrirla
// con internet, y cae al caché si no hay señal (sigue andando offline).
// Estáticos (íconos/manifest): CACHE-FIRST (casi no cambian).

const CACHE_NAME = "pedidos-ml-v60";
const HTML_TIMEOUT_MS = 2500;   // si la red tarda más que esto, servimos el caché
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
    caches.keys()
      .then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then(clients => clients.forEach(c => c.postMessage({ type: "SW_UPDATED", version: CACHE_NAME })))
  );
  console.log("✅ Service Worker activado y limpio —", CACHE_NAME);
});

// 🟢 FETCH — solo GET del mismo origen (Supabase/Worker/GAS pasan directo a la red)
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.href.includes("https://script.google.com/macros/")) return;

  const esHTML = req.mode === "navigate" ||
                 (req.headers.get("accept") || "").includes("text/html");

  // ── HTML / navegación: NETWORK-FIRST con timeout ──
  // Trae siempre lo último si hay señal (la app se actualiza sola).
  // Si la red falla o tarda demasiado, sirve el caché guardado.
  if (esHTML) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await Promise.race([
          fetch(req),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), HTML_TIMEOUT_MS))
        ]);
        // Guardamos la última versión para el próximo arranque offline
        cache.put("./index.html", fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await cache.match("./index.html") ||
                       await cache.match("./") ||
                       await caches.match(req);
        return cached || new Response("Sin conexión", {
          status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
    return;
  }

  // ── Estáticos (íconos, manifest, etc.): CACHE-FIRST + guardar en caché ──
  e.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return resp;
        })
        .catch(() => cached)
    )
  );
});
