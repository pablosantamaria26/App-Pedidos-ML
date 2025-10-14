// === 🛒 Service Worker - Pedidos ML ===
// versión 2.0 (14/10/2025)

const CACHE_NAME = "pedidos-ml-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.ico",
];

// 📦 Instalar y cachear los archivos esenciales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
  console.log("✅ Service Worker instalado");
});

// ♻️ Activar y limpiar versiones antiguas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  console.log("♻️ Service Worker activo y limpio");
  self.clients.claim();
});

// 🌐 Interceptar peticiones
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Si es una solicitud al backend de Google Script → no la cacheamos
  if (request.url.includes("script.google.com/macros")) {
    event.respondWith(fetch(request).catch(() => new Response("Offline", { status: 503 })));
    return;
  }

  // Si es otro archivo → servir desde caché o red
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(networkResponse => {
        // Cacheamos dinámicamente recursos nuevos (CSS, íconos, etc.)
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return networkResponse;
      });
    }).catch(() => {
      // Si no hay nada en caché → mostramos una página fallback básica
      return new Response(`
        <!DOCTYPE html>
        <html lang="es"><head><meta charset="utf-8">
        <title>Sin conexión</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px;">
          <h2>📡 Sin conexión</h2>
          <p>La aplicación no tiene acceso a internet.</p>
          <p>Los pedidos se guardarán localmente hasta que vuelvas a estar online.</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html" } });
    })
  );
});
