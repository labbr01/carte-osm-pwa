
const CACHE_NAME = 'osm-pwa-cache-v1';

// Génère dynamiquement la liste des assets à partir du basePath de la config
async function getAssets() {
  let basePath = '/';
  try {
    const resp = await fetch('data/pwa.Config.json');
    if (resp.ok) {
      const cfg = await resp.json();
      if (self.location.hostname !== 'localhost' && self.location.hostname !== '127.0.0.1' && cfg.basePath && cfg.basePath !== '') {
        basePath = cfg.basePath;
      }
    }
  } catch (e) { /* ignore */ }
  if (!basePath.endsWith('/')) basePath += '/';
  // Liste des assets à mettre en cache
  return [
    basePath,
    basePath + 'index.html',
    basePath + 'manifest.json',
    basePath + 'css/style.css',
    basePath + 'js/app.js',
    basePath + 'js/esri2maplibre.js',
    basePath + 'js/esri_query.js',
    // Ajoute ici d'autres fichiers statiques si besoin
  ];
}

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const assets = await getAssets();
      const cache = await caches.open(CACHE_NAME);
      return cache.addAll(assets);
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});
