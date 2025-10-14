self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('pedidos-ml-v1').then(cache =>
      cache.addAll(['./', './index.html', './manifest.webmanifest'])
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
