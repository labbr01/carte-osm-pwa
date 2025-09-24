class PwaConnectionBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.state = 'online'; // 'online', 'offline', 'offline-sim'
    this.hasCache = false;
    this.pwaConfig = {
      extractButtonLabel: 'Extraire les données',
      clearCacheButtonLabel: 'Vider Cache',
      offlineLabel: 'Hors Ligne',
      onlineLabel: 'En Ligne',
      offlineSimLabel: 'Hors Ligne simulé',
      noCacheMessage: 'Aucune donnée hors ligne. Veuillez vous connecter et extraire des données.',
      maxTilesToDownload: 1000
    };
    this.loadConfig().then(() => {
      this.render();
      this.attachEvents();
    });
  }

  async loadConfig() {
    try {
      const resp = await fetch('data/pwa.Config.json');
      if (resp.ok) {
        const cfg = await resp.json();
        this.pwaConfig = { ...this.pwaConfig, ...cfg };
      }
    } catch (e) { /* ignore */ }
  }

  connectedCallback() {
    window.addEventListener('online', () => this.setState('online'));
    window.addEventListener('offline', () => this.setState('offline'));
    this.attachEvents();
    this.updateUI();
  }

  attachEvents() {
    const root = this.shadowRoot;
    if (!root) return;
    const changerEtat = root.getElementById('changerEtat');
    const extraire = root.getElementById('extraire');
    const vider = root.getElementById('vider');
    if (changerEtat) changerEtat.onclick = () => this.toggleSimulated();
    if (extraire) extraire.onclick = () => this.handleExtract();
    if (vider) vider.onclick = () => this.dispatchEvent(new CustomEvent('clearcache'));
  }

  setState(newState) {
    if (newState === 'offline' || (!navigator.onLine && newState !== 'offline-sim')) {
      this.state = 'offline';
    } else if (newState === 'offline-sim') {
      this.state = 'offline-sim';
    } else {
      this.state = 'online';
    }
    this.updateUI();
    this.dispatchEvent(new CustomEvent('statechange', { detail: this.state }));
  }

  toggleSimulated() {
    if (this.state === 'online') {
      this.setState('offline-sim');
    } else if (this.state === 'offline-sim') {
      this.setState('online');
    }
  }

  setCachePresent(present) {
    this.hasCache = present;
    this.updateUI();
  }

  updateUI() {
    const label = this.shadowRoot.getElementById('etatLabel');
    const changerEtat = this.shadowRoot.getElementById('changerEtat');
    const extraire = this.shadowRoot.getElementById('extraire');
    const vider = this.shadowRoot.getElementById('vider');
    // Label
    if (label) {
      if (this.state === 'online') label.textContent = this.pwaConfig.onlineLabel;
      else if (this.state === 'offline') label.textContent = this.pwaConfig.offlineLabel;
      else label.textContent = this.pwaConfig.offlineSimLabel;
    }
    // Boutons
    if (changerEtat) {
      changerEtat.style.display = (this.state === 'online' || this.state === 'offline-sim') ? '' : 'none';
      changerEtat.textContent = (this.state === 'offline-sim') ? 'Revenir en ligne' : 'Basculer mode simulé';
    }
    if (extraire) {
      extraire.style.display = (this.state === 'online') ? '' : 'none';
      extraire.textContent = this.pwaConfig.extractButtonLabel;
    }
    if (vider) {
      vider.style.display = (this.state === 'online') ? '' : 'none';
      vider.textContent = this.pwaConfig.clearCacheButtonLabel;
    }
    // Message si pas de cache et hors ligne
    const msg = this.shadowRoot.getElementById('msgNoCache');
    if (msg) {
      msg.textContent = this.pwaConfig.noCacheMessage;
      if ((this.state === 'offline' || this.state === 'offline-sim') && !this.hasCache) {
        msg.style.display = '';
      } else {
        msg.style.display = 'none';
      }
    }
  }

  async handleExtract() {
    // Vérifie s'il y a déjà un cache (pour l'instant, on simule avec this.hasCache)
    if (this.hasCache) {
      if (!confirm('Un cache existe déjà. Il sera détruit et recréé. Continuer ?')) return;
      // Ici, on viderait le cache existant (à implémenter plus tard)
    }
    // Récupère la carte et le niveau de zoom courant
    const map = window.maplibreglMap;
    if (!map) return alert('Carte non initialisée');
    const zoom = Math.round(map.getZoom());
    const bounds = map.getBounds();
    const tileUrls = [];
    const maxTiles = this.pwaConfig.maxTilesToDownload || 1000;
    // Pour chaque niveau de zoom de zoom+1 à zoom+4 (ou max 19)
    let count = 0;
    for (let z = zoom + 1; z <= Math.min(zoom + 4, 19); z++) {
      // Calcule les tuiles visibles à ce niveau
      const [minX, minY] = this.lngLatToTile(bounds.getWest(), bounds.getSouth(), z);
      const [maxX, maxY] = this.lngLatToTile(bounds.getEast(), bounds.getNorth(), z);
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          // Pour chaque url de tuile OSM
          for (const urlTpl of (window.osmTileTemplates || [])) {
            const url = urlTpl.replace('{z}', z).replace('{x}', x).replace('{y}', y);
            tileUrls.push(url);
            count++;
            if (count >= maxTiles) break;
          }
          if (count >= maxTiles) break;
        }
        if (count >= maxTiles) break;
      }
      if (count >= maxTiles) break;
    }
    alert(`${tileUrls.length} tuiles à télécharger (simulation, à implémenter).`);
    // TODO: ici, lancer le téléchargement et le stockage dans le cache
    this.hasCache = true;
    this.updateUI();
  }

  // Conversion longitude/latitude vers tuiles XYZ
  lngLatToTile(lon, lat, z) {
    const xtile = Math.floor((lon + 180) / 360 * Math.pow(2, z));
    const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    return [xtile, ytile];
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .bar { display: flex; align-items: center; justify-content: center; gap: 1em; background: #f8f8f8; border-top: 1px solid #ccc; padding: 10px 0; position: fixed; bottom: 0; left: 0; width: 100vw; z-index: 20; }
        .label { font-weight: bold; font-family: sans-serif; }
        button { font-size: 1em; padding: 6px 16px; border-radius: 6px; border: 1px solid #888; background: #fff; cursor: pointer; }
        #msgNoCache { color: #b00; font-weight: bold; font-family: sans-serif; margin-left: 2em; }
      </style>
      <div class="bar">
        <span class="label" id="etatLabel">${this.pwaConfig.onlineLabel}</span>
        <button id="changerEtat">Basculer mode simulé</button>
        <button id="extraire">${this.pwaConfig.extractButtonLabel}</button>
        <button id="vider">${this.pwaConfig.clearCacheButtonLabel}</button>
        <span id="msgNoCache" style="display:none;">${this.pwaConfig.noCacheMessage}</span>
      </div>
    `;
  }
}

customElements.define('pwa-connection-bar', PwaConnectionBar);
