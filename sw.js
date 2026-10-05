/* Service worker de HRS17 (v2).
   La app entera cabe en el cache: una vez instalada funciona en modo avion.
   Sube el numero de VERSION cada vez que cambies index.html, o el movil
   seguira sirviendo la copia antigua. */

/* Prefijo propio: la v1 vive en el mismo dominio de GitHub y esta app
   no debe tocar nunca su cache. */
const PREFIX = "hrs17-app-";
const VERSION = PREFIX + "5";   /* súbelo en cada entrega: 2, 3, 4… */

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => k.startsWith(PREFIX) && k !== VERSION)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  /* Primero el cache: abrir la app no debe depender de la cobertura del gimnasio. */
  event.respondWith(
    caches.open(VERSION).then(cache => cache.match(req)).then(hit => {
      if (hit) return hit;
      return fetch(req)
        .then(res => {
          if (res && res.status === 200 && res.type === "basic"){
            const copy = res.clone();
            caches.open(VERSION).then(cache => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          /* Sin red: cualquier navegacion cae en la propia app. */
          if (req.mode === "navigate") return caches.match("./index.html");
          return new Response("", { status: 503, statusText: "Sin conexión" });
        });
    })
  );
});
