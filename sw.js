// Offline (RNF-02): cache-first de todos los archivos de la app. Subir VERSION al publicar cambios.
const VERSION = 'edfisica-v6';
const ARCHIVOS = ['./', 'index.html', 'db.js', 'calculo.js', 'importar.js', 'exportar.js', 'manifest.json',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'];

// cache:'reload' salta la caché HTTP del navegador: al instalar siempre baja la versión nueva.
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request))));
