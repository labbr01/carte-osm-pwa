// Initialisation PWA dynamique (manifest, service worker) avec basePath configurable
fetch('data/pwa.Config.json')
  .then(resp => resp.json())
  .then(cfg => {
    // Si on est sur localhost (avec ou sans port), on force basePath à '/'
    let base;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      base = '/';
    } else {
      base = cfg.basePath && cfg.basePath !== '' ? cfg.basePath : (location.pathname.startsWith('/carte-osm-pwa') ? '/carte-osm-pwa/' : '/');
    }
    // Adapter dynamiquement le manifest
    const manifestLink = document.getElementById('manifest-link');
    if (manifestLink) manifestLink.setAttribute('href', base + 'manifest.json');
    // Adapter dynamiquement les balises d'icônes (favicon, apple-touch-icon)
    const iconLinks = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
    iconLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith(base)) {
        link.setAttribute('href', base + href.replace(/^\//, ''));
      }
    });
    // Enregistrement dynamique du service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        const swPath = base + 'js/pwa/service-worker.js';
        // Pour GitHub Pages, scope = base + 'js/pwa/'
        if (cfg.basePath && cfg.basePath !== '/') {
          const swScope = base + 'js/pwa/';
          navigator.serviceWorker.register(swPath, { scope: swScope })
            .then(function(reg) { console.log('Service worker registered', reg); })
            .catch(function(err) { console.warn('Service worker registration failed', err); });
        } else {
          navigator.serviceWorker.register(swPath)
            .then(function(reg) { console.log('Service worker registered', reg); })
            .catch(function(err) { console.warn('Service worker registration failed', err); });
        }
      });
    }
  });