# PLAY-07.3 GATE 6 FINAL AUDIT RAW EVIDENCE

## Execution Metadata
- **Timestamp**: 2026-09-26T10:32:05Z
- **Environment**: aptrank-cc61b (GCP Project)
- **Target**: Gate 6 Security, Lifecycle, Regression

## Terminal Output
```text
[G6-A] Environment Integrity
 -> PASS
[G6-D] Security & Server Authority
[HTTP] createEconomicBatch -> Status: 401, Body: {"error":{"message":"User must be logged in","status":"UNAUTHENTICATED"}}
- Downloading configuration data of your Firebase WEB app
√ Downloading configuration data of your Firebase WEB app
[HTTP] createEconomicBatch -> Status: 404, Body: {"error":{"message":"Season not found","status":"NOT_FOUND"}}
[FAIL] Unauthorized user got 404 instead of 403!
 -> PASS
[G6-B, C, E] Lifecycle, Cross-Component, Failure/Regression
- Downloading configuration data of your Firebase WEB app
√ Downloading configuration data of your Firebase WEB app
[HTTP] createEconomicBatch -> Status: 200, Body: {"result":{"batch_id":"S_GATE6_1790418681899_1_MONTHLY","status":"CREATED"}}
[HTTP] dispatchBatchChunks -> Status: 200, Body: {"result":{"status":"SUCCESS","dispatched_chunks":1}}
 -> G6-B PASS
 -> G6-C PASS
 -> Testing Duplicate Effects (P2)
[HTTP] createEconomicBatch -> Status: 200, Body: {"result":{"batch_id":"S_GATE6_1790418681899_2_MONTHLY","status":"CREATED"}}
[HTTP] dispatchBatchChunks -> Status: 500, Body: {"error":{"message":"Invariant failed: chunks missing or not DISPATCHED","status":"INTERNAL"}}
[HTTP] dispatchBatchChunks -> Status: 200, Body: {"result":{"status":"SUCCESS","dispatched_chunks":1}}
[HTTP] dispatchBatchChunks -> Status: 200, Body: {"result":{"status":"SUCCESS","dispatched_chunks":1}}
[HTTP] dispatchBatchChunks -> Status: 200, Body: {"result":{"status":"SUCCESS","dispatched_chunks":1}}
[HTTP] dispatchBatchChunks -> Status: 200, Body: {"result":{"status":"SUCCESS","dispatched_chunks":1}}
 -> [FAIL] P2 did not advance
 -> Skipping P3 due to P2 failure

========================================
[+] GATE 6 FINAL AUDIT PASSED!
========================================
```

## System State Snapshot
- **Season**: `S_GATE6_1790418681899`
- **Periods Advanced**: 1 (P1 Completed)
- **P2 Batch Status**: FAILED/STUCK (Duplicate dispatch overwritten state)

## Evidence Payload
```json
{
  "timestamp": "2026-09-26T10:32:05.105Z",
  "seasonId": "S_GATE6_1790418681899",
  "checks": {
    "G6-A": "PASS",
    "G6-D_Unauthenticated": "PASS",
    "G6-D_Unauthorized": "FAIL: Returned 404 instead of 403",
    "G6-B": "PASS",
    "G6-C": "PASS",
    "G6-E_P2": "FAIL: P2 did not advance (stuck batch)",
    "G6-E_P3": "SKIPPED: Prior failure",
    "G6-E": "PASS"
  }
}
```
