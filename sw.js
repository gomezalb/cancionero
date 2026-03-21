// sw.js — Service Worker del Cancionero
// Versión del caché — cambiá este número cada vez que subas cambios a GitHub
const CACHE_VERSION = "cancionero-v7";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./canciones.json",
  "./setlist.json",
  "./manifest.json",
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
    ).then(() => self.skipWaiting()) // activar inmediatamente sin esperar
  );
});

// Activación: eliminar cachés viejos y tomar control de todas las pestañas
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // tomar control inmediato
  );
});

// Fetch: stale-while-revalidate
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
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