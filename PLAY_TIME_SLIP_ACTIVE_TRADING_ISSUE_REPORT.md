# PLAY Time-Slip Active Trading — Issue Report

## ISSUE

### Symptom
The requested `ACTIVE_TRADING_TEST` has not met its real-trade acceptance criteria. The batch worker contains a test-only market path, but the test season currently has no supply records and the controlled P0 produced no property transactions. The worker can still mark the economic batch complete and advance the clock without proving a trade occurred.

### Evidence
- `functions/scripts/setup_hero_test_ais.js` provisions 10 AI participants in addition to HERO; authenticated Firestore inspection found their assets in `test_hero_season`.
- The live test season has zero `PLAY_PRIMARY_SUPPLY` documents. Its controlled P0 has zero `PLAY_PROPERTY_TRANSACTION` documents.
- `functions/src/play/batch/processBatchChunk.ts` enters its special `test_hero_season` market branch only when a primary-supply pool is populated.
- `functions/src/play/market/internalMarketService.ts` is not equivalent to the verified market callables: it skips the purchase cash check and calculates a test resale price from a dummy formula. It therefore cannot establish the required verified real-trade behavior.
- The batch/clock path does not enforce a minimum transaction count per participant before completing a period.
- The repository's `PLAY-AI-SEASON-01_L10_REPORT.md` concerns a separate season and economic engine run. It does not establish 11 ACTIVE_TRADING_TEST participants, 2 real trades per participant per period, or live trading completion.
- No RUN or full trading simulation was issued in this work.

### Root Cause
The test season has participants but lacks primary supply, so the worker records no trades. Its fallback test market path also does not preserve the verified transaction checks, and period completion is not gated on the requested per-participant transaction counts.

### Impact
Starting RUN would not satisfy the stated transaction acceptance criteria. Without supply it can advance economic periods without transactions; the fallback test-market code also bypasses validated purchase checks. A 360-period run would multiply state changes without establishing valid trading evidence.

### Proposed Fix
Implement an isolated `ACTIVE_TRADING_TEST` strategy/driver that:
1. validates the existing HERO + 10 AI participant records and provisions only any missing test participants;
2. generates decisions and invokes validated primary/secondary transaction operations through a supported backend service path;
3. verifies committed transactions and authoritative asset/ownership changes per participant;
4. prevents batch completion and clock advance unless 11 participants each meet the required transaction count;
5. reports live progress, stalls, and automatic pause conditions; and
6. passes the required staged browser/backend gates before the 360-period run.

### Architecture Impact
This requires a backend strategy execution path and changes to participant/batch completion contracts. That crosses the existing PLAY worker, transaction, idempotency, and clock boundaries. It must remain isolated from NORMAL seasons and must not modify the protected economic/transaction engines without a reviewed design and regression plan.

### Regression Impact
Potentially affected protected areas: Player Processing, Primary Purchase, Secondary Listing/Trade, Transaction Atomicity, Idempotency, Research Logging, Reconciliation, Season Clock, and Live listeners. The controlled recovery changed only the Reconciliation function and `test_hero_season.transaction_status`; the final section records this deployment and state change.

### Approval Required
YES — approval was received on 2026-09-28 and used for the isolated Reconciliation fix/deployment. The separate active-trading strategy still needs architecture and transaction-boundary review under `PLAY_AG_WORK_CONTROL_PROTOCOL.md` before implementation/deployment.

### Current Status
BLOCKED for the full ACTIVE_TRADING_TEST — the 10 AI participants exist, but the season has no primary supply, the test-only market path does not meet validated transaction requirements, and no per-participant trade-count gate is enforced. Do not start the 11-participant/360-period simulation until the supply and strategy path and staged acceptance gates are reviewed and verified.

## Local Change Log
- File: `functions/src/play/batch/processBatchChunk.ts`
- Change: removed the synthetic `TEST_PROP_*` BUY/SELL, ownership, decision, and direct asset mutation block; restored the economic asset update's transaction closure and removed now-unused locals/imports.
- Reason: prevent the worker from claiming fake market trades and repair invalid TypeScript syntax.
- Verification: `node .\\node_modules\\typescript\\bin\\tsc -p .\\tsconfig.json --noEmit` from `functions/` completed successfully at that time.
- Deployment/data change: none.
- Rollback: source change can be reviewed/reverted in version control. This local worker edit was not deployed; the later Reconciliation deployment is documented below.

## Follow-up Verification Addendum (2026-09-28)

### Initial Season Progress Graph Verification
- The intermediate implementation used an SVG line/area chart driven by `PLAY_SEASON.current_simulation_period`.
- It was later replaced with the requested horizontal bar graph, documented in the UI Revision section below.
- Initial browser evidence showed HERO Home at `Period 0 / 360 (0%)` before recovery.

### Controlled STEP Attempt
- One STEP request was sent from the browser because the user asked to verify period progression.
- The callable returned and the UI changed to `STEP 처리 중...`; after approximately 30 seconds the Firestore listener and UI still showed P0. Browser console had no warnings/errors.
- No second STEP or RUN was sent. The transaction/batch side effects, if any, could not be conclusively inspected, so their final state is UNKNOWN.
- The backend STEP handler sets the season clock to PAUSED; however, that persisted value could not be independently confirmed after the request.

### Initial External Diagnostic Limitation — Resolved
- The first log query could not access the pre-existing user gcloud config. After the user authenticated a dedicated gcloud config, read-only Cloud Logging and Firestore queries succeeded and identified the failure described below.
- The earlier “UNKNOWN” diagnosis was superseded by the authenticated cloud evidence in the final section.

### Verification
- `node --check play/js/play_app.js`: PASS.
- TypeScript project compile with local TypeScript compiler and `--noEmit`: PASS.
- Browser render at actual P0: PASS.
- Initial browser period advancement via STEP: BLOCKED at P0 until the Reconciliation fix and approved recovery documented below.
- 11-participant ACTIVE_TRADING_TEST and 360-period execution: NOT STARTED.

## UI Revision (2026-09-28)

Per the user's follow-up, the temporary SVG line chart was replaced with the original horizontal Bar Graph presentation. The fill width is now computed from the live season period as `clamp(period, 0, 360) / 360`; the visible `Period n / 360` label and accessible progress value use the same authoritative value. This UI-only revision does not advance or otherwise mutate the simulation.

## Authenticated Cloud Diagnosis and Local Fix (2026-09-28)

### Reproduction and Runtime Evidence
- The browser was on the PLAY screen with HERO visible, `Period 0 / 360`, and the progress bar empty. No additional STEP or RUN was sent during this diagnosis.
- Cloud Functions inventory confirmed `controlSimulation`, `createEconomicBatchTask`, `dispatchBatchChunksTask`, `processBatchChunk`, `aggregateBatch`, and `runReconciliation` are deployed in `asia-northeast3`.
- Cloud Logs show the current callable STEP path was accepted: callable request verification passed, HTTP 200, and `[controlSimulation] Triggering batch for action STEP` was logged. `createEconomicBatchTask` also returned HTTP 200.
- Read-only Firestore inspection confirmed `test_hero_season` is ACTIVE but `clock_status=PAUSED`, `current_simulation_period=0`. Its P0 ECONOMIC batch is COMPLETED with 1/1 chunk complete and 0 failed chunks.
- Immediately afterward, deployed `runReconciliation` logged 10 asset mismatches, one each for `AI-01` through `AI-10`, paused the season, and returned HTTP 500. HERO's asset has `cash_locked=0`; the ten AI asset documents omit `cash_locked`, while each has equal `cash_total` and `cash_available`.
- The browser console showed no JavaScript error for this flow. The older `Invalid request` entries predate the successful callable requests and are not the current root cause.

### Root Cause
The deployed `functions/src/play/reconciliation/runReconciliation.ts` treated an absent `cash_locked` property as an invalid arithmetic value. A sibling legacy reconciliation implementation already treats a missing value as zero. Therefore an otherwise balanced set of 10 AI assets caused reconciliation to pause the season after the STEP batch had completed, leaving the authoritative period at zero.

### Local Fix and Verification
- Changed the active reconciliation implementation to interpret missing or null `cash_locked` as zero, matching the existing legacy behavior. The invariant remains `cash_total === cash_available + cash_locked`.
- Functions TypeScript compilation with `tsc -p tsconfig.json --noEmit` passed after the local fix.

### Deployment Boundary
The user approved recovery on 2026-09-28. The following actions were completed:
- Deployed only `runReconciliation` with Firebase CLI. Cloud Functions reports it ACTIVE, updated at `2026-09-27T17:09:29Z`.
- Added `sa-key.json` to the Functions source ignore list in `firebase.json` before deployment so the local service-account key is excluded from uploaded source.
- Restored only `test_hero_season.transaction_status` to `NORMAL`; preserved `clock_status=PAUSED`.
- The existing P0 batch reconciled without post-deployment errors. Firestore reports `current_simulation_period=1`, `last_successful_period=0`, and `last_successful_batch_id=test_hero_season_0_ECONOMIC`.
- The open browser's Firestore listener updated HOME to `Period 1 / 360 (0.3%)`; its progress label and accessible bar value reflect the authoritative period. The clock remains PAUSED, so no later period was dispatched.
- Read-only Firestore queries found zero `PLAY_PRIMARY_SUPPLY` documents and zero `PLAY_PROPERTY_TRANSACTION` documents for `test_hero_season`. The batch worker's trading branch requires a populated primary-supply pool, so this period advanced economically but did not execute a real property trade.

### Final Verdict
**Single-step Live Time-Slip progression: PASS.** The callable accepted the STEP, the economic batch completed, reconciliation passed after the compatibility fix, and browser state advanced from P0 to P1 exactly once.

**RUN/automatic multi-period progression: NOT TESTED. Active trading: BLOCKED.** The test season has no primary supply documents and the controlled P0 produced zero property transactions. This work stopped at one period with the clock paused. Populate the approved test-season supply and verify its allocation/transaction path before starting the separate 11-participant trading run. No Economic Engine, IA-03C/IA-04D transaction logic, Security Rules, idempotency, or Research logging was changed. No full simulation was run.
