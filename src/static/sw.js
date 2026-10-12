// Service worker de AlNeto: permite usar sin conexión las páginas ya visitadas.
// Siempre va primero a la red (para no mostrar nunca cifras desactualizadas) y solo
// recurre a la copia guardada cuando no hay conexión.
const CACHE = 'alneto-v1';
const SIN_CONEXION = '/sin-conexion/';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SIN_CONEXION)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  // Solo peticiones propias: los anuncios y servicios externos van por su cuenta.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    try {
      const respuesta = await fetch(request);
      if (respuesta.ok) {
        const copia = respuesta.clone();
        caches.open(CACHE).then((c) => c.put(request, copia));
      }
      return respuesta;
    } catch {
      const navegando = request.mode === 'navigate';
      const guardada = await caches.match(request, { ignoreSearch: navegando });
      if (guardada) return guardada;
      if (navegando) return (await caches.match(SIN_CONEXION)) || Response.error();
      return Response.error();
    }
  })());
});
