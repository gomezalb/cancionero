// sw.js — Service Worker del Cancionero
// Versión del caché — cambiá este número cada vez que subas cambios a GitHub
const CACHE_VERSION = "cancionero-v3";

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
    caches.open(CACHE_VERSION).then(cache => {
      // setlist.json es opcional — no fallar si no existe
      return Promise.allSettled(
        ARCHIVOS.map(url =>
          cache.add(url).catch(() => {
            console.warn("sw: no se pudo cachear", url);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activación: eliminar cachés viejos
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: servir desde caché, actualizar en background (stale-while-revalidate)
self.addEventListener("fetch", e => {
  // Solo manejar GET
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request)
        .then(response => {
          // Si la respuesta es válida, actualizarla en caché
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => null); // sin internet — no pasa nada, usamos caché

      // Devolver caché inmediatamente si existe, sino esperar la red
      return cached || fetchPromise;
    })
  );
});
