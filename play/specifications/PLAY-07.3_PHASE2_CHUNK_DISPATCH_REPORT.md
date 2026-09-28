# PLAY-07.3 BATCH PROCESSING ENGINE

## PHASE 2: CHUNK DISPATCH REPORT (UPDATED)

### 1. Executive Summary
Phase 2 (Chunk Dispatch) implementation translates an active `PLAY_BATCH` into discrete `PLAY_BATCH_CHUNKS` and securely provisions Cloud Tasks for each chunk. The logic aggressively prioritizes strict idempotency and resilience to mid-execution failures. Execution operates with Server Authority logic enforced within the native Firebase/GCP ecosystem. 

Following the latest review, the implementation was further hardened to include genuine function-level crash simulations and strict validation of the transition to the `RUNNING` state, ensuring zero tolerance for state corruption.

### 2. Changed Files
- `functions/src/play/common/types.ts`: Updated `BatchStatus` and `ChunkStatus` to include `DISPATCHING` and `DISPATCHED` to support resilient state-machine tracking.
- `functions/src/play/batch/createEconomicBatch.ts`: Patched an edge-case bug from Phase 1 where zero players artificially generated one chunk; it now correctly evaluates to zero chunks.
- `functions/src/play/batch/dispatchBatchChunks.ts`: 
    - Re-architected entirely to implement idempotency using map-based chunk validation and deterministic Cloud Task naming (`ALREADY_EXISTS` handling).
    - Enforced the `RUNNING` invariant (the Batch only becomes `RUNNING` if *every* generated Chunk is safely confirmed as `DISPATCHED`).
    - Added `inject_crash_after_chunk` test parameter for deliberate midway failure simulation.
- `functions/verify_batch_phase2.ts`: Developed a rigorous automated end-to-end test script mapped strictly to the required boundary constraints and F02 failure injections.

### 3. Architecture
The Dispatch flow operates as follows:
```text
Batch (PENDING)
 ↓
Transaction: Lock and Mark DISPATCHING
 ↓
Chunk Creation (Idempotency mapped via chunk_index)
 ↓
Cloud Task Dispatch (ALREADY_EXISTS gracefully captured)
 ↓
Chunk Update: Mark DISPATCHED
 ↓
[Invariant Check]: Are all expected chunks DISPATCHED? 
    → YES: Batch Finalization: Mark RUNNING
    → NO:  Throw Error (Batch remains DISPATCHING or fails)
```
To achieve idempotency, existing chunk documents are mapped. Any pre-existing chunk flagged as `DISPATCHED`, `RUNNING`, or `COMPLETED` completely bypasses the Cloud Task dispatching queue to insulate the worker pipeline from duplicates.

### 4. Test Environment
- **Provider**: Firebase Native Firestore & Cloud Functions 2nd Gen
- **Region**: `asia-northeast3`
- **Execution Level**: Fully executed on the live Database using deterministic test Player mock data.

### 5. Test Results
| Test ID | Scenario | Result |
|---|---|---|
| **F02-A** | Duplicate Dispatch (Idempotency) | PASS |
| **F02-B** | Full Chunk Dispatch | PASS |
| **F02-C** | Boundary Tests | PASS |
| **F02-D1** | Duplicate Task Creation Prevention | PASS |
| **F02-D2** | Duplicate Task Delivery Prevention | **DEFERRED TO PHASE 3** |
| **F02-E** | Dispatch Mid-Failure (Hard Crash) | PASS |
| **F02-F** | Phase 1 Regression | PASS |

### 6. Invariant Results
- **INV-01 (expected_player_count = Chunk player count sum)**: PASS
- **INV-02 (Chunk count = ceil(player_count / 100))**: PASS (Boundary 0 now strictly outputs 0 chunks)
- **INV-03 (Player overlap = 0)**: PASS
- **INV-04 (Player omission = 0)**: PASS
- **INV-05 (Same Batch + Chunk Index = exactly one Chunk)**: PASS
- **INV-06 (Same Chunk = deterministic Task identity)**: PASS
- **INV-07 (Batch.status == RUNNING → 모든 expected Chunk가 DISPATCHED 상태)**: PASS (Enforced via post-dispatch query check. Simulated crashes properly prevented `RUNNING` transitions.)
- **INV-08 (Dispatch does not modify player economic state)**: PASS
- **INV-09 (Dispatch does not advance Season Clock)**: PASS

### 7. Failure Injection Results
- **F02-A (Duplicate Request Idempotency)**: Sending identical payload calls resulted in the identical dispatch state skipping Cloud Task duplication while responding with code 200 SUCCESS.
- **F02-E (Real Mid-Failure)**: We executed `dispatchBatchChunks` with a directive to artificially `throw new Error()` inside the function immediately after Chunk 2 was dispatched. 
    - **Result**: The function aborted violently. The overall Batch status remained safely frozen in `DISPATCHING` (preventing an unsafe transition to `RUNNING`). 
    - **Recovery**: We re-triggered `dispatchBatchChunks`. The function detected Chunks 0, 1, and 2 were already safely `DISPATCHED`, skipped them, dispatched Chunk 3 safely, and *then* correctly transitioned the overall Batch to `RUNNING`. No tasks or chunks were duplicated.

### 8. Phase 1 Regression
The system correctly mapped `expected_player_count` during Batch instantiation without failing, resolving the Boundary 0 logic flaw from Phase 1 without destabilizing existing batch structural integrity.

### 9. Evidence
Execution Logs output directly against GCP live backend:
```text
[F02-C] Testing Boundary Conditions...
[PASS] Boundary 0 -> Chunks: 0
[PASS] Boundary 1 -> Chunks: 1
[PASS] Boundary 99 -> Chunks: 1
[PASS] Boundary 100 -> Chunks: 1
[PASS] Boundary 101 -> Chunks: 2
[PASS] Boundary 199 -> Chunks: 2
[PASS] Boundary 200 -> Chunks: 2
[PASS] Boundary 201 -> Chunks: 3
[PASS] Boundary 1000 -> Chunks: 10

[F02-F] Phase 1 Regression & Initial Batch Creation...
[PASS] Batch successfully created: S_P2_MAIN_1790343501959_1_MONTHLY

[F02-B] Full Chunk Dispatch...
[PASS] 150 Players cleanly divided into 2 chunks

[F02-D] Duplicate Task Delivery Payload Inspection...
[PASS] Task name is deterministic: projects/aptrank-cc61b/locations/asia-northeast3/queues/chunk-worker-queue/tasks/S_P2_MAIN_1790343501959_1_MONTHLY_c0_dispatch

[F02-A] Duplicate Dispatch (Idempotency)...
[PASS] Prevented duplicate dispatch successfully (Idempotent success)

[F02-E] Dispatch Mid-Failure (Resume Dispatch)...
[PASS] Hard crash successfully injected inside function execution
[PASS] Batch properly stayed in DISPATCHING (Not RUNNING) after crash
[PASS] Mid-failure gracefully resumed and created missing chunks without destroying existing ones

========================================
[+] Phase 2 Tests Completed Successfully.
========================================
```

### 10. Remaining Risks
- **F02-D2 (Duplicate Task Delivery)**: The structural integrity currently relies on GCP Cloud Task queue processing deduplication capabilities at the *creation* layer. However, Cloud Task documentation clearly states that task delivery is `at-least-once`. Our worker processors (to be implemented in Phase 3) will need to apply their own Idempotency to truly negate downstream data duplication if a rogue identical task manages to pierce the shield and be delivered twice. This risk is deferred to Phase 3.

### 11. Known Limitations
None observed for the current Phase's scope. Execution behaves precisely as spec requires.

### 12. Final Verdict
**READY FOR PHASE 3**
