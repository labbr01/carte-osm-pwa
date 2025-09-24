fetch(window.APP_CONFIG_PATH || 'data/appConfig.json')
  .then(response => response.json())
  .then(async config => {
    document.title = config.title;
    document.getElementById('main-title').textContent = config.title;

    const map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: config.osmTiles,
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [config.centerLng, config.centerLat],
      zoom: config.zoom
    });
    // Pour permettre l'ajout d'icônes esriPMS dans esri2maplibre.js
    window.maplibreglMap = map;

    // Gère plusieurs thèmes ESRI
    const themes = config.themes || [];
    // Pour chaque thème, on garde sourceId, renderer, uniqueField
    const themeStates = themes.map((theme, idx) => ({
      theme,
      sourceId: `esri-vector-${idx}`,
      renderer: null,
      layerIds: []
    }));

    // Charge la symbologie de chaque thème au démarrage
    await Promise.all(themeStates.map(async (state) => {
      try {
        const metaUrl = state.theme.url + '?f=pjson';
        const metaResp = await fetch(metaUrl);
        const metaJson = await metaResp.json();
        state.renderer = metaJson.drawingInfo && metaJson.drawingInfo.renderer;
      } catch (e) {
        alert('Erreur de chargement de la symbologie ESRI pour ' + state.theme.name + ': ' + e);
      }
    }));

    async function updateEsriLayers() {
      const bounds = map.getBounds();
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];
      await Promise.all(themeStates.map(async (state) => {
        // Récupère les entités ESRI visibles pour ce thème
        let esriData;
        try {
          esriData = await fetchEsriFeatures(state.theme.url, bbox, 1000);
        } catch (e) {
          console.error('Erreur ESRI:', e);
          return;
        }
        const geojson = window.esri2maplibre.esriFeatureSetToGeoJSON(esriData);
        if (map.getSource(state.sourceId)) {
          map.getSource(state.sourceId).setData(geojson);
        } else {
          map.addSource(state.sourceId, {
            type: 'geojson',
            data: geojson
          });
          if (state.renderer) {
            const layers = await window.esri2maplibre.buildMapLibreLayersFromRenderer(state.renderer, state.sourceId, state.theme.uniqueField);
            state.layerIds = layers.map(l => l.id);
            layers.forEach(l => map.addLayer(l));
          }
        }
      }));
    }

    map.on('load', () => {
      updateEsriLayers();
    });
    map.on('moveend', updateEsriLayers);
  })
  .catch(err => {
    alert('Erreur de chargement de la configuration: ' + err);
  });
