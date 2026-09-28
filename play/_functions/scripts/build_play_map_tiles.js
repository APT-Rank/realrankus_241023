const fs = require('node:fs/promises');
const path = require('node:path');

const defaultTileZoom = 14;
const pageSize = 500;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function tileForCoordinates(latitude, longitude, zoom = defaultTileZoom) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isInteger(zoom) || zoom < 0 || zoom > 22) return null;

  const tileCount = 2 ** zoom;
  const normalizedLongitude = clamp(lng, -180, 180 - Number.EPSILON);
  const radians = clamp(lat, -85.05112878, 85.05112878) * Math.PI / 180;
  const x = clamp(Math.floor(((normalizedLongitude + 180) / 360) * tileCount), 0, tileCount - 1);
  const y = clamp(Math.floor(((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2) * tileCount), 0, tileCount - 1);
  return { x, y };
}

function regionNameFromAddress(address) {
  const parts = String(address || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  if (/(특별시|광역시|특별자치시)$/.test(parts[0])) return parts[1];
  if (parts.length > 2 && /시$/.test(parts[1]) && /구$/.test(parts[2])) return `${parts[1]} ${parts[2]}`;
  return parts[1];
}

function createMarkerAccumulator() {
  return { complexes: new Map(), sourceDocumentCount: 0 };
}

function candidateScore(property) {
  const available = property.tradable === true && (property.property_status || 'NORMAL') === 'NORMAL';
  const price = Number(property.average_price ?? property.initial_price);
  return [available ? 0 : 1, Number.isFinite(price) && price > 0 ? price : Number.MAX_SAFE_INTEGER];
}

function isBetterCandidate(candidate, current) {
  if (!current) return true;
  const nextScore = candidateScore(candidate);
  const currentScore = candidateScore(current);
  return nextScore[0] < currentScore[0] || (nextScore[0] === currentScore[0] && nextScore[1] < currentScore[1]);
}

function addPropertyRecord(accumulator, record) {
  accumulator.sourceDocumentCount += 1;
  const property = record.data || record;
  const complexName = String(property.complex_name || '').trim();
  const complexId = String(property.complex_id || property.property_id || record.id || '').trim();
  const latitude = Number(property.y ?? property.latitude);
  const longitude = Number(property.x ?? property.longitude);
  if (!complexId || !complexName || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

  let complex = accumulator.complexes.get(complexId);
  if (!complex) {
    complex = { complexId, complexName, propertyCount: 0, tradableCount: 0, candidate: null };
    accumulator.complexes.set(complexId, complex);
  }
  complex.propertyCount += 1;
  if (property.tradable === true && (property.property_status || 'NORMAL') === 'NORMAL') complex.tradableCount += 1;
  if (isBetterCandidate(property, complex.candidate)) {
    complex.candidate = { ...property, y: latitude, x: longitude };
  }
}

function finalizeMarkerIndex(accumulator, zoom = defaultTileZoom) {
  const tiles = new Map();
  const regionCounts = new Map();
  let markerCount = 0;

  for (const complex of accumulator.complexes.values()) {
    if (!complex.candidate) continue;
    const property = complex.candidate;
    const coordinates = tileForCoordinates(property.y, property.x, zoom);
    if (!coordinates) continue;
    const marker = {
      id: complex.complexId,
      complex_id: property.complex_id ?? complex.complexId,
      complex_name: complex.complexName,
      x: property.x,
      y: property.y,
      legal_dong_address: property.legal_dong_address || '',
      initial_price: Number(property.initial_price) || null,
      average_price: Number(property.average_price) || null,
      representative_area_label: property.representative_area_label || null,
      representative_area_sqm: Number(property.representative_area_sqm) || null,
      household_count: Number(property.household_count) || null,
      property_count: complex.propertyCount,
      tradable_count: complex.tradableCount
    };
    const tileKey = `${coordinates.x}/${coordinates.y}`;
    if (!tiles.has(tileKey)) tiles.set(tileKey, []);
    tiles.get(tileKey).push(marker);
    markerCount += 1;

    const regionName = regionNameFromAddress(marker.legal_dong_address);
    if (regionName) {
      const region = regionCounts.get(regionName) || { name: regionName, count: 0, latitude: 0, longitude: 0 };
      region.count += 1;
      region.latitude += marker.y;
      region.longitude += marker.x;
      regionCounts.set(regionName, region);
    }
  }

  const featuredRegions = Array.from(regionCounts.values())
    .map(region => ({
      name: region.name,
      count: region.count,
      latitude: region.latitude / region.count,
      longitude: region.longitude / region.count
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 12);

  return { tiles, markerCount, featuredRegions, sourceDocumentCount: accumulator.sourceDocumentCount };
}

function makeVersion(value) {
  const version = String(value || new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14));
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(version)) throw new Error('Version may contain only letters, numbers, underscores, and hyphens.');
  return version;
}

async function writeTileAssets(index, outputDirectory, version, zoom = defaultTileZoom) {
  const versionDirectory = path.join(outputDirectory, version, String(zoom));
  for (const [key, markers] of index.tiles) {
    const [x, y] = key.split('/');
    const tileDirectory = path.join(versionDirectory, x);
    await fs.mkdir(tileDirectory, { recursive: true });
    await fs.writeFile(path.join(tileDirectory, `${y}.json`), JSON.stringify({ markers }), 'utf8');
  }

  const manifest = {
    schema_version: 1,
    version,
    tile_zoom: zoom,
    tile_root: `./data/map_tiles/${version}/${zoom}`,
    marker_count: index.markerCount,
    source_document_count: index.sourceDocumentCount,
    featured_regions: index.featuredRegions,
    generated_at: new Date().toISOString()
  };
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(path.join(outputDirectory, 'current.json'), JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
}

async function main() {
  const admin = require('firebase-admin');
  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'aptrank-cc61b';
  if (admin.apps.length === 0) admin.initializeApp({ projectId });
  const db = admin.firestore();
  const tileZoom = Number(process.env.PLAY_MAP_TILE_ZOOM || defaultTileZoom);
  const versionArgument = process.argv.slice(2).find(argument => argument.startsWith('--version='));
  const version = makeVersion(versionArgument ? versionArgument.slice('--version='.length) : process.env.PLAY_MAP_TILE_VERSION);
  const outputDirectory = path.resolve(__dirname, '../../play/data/map_tiles');
  const accumulator = createMarkerAccumulator();
  const collection = db.collection('PLAY_PROPERTY_MASTER');
  let lastDocument = null;

  while (true) {
    let query = collection.orderBy(admin.firestore.FieldPath.documentId()).limit(pageSize);
    if (lastDocument) query = query.startAfter(lastDocument);
    const snapshot = await query.get();
    if (snapshot.empty) break;
    snapshot.docs.forEach(document => addPropertyRecord(accumulator, { id: document.id, data: document.data() }));
    lastDocument = snapshot.docs[snapshot.docs.length - 1];
    console.log(`Read ${accumulator.sourceDocumentCount} PLAY_PROPERTY_MASTER documents.`);
    if (snapshot.size < pageSize) break;
  }

  const index = finalizeMarkerIndex(accumulator, tileZoom);
  const manifest = await writeTileAssets(index, outputDirectory, version, tileZoom);
  console.log(`Generated ${manifest.marker_count} complex markers in ${index.tiles.size} tiles at ${outputDirectory}.`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Failed to build PLAY map tiles:', error);
    process.exitCode = 1;
  });
}

module.exports = { addPropertyRecord, createMarkerAccumulator, finalizeMarkerIndex, makeVersion, regionNameFromAddress, tileForCoordinates, writeTileAssets };
