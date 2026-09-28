# PLAY map marker tiles

The map uses compact, versioned marker tiles rather than downloading the full property master. The build is read-only against Firestore: it reads `PLAY_PROPERTY_MASTER` in document-ID pages and writes static assets under `play/data/map_tiles/`.

## Build a catalog version

From `functions/`, authenticate with Application Default Credentials for project `aptrank-cc61b`, then run:

```powershell
node scripts/build_play_map_tiles.js --version=20260928
```

The build writes `play/data/map_tiles/current.json` and versioned z/x/y JSON tiles. Deploy the generated `play/` static assets with the service's existing web deployment. Keep old version folders available while clients may still have the previous manifest cached.

The browser requests only tiles intersecting the viewport at zoom 14 or higher, filters markers against exact map bounds, and caches fetched tiles in memory and the browser cache. Full property records load from Firestore only after a complex is selected. The existing server-side purchase transaction remains authoritative for supply, player funds, ownership, and idempotency.
