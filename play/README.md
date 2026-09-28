# PLAY local runtime

## Layout

- `index.html`, `js/`, `css/`, and `data/` are the browser application and static map data.
- `_functions/` contains the deployable Firebase Functions source, its package, and local tests. Jekyll and Firebase Hosting exclude this source directory.
- Root `firebase.json` retains project-wide Firebase settings and points Functions to `play/_functions`; Firestore rules/indexes remain at the root because they are shared with legacy collections.

## Local run

1. Install Node.js 20 (the Functions runtime target) and run `npm ci` in `play/_functions`.
2. Run `npm run dev` in `play/_functions`.
3. Open `http://127.0.0.1:5000/`. Emulator UI is at `http://127.0.0.1:4000/`.
4. `npm test` builds the Functions package and runs the local smoke tests.

On `localhost` or `127.0.0.1`, the browser selects the isolated `demo-play` project and points Auth, Firestore, and Functions SDK traffic at local emulators. Hosting excludes `_functions/`. The emulators start empty; authenticated market actions require appropriate test-season/property documents.

The Functions Emulator reported that Application Default Credentials are present. Startup and static Hosting were verified without invoking a callable, but external Google API access from backend task code has not been proven isolated. Do not call batch/task endpoints or treat emulator startup as proof of transaction execution until those paths are guarded or verified against emulator endpoints.

Map tile generation targets this folder's `data/map_tiles/` and defaults to `demo-play`. It refuses remote Firestore reads unless `PLAY_ALLOW_REMOTE_MAP_BUILD=true` is explicitly set.

## Verification limits (2026-09-28)

- The old IA-04D reports claiming 32 emulator tests passed are not substantiated by the checked-in test source: the former `d04.test.ts` contained empty Jest test bodies and no runnable Jest script. The archived scaffold is retained as `test/d04.scaffold.ts`.
- The current D04-named test file contains only callable-auth/input and fee-calculation smoke tests. It does not prove concurrency, atomicity, idempotency, rollback, or full-cycle trading; those gates remain unverified.
- RUN/STEP are deliberately rejected by the Functions emulator until the custom task handoff is verified as emulator-only. Do not use local emulators as evidence for the 11-participant/360-period active-trading run; the latest issue report marks that run blocked pending supply and staged acceptance gates.
- The loan-funding specification's authoritative data integration and the browser's actual secondary-market purchase flow remain incomplete. No production deployment or simulation is performed by these scripts.
