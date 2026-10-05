// sw.js — Service Worker del Cancionero
// Versión del caché — cambiá este número cada vez que subas cambios a GitHub

const CACHE_VERSION = "cancionero-v1025";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./canciones.json",
  "./setlist.json",
  "./manifest.json",
  "./logo-32.png",
  "./logo-192.png",
  "./logo-512.png",
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

  // Solo interceptar http y https — ignorar chrome-extension:// y otros
  if (!e.request.url.startsWith("http")) return;

  const url = new URL(e.request.url);

  // Nunca interceptar sw.js ni requests a APIs externas (GitHub, etc.)
  if (url.pathname.endsWith("sw.js")) return;
  if (!url.hostname.includes("localhost") && !url.hostname.includes("github.io") && !url.hostname.includes("127.0.0.1")) return;

  // network-first: index.html, manifest.json, canciones.json, setlist.json
  // Así siempre se muestra la versión más reciente cuando hay red
  const networkFirst = ["/", "index.html", "manifest.json", "canciones.json", "setlist.json"];
  const esNetworkFirst = networkFirst.some(p => url.pathname.endsWith(p));

  if (esNetworkFirst) {
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

  // Resto (imágenes, etc.): stale-while-revalidate
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
