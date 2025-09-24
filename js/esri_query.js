// Effectue une requête ESRI REST pour récupérer les entités visibles dans l'emprise de la carte
// url: string (service ESRI), bbox: [minX, minY, maxX, maxY]
async function fetchEsriFeatures(url, bbox, maxFeatures = 1000) {
  const queryUrl = `${url}/query?f=json&geometry=${bbox.join(',')}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=${maxFeatures}`;
  const response = await fetch(queryUrl);
  if (!response.ok) throw new Error('Erreur requête ESRI: ' + response.statusText);
  return response.json();
}
window.fetchEsriFeatures = fetchEsriFeatures;
