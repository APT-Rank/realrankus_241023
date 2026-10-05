# PLAY local runtime

## Layout

- `index.html`, `js/`, `css/`, and `data/` are the browser application and static map data.
- `_functions/` contains the deployable Firebase Functions source, its package, and local tests. Jekyll and Firebase Hosting exclude this source directory.
- Root `firebase.json` retains project-wide Firebase settings and points Functions to `play/_functions`; Firestore rules/indexes remain at the root because they are shared with legacy collections.

## Local run

1. Install Node.js 22 (the Functions runtime target) and run `npm ci` in `play/_functions`.
2. Run `npm run dev` in `play/_functions`; this starts Auth, Firestore, Functions, and Hosting with project `demo-play`.
3. In a second terminal, run `npm run seed:exchange-emulator` in `play/_functions` to reset and seed the emulator-only exchange scenario.
4. Open `http://127.0.0.1:5000/`. Emulator UI is at `http://127.0.0.1:4000/`.
5. `npm test` builds the Functions package and runs the local smoke and emulator-fixture safety tests.

`js/runtime/firebase_runtime.js` routes `localhost`, `127.0.0.1`, and `::1` to the `demo-play` Auth, Firestore, and Functions emulators. Other hosts retain the production project. Hosting excludes `_functions/`.

`npm run seed:exchange-emulator` refuses to run without the explicit `--target=demo-play` target and pins both emulator endpoints to loopback. It resets only documents in `test_hero_season` plus its specifically tagged `TEST_ONLY` master records, then seeds the HERO-owned home (map complex `10002`), AI-owned home (`100473`), a primary-supply home (`10065`), and an AI sell order. HERO login is `hero@aptrank.test` / `password123`; AI owner login is `ai-owner@aptrank.test` / `password123`. These credentials and all seeded assets exist only in the local emulator. After signing in as HERO, the emulator-only account switch button toggles between HERO and the AI owner, allowing both sides of an order to be tested. Use the map to test HERO's sell form and the AI-owned property's request form; the exchange board also shows the AI sell order and test primary supply.

HERO test login and TIME-SLIP controls live under `js/dev/` and load only in emulator mode. The HERO test season is selected by the active `HERO_USER` membership. TIME-SLIP defaults to off, and switching it off or signing out stops its live listeners.

The Functions Emulator reported that Application Default Credentials are present. Startup and static Hosting were verified without invoking a callable, but external Google API access from backend task code has not been proven isolated. Do not call batch/task endpoints or treat emulator startup as proof of transaction execution until those paths are guarded or verified against emulator endpoints.

Map tile generation targets this folder's `data/map_tiles/` and defaults to `demo-play`. It refuses remote Firestore reads unless `PLAY_ALLOW_REMOTE_MAP_BUILD=true` is explicitly set.

## Verification limits (2026-09-28)

- The old IA-04D reports claiming 32 emulator tests passed are not substantiated by the checked-in test source: the former `d04.test.ts` contained empty Jest test bodies and no runnable Jest script. The archived scaffold is retained as `test/d04.scaffold.ts`.
- The current D04-named test file contains only callable-auth/input and fee-calculation smoke tests. It does not prove concurrency, atomicity, idempotency, rollback, or full-cycle trading; those gates remain unverified.
- RUN/STEP are deliberately rejected by the Functions emulator until the custom task handoff is verified as emulator-only. Do not use local emulators as evidence for the 11-participant/360-period active-trading run; the latest issue report marks that run blocked pending supply and staged acceptance gates.
- The loan-funding specification's authoritative data integration and the browser's actual secondary-market purchase flow remain incomplete. No production deployment or simulation is performed by these scripts.
