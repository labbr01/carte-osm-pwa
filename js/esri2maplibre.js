// Conversion ESRI JSON vers GeoJSON et génération de style MapLibre

// Convertit une géométrie ESRI JSON en GeoJSON
function esriGeometryToGeoJSON(esriGeom) {
  if (!esriGeom) return null;
  if (esriGeom.x !== undefined && esriGeom.y !== undefined) {
    // Point
    return {
      type: 'Point',
      coordinates: [esriGeom.x, esriGeom.y]
    };
  } else if (esriGeom.points) {
    // MultiPoint
    return {
      type: 'MultiPoint',
      coordinates: esriGeom.points
    };
  } else if (esriGeom.paths) {
    // LineString ou MultiLineString
    return {
      type: esriGeom.paths.length === 1 ? 'LineString' : 'MultiLineString',
      coordinates: esriGeom.paths.length === 1 ? esriGeom.paths[0] : esriGeom.paths
    };
  } else if (esriGeom.rings) {
    // Polygon ou MultiPolygon
    return {
      type: esriGeom.rings.length === 1 ? 'Polygon' : 'MultiPolygon',
      coordinates: esriGeom.rings.length === 1 ? [esriGeom.rings[0]] : esriGeom.rings.map(r => [r])
    };
  }
  return null;
}

// Convertit une FeatureSet ESRI en FeatureCollection GeoJSON
function esriFeatureSetToGeoJSON(featureSet) {
  return {
    type: 'FeatureCollection',
    features: (featureSet.features || []).map(f => ({
      type: 'Feature',
      geometry: esriGeometryToGeoJSON(f.geometry),
      properties: f.attributes
    }))
  };
}

// Génère le style MapLibre à partir du renderer ESRI uniqueValueGroups
function generateMapLibreStyleFromRenderer(renderer) {
  if (!renderer || !renderer.uniqueValueGroups) return [];
  // On gère le cas où chaque group contient un array 'classes' (cas ESRI uniqueValueRenderer)
  let styles = [];
  renderer.uniqueValueGroups.forEach(group => {
    if (Array.isArray(group.classes)) {
      group.classes.forEach(cls => {
        // Pour uniqueValueRenderer, la valeur est dans cls.values[0][0]
        let value = cls.value;
        if (Array.isArray(cls.values) && Array.isArray(cls.values[0])) {
          value = cls.values[0][0];
        }
        const symbol = cls.symbol;
        let paint = {};
        if (symbol.type === 'esriSFS') {
          paint = {
            'fill-color': symbol.color ? `rgba(${symbol.color.join(',')})` : '#000000',
            'fill-opacity': symbol.outline ? (symbol.outline.width ? 0.5 : 1) : 1
          };
          styles.push({ value, paint, symbolType: symbol.type });
        } else if (symbol.type === 'esriSLS') {
          paint = {
            'line-color': symbol.color ? `rgba(${symbol.color.join(',')})` : '#000000',
            'line-width': symbol.width || 1
          };
          styles.push({ value, paint, symbolType: symbol.type });
        } else if (symbol.type === 'esriSMS') {
          paint = {
            'circle-color': symbol.color ? `rgba(${symbol.color.join(',')})` : '#000000',
            'circle-radius': symbol.size || 6
          };
          styles.push({ value, paint, symbolType: symbol.type });
        } else if (symbol.type === 'esriPMS' && symbol.imageData) {
          // Picture Marker Symbol: on prépare une icône image pour MapLibre
          const layout = {
            'icon-image': `esri-pms-${value}`,
            'icon-size': 1.5 // taille augmentée pour debug
          };
          styles.push({
            value,
            paint: {},
            layout,
            symbolType: 'esriPMS',
            imageData: symbol.imageData,
            contentType: symbol.contentType || 'image/png',
            width: symbol.width || 12,
            height: symbol.height || 12
          });
        }
      });
    } else {
      // fallback: ancien comportement (si pas de classes)
      const value = group.value;
      const symbol = group.symbol;
      let paint = {};
      if (symbol && symbol.type === 'esriSFS') {
        paint = {
          'fill-color': symbol.color ? `rgba(${symbol.color.join(',')})` : '#000000',
          'fill-opacity': symbol.outline ? (symbol.outline.width ? 0.5 : 1) : 1
        };
      } else if (symbol && symbol.type === 'esriSLS') {
        paint = {
          'line-color': symbol.color ? `rgba(${symbol.color.join(',')})` : '#000000',
          'line-width': symbol.width || 1
        };
      } else if (symbol && symbol.type === 'esriSMS') {
        paint = {
          'circle-color': symbol.color ? `rgba(${symbol.color.join(',')})` : '#000000',
          'circle-radius': symbol.size || 6
        };
      }
      styles.push({
        value,
        paint,
        symbolType: symbol ? symbol.type : undefined
      });
    }
  });
  return styles;
}

// Applique la symbologie MapLibre à une couche vectorielle
async function buildMapLibreLayersFromRenderer(renderer, sourceId, field) {
  const styleGroups = generateMapLibreStyleFromRenderer(renderer);
  const addedImages = new Set();
  const imagePromises = [];
  const layers = styleGroups.map((group, i) => {
    let value = group.value;
    if (Array.isArray(value) && Array.isArray(value[0])) {
      value = value[0][0];
    }
    let layer = {
      id: `${sourceId}-cat-${value}`,
      type:
        group.symbolType === 'esriSFS' ? 'fill' :
        group.symbolType === 'esriSLS' ? 'line' :
        group.symbolType === 'esriSMS' ? 'circle' :
        group.symbolType === 'esriPMS' ? 'symbol' : 'circle',
      source: sourceId,
      filter: ['==', ['get', field], value]
    };
    if (group.symbolType === 'esriPMS' && group.layout) {
      layer.layout = group.layout;
    } else {
      layer.paint = group.paint;
    }
    // Ajout dynamique de l'image pour esriPMS (attend le chargement avant de retourner les layers)
    if (group.symbolType === 'esriPMS' && group.imageData && window.maplibreglMap) {
      const imageId = `esri-pms-${value}`;
      if (!window.maplibreglMap.hasImage(imageId) && !addedImages.has(imageId)) {
        addedImages.add(imageId);
        imagePromises.push(new Promise(resolve => {
          const img = new Image(group.width, group.height);
          img.onload = () => {
            if (!window.maplibreglMap.hasImage(imageId)) {
              window.maplibreglMap.addImage(imageId, img, { pixelRatio: 1 });
            }
            resolve();
          };
          img.src = `data:${group.contentType};base64,${group.imageData}`;
        }));
      }
    }
    return layer;
  });
  if (imagePromises.length > 0) {
    await Promise.all(imagePromises);
  }
  return layers;
}

// Export
window.esri2maplibre = {
  esriFeatureSetToGeoJSON,
  buildMapLibreLayersFromRenderer
};
