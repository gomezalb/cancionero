// sw.js — Service Worker del Cancionero
// Versión del caché — cambiá este número cada vez que subas cambios a GitHub
const CACHE_VERSION = "cancionero-v20";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./canciones.json",
  "./setlist.json",
  "./manifest.json",
  "./favicon-32.png",
  "./icon-192.png",
  "./icon-512.png",
];

// Instalación: cachear todos los archivos
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      Promise.allSettled(
        ARCHIVOS.map(url => cache.add(url).catch(() => {}))
      )
    ).then(() => self.skipWaiting())
  );
});

// Activación: eliminar cachés viejos y tomar control
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Nunca interceptar sw.js — el navegador debe poder compararlo siempre con la red
  if (url.pathname.endsWith("sw.js")) return;

  // index.html: network-first para detectar cambios rápido
  if (url.pathname.endsWith("/") || url.pathname.endsWith("index.html")) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request)) // sin internet → caché
    );
    return;
  }

  // Resto: stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => null);
      return cached || fetchPromise;
    })
  );
});

// Mensaje desde la página para forzar actualización
self.addEventListener("message", e => {
  if (e.data === "skipWaiting") self.skipWaiting();
});