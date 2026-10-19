# PLAY-07.3 GATE 5: EXEC-002 Resume Verification

> Controlled Resume Execution Specification + Evidence Record  
> Gate: GATE 5 / Execution: EXEC-002  
> Predecessor: EXEC-001 PARTIALLY VERIFIED  
> Purpose: Resume from verified P296 state and complete P297–P360  
> **Critical Rule: EXEC-002 is the final authorized execution. There is no EXEC-003.**

## 1. Background

EXEC-001 completed P1–P296. At the P297 trigger, the external orchestration script received `[createEconomicBatch] Unauthenticated`. The recorded cause is Firebase ID Token expiration after approximately one hour in the external test client.

EXEC-001 is permanently recorded as `PARTIALLY VERIFIED`. Do not overwrite or rerun P1–P296.

## 2. Objective

EXEC-002 asks only:

> Can the existing verified P296 state continue correctly from P297 through P360 when the external test client's authentication lifetime is handled correctly?

This is a **controlled resume**, not a second 360-period test.

## 3. Fixed Scope

| Item | Value |
|---|---:|
| Execution ID | EXEC-002 |
| Existing verified state | P296 completed |
| Resume Period | P297 |
| Final Period | P360 |
| Additional Periods | 64 |
| Players | 150 |
| Chunk Size | 100 |
| Expected Chunks / Batch | 2 |
| Expected Additional Batches | 64 |
| Expected Additional Chunks | 128 |
| Expected Additional Player Processing | 9,600 |
| Expected Final Clock | 361 |
| Existing Clock Before Resume | 297 |

P296 completed and advanced the Season Clock to 297. After P360 completes, the expected Clock is 361.

## 4. Allowed Change

Only the **external test client's authentication handling** may change.

The test client may refresh/reacquire Firebase ID Tokens before expiry.

No PLAY backend, database, infrastructure, IAM, Security Rules, Cloud Tasks, economic parameters, player count, chunk size, Property Master, or season configuration may be changed.

## 5. Mandatory Preflight

Before execution verify:

### Season
- Season ID = `S_GATE5_1790412049183`
- current_simulation_period = 297
- P296 Batch = COMPLETED
- P296 reconciliation = PASS
- P296 Clock advancement completed
- no ambiguous P297 economic effect

### Property Master
- Total = 209
- NORMAL = 200
- INCOMPLETE = 9
- `PROP_FINAL_1` = NOT FOUND

### Players
- 150 active players
- P296 processing complete
- no unexplained player-state discrepancy

### Infrastructure
- Functions unchanged
- Cloud Tasks unchanged
- IAM unchanged
- Security Rules unchanged

### Test Client
- token refresh/reacquisition is implemented
- no PLAY backend modification
- scope remains P297–P360

Any mismatch = `PRECHECK BLOCKED` and STOP.

## 6. P297 Resume Safety

Before triggering P297, inspect the authoritative state.

### Case A — No effective P297 Batch
Proceed with normal P297 Batch Creation.

### Case B — P297 Batch exists but has no economic effect
Resume only if its state is safely resumable and idempotency permits continuation. Record the exact state.

### Case C — P297 Batch is already COMPLETED
Do NOT execute P297 again. Verify its reconciliation and Clock effect, then continue from the authoritative next period.

### Case D — P297 has partial or ambiguous economic effects
STOP. Do not guess, repair, delete, reset, or replay.

## 7. Execution

Continue from authoritative state through P360.

For each period:
1. Create or resume the correct Batch.
2. Dispatch expected Chunks.
3. Process all 150 players.
4. Aggregate Chunks.
5. Reconcile.
6. Advance Season Clock exactly once.
7. Record evidence.
8. Continue.

The test client must maintain valid authentication throughout.

## 8. Per-Period Evidence

For P297–P360 record:
- period
- batch_id
- batch status
- expected/processed players
- chunk count/completion
- reconciliation
- previous/new Clock
- duplicate effects
- omitted players
- retries
- errors
- anomalies
- token refresh events
- timestamp

Token refresh events are orchestration evidence only and are not PLAY economic retries.

## 9. Checkpoints

Do not repeat P1–P296 checkpoints.

EXEC-002 checkpoints:
- P300
- P330
- P360

Record player count, asset count, cash invariant, `last_processed_period`, processed batches, Property Master, reconciliation, Clock, and anomalies.

## 10. Core Invariants

### Cash
`cash_total = cash_available + cash_locked`
and `cash_total >= 0`

### Player
For every resumed period:
`expected = processed = 150`
`missing = 0`
`duplicate_effect = 0`

### Batch
Exactly one effective completed Batch per resumed period.

### Chunk
Exactly 2 expected Chunks per Batch, both COMPLETED.

### Clock
Each resumed period is exactly `P → P+1`.
Final expected Clock = 361.

### Reconciliation
Every resumed period must PASS reconciliation before Clock advancement.

### Property Master
209 Total / 200 NORMAL / 9 INCOMPLETE.

### Idempotency
Repeated trigger/worker invocation must not create a second economic effect.

## 11. Failure Handling

If authentication still fails, a Batch/Chunk fails, a player is omitted, a duplicate effect occurs, reconciliation fails, Clock is anomalous, Property Master mutates, state becomes inconsistent, infrastructure changes, or P297 is ambiguous:

1. Stop at the first determinative failure.
2. Preserve raw evidence.
3. Record IDs and timestamps.
4. Classify the issue.
5. Mark EXEC-002 result.
6. STOP.

Do not automatically repair and rerun.

## 12. EXEC-002 Finality

EXEC-002 is the **last execution authorized for GATE 5**.

There is no EXEC-003.

Prohibited:
- retry until PASS
- restart from P1
- another 360-period run
- extend to P720
- change player count
- change configuration to obtain a PASS
- automatic fix-and-rerun loops

If EXEC-002 fails:
`GATE 5 = BLOCKED` or `PARTIALLY VERIFIED`
then STOP.

Any required correction becomes a separate Change Control item and requires a separately authorized future verification.

## 13. PASS Criteria

GATE 5 may become PASS only if:
- P297–P360 all complete
- no replay of P1–P296
- 64/64 resumed Batches complete
- 128/128 resumed Chunks complete
- 9,600/9,600 expected player-period processing complete
- zero omissions
- zero duplicate economic effects
- Reconciliation PASS for all resumed periods
- no double Clock advance
- final Clock = 361
- all invariants PASS
- Property Master remains 209 / 200 / 9
- no unexplained data discrepancy
- authentication remains valid through execution
- evidence is complete
- no unauthorized code/infrastructure change occurred

## 14. Final Audit

At P360 perform exactly ONE final audit:
- Season status
- current simulation period
- final Clock
- 150 player states
- processing totals
- resumed Batch/Chunk totals
- Reconciliation
- cash invariant
- Property Master
- error/retry ledger
- evidence completeness

Then choose exactly one:
`PASS` / `BLOCKED` / `PARTIALLY VERIFIED` / `NOT VERIFIED`

Immediately STOP. No second final audit.

## 15. Required Records

Create:
1. `PLAY-07.3_GATE5_EXEC002_RESUME_EXECUTION_REPORT.md`
2. `PLAY-07.3_GATE5_EXEC002_RESUME_RAW_EVIDENCE.md`
3. `PLAY-07.3_GATE5_EXEC002_RESUME_ISSUES.md`
4. `PLAY-07.3_GATE5_EXEC002_RESUME_DECISION_RECORD.md`

Optional:
5. `gate5_exec002_evidence.json`

Never overwrite EXEC-001 records.

## 16. Evidence Language

Do not use absolute claims such as `perfect`, `flawless`, `bug-free`, `zero-risk`, or `completely stable under all conditions`.

Use objective language such as `verified under the approved test conditions`, `no anomaly observed in the tested execution`, and `invariant remained satisfied`.

## 17. Anti-Infinite-Verification Rules

1. Scope is fixed at P297–P360.
2. EXEC-002 runs at most once.
3. EXEC-003 is prohibited.
4. Failure does not authorize remediation and rerun.
5. Unexpected results do not expand scope.
6. PASS terminates GATE 5.
7. FAIL/BLOCKED/PARTIALLY VERIFIED/NOT VERIFIED also terminates this execution.
8. Evidence is sufficient when the defined acceptance question is answered.
9. Any new test requires a new explicitly authorized Gate.
10. `Always Proceed` means proceed automatically **within this exact scope**, not continue indefinitely.

## 18. Completion Statement

At termination record:
- Execution ID
- Resume point
- Final period
- Players
- Batches
- Chunks
- Player processing
- Reconciliation
- Clock
- Invariants
- Errors
- Retries
- Issues
- Evidence files
- Final state
- STOP

Final line must be:

`STOP: EXEC-002 terminated. No EXEC-003 is authorized within GATE 5.`

# END OF PLAY-07.3 GATE 5 EXEC-002 RESUME VERIFICATION
