(function (root) {
    const tileCache = new Map();
    const tileRequests = new Map();
    const maxCachedTiles = 96;
    let manifest = null;
    let manifestRequest = null;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function longitudeToTileX(longitude, zoom) {
        const tileCount = 2 ** zoom;
        const normalizedLongitude = clamp(longitude, -180, 180 - Number.EPSILON);
        return clamp(Math.floor(((normalizedLongitude + 180) / 360) * tileCount), 0, tileCount - 1);
    }

    function latitudeToTileY(latitude, zoom) {
        const tileCount = 2 ** zoom;
        const radians = clamp(latitude, -85.05112878, 85.05112878) * Math.PI / 180;
        const mercatorY = (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2;
        return clamp(Math.floor(mercatorY * tileCount), 0, tileCount - 1);
    }

    function getVisibleTileKeys(bounds, zoom) {
        if (!bounds || !Number.isInteger(zoom) || zoom < 0 || zoom > 22) {
            throw new Error('Invalid map bounds or tile zoom.');
        }
        const west = Number(bounds.west);
        const east = Number(bounds.east);
        const north = Number(bounds.north);
        const south = Number(bounds.south);
        if (![west, east, north, south].every(Number.isFinite)) {
            throw new Error('Map bounds must contain finite west, east, north, and south values.');
        }

        const tileCount = 2 ** zoom;
        const westX = longitudeToTileX(west, zoom);
        const eastX = longitudeToTileX(east, zoom);
        const northY = latitudeToTileY(Math.max(north, south), zoom);
        const southY = latitudeToTileY(Math.min(north, south), zoom);
        const xRanges = westX <= eastX ? [[westX, eastX]] : [[westX, tileCount - 1], [0, eastX]];
        const keys = [];
        xRanges.forEach(([startX, endX]) => {
            for (let x = startX; x <= endX; x += 1) {
                for (let y = northY; y <= southY; y += 1) keys.push(`${x}/${y}`);
            }
        });
        if (keys.length > 256) throw new Error(`Map viewport spans too many marker tiles (${keys.length}).`);
        return keys;
    }

    async function loadManifest(forceRefresh = false) {
        if (manifest && !forceRefresh) return manifest;
        if (manifestRequest && !forceRefresh) return manifestRequest;
        manifestRequest = root.fetch('./data/map_tiles/current.json', { cache: 'no-cache' })
            .then(response => {
                if (!response.ok) throw new Error(`Map tile manifest request failed (${response.status}).`);
                return response.json();
            })
            .then(data => {
                if (!data || !data.version || !Number.isInteger(Number(data.tile_zoom)) || !data.tile_root) {
                    throw new Error('Map tile manifest is missing required fields.');
                }
                manifest = data;
                return manifest;
            })
            .finally(() => { manifestRequest = null; });
        return manifestRequest;
    }

    function rememberTile(key, markers) {
        tileCache.delete(key);
        tileCache.set(key, markers);
        while (tileCache.size > maxCachedTiles) tileCache.delete(tileCache.keys().next().value);
    }

    async function loadTile(tileKey, tileRoot) {
        if (tileCache.has(tileKey)) {
            const cached = tileCache.get(tileKey);
            tileCache.delete(tileKey);
            tileCache.set(tileKey, cached);
            return cached;
        }
        if (tileRequests.has(tileKey)) return tileRequests.get(tileKey);

        const tileUrl = new URL(`${tileRoot}/${tileKey}.json`, root.document.baseURI).toString();
        const request = root.fetch(tileUrl, { cache: 'force-cache' })
            .then(async response => {
                if (response.status === 404) return [];
                if (!response.ok) throw new Error(`Map tile request failed (${response.status}): ${tileKey}`);
                const data = await response.json();
                return Array.isArray(data) ? data : Array.isArray(data.markers) ? data.markers : [];
            })
            .then(markers => { rememberTile(tileKey, markers); return markers; })
            .finally(() => tileRequests.delete(tileKey));
        tileRequests.set(tileKey, request);
        return request;
    }

    async function loadVisibleMarkers(bounds) {
        const currentManifest = await loadManifest();
        const keys = getVisibleTileKeys(bounds, Number(currentManifest.tile_zoom));
        const tiles = await Promise.all(keys.map(key => loadTile(key, currentManifest.tile_root)));
        const markersByComplex = new Map();
        tiles.flat().forEach(marker => {
            const id = String(marker.complex_id || marker.id || '');
            if (id && !markersByComplex.has(id)) markersByComplex.set(id, marker);
        });
        return Array.from(markersByComplex.values());
    }

    function clearMemoryCache() {
        tileCache.clear();
        tileRequests.clear();
        manifest = null;
        manifestRequest = null;
    }

    const api = { getVisibleTileKeys, loadManifest, loadVisibleMarkers, clearMemoryCache };
    root.playMapTiles = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
