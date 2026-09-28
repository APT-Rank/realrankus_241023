# PLAY-07.3 GATE 6: Integrated System Final Audit & Regression Verification

> **Document Type:** Final Integrated Verification Specification + Evidence Record  
> **Phase:** PLAY-07.3  
> **Gate:** GATE 6  
> **Predecessors:** GATE 3 PASS / GATE 4 PASS / GATE 5 PASS  
> **Purpose:** Verify that the separately verified PLAY components remain coherent as one integrated system and that prior verified functionality has not been damaged by later work.  
> **Status:** READY FOR EXECUTION  
> **Critical Principle:** GATE 6 is a finite final audit. It is not another long-duration simulation and must not become an open-ended verification program.

---

# 1. Purpose

GATE 6 answers one question:

> **Do the components verified through PLAY-07.3 operate together as one coherent, traceable, recoverable PLAY system without regression in previously verified functionality?**

GATE 5 already established long-duration economic batch continuity through P360.

GATE 6 therefore MUST NOT repeat the 360-period simulation merely for confidence.

Instead, GATE 6 verifies the integrated boundaries between:

- Season
- Player
- Player State / Asset
- Economic Batch
- Batch Chunk
- Player Worker
- Aggregator
- Reconciliation
- Season Clock
- Property Master
- Property Market
- Transaction / Idempotency
- Decision Log
- Security / Server Authority
- Observability / Auditability
- Recovery controls

---

# 2. Evidence Basis

The following prior results are treated as completed evidence and are not re-run unless a regression test explicitly requires the minimum operation.

## GATE 3

Previously verified:

- duplicate execution handling
- concurrent worker behavior
- crash before commit
- crash after commit
- mid-chunk recovery
- duplicate aggregator execution
- duplicate Season Clock execution
- reconciliation failure handling
- transaction pause behavior

## GATE 4

Previously verified:

- 30 consecutive periods
- 30/30 Batch
- 60/60 Chunk
- 150 players per period
- no omission / duplicate processing
- 30/30 reconciliation
- Season Clock 1 → 31
- checkpoint invariants

## GATE 5

EXEC-001:
- P1–P296 completed
- stopped at P297 because the external test client's Firebase ID Token expired

EXEC-002:
- P297–P360 completed
- 64/64 Batch
- 128/128 Chunk
- 9,600 player-period processing
- Reconciliation 64/64
- Clock 297 → 361
- token refresh handled by external test runner
- no data anomaly reported

Combined:
- P1–P360 completed continuously
- GATE 5 PASS

**Do not rerun GATE 4 or GATE 5.**

---

# 3. Scope

GATE 6 has exactly six verification groups.

| Group | Objective |
|---|---|
| G6-A | Environment / deployment integrity |
| G6-B | End-to-end lifecycle regression |
| G6-C | Cross-component state integrity |
| G6-D | Security / Server Authority regression |
| G6-E | Failure / recovery control regression |
| G6-F | Final audit / evidence completeness |

---

# 4. Explicit Out of Scope

GATE 6 must NOT:

- rerun 360 periods
- rerun GATE 4
- rerun GATE 5
- increase player count
- change chunk size
- introduce a new economic scenario
- modify economic parameters
- modify Property Master
- add new properties
- redesign architecture
- migrate framework
- introduce AI/ML
- implement loans/LTV/DSR/tax/rent/jeonse unless already part of the approved implementation under test
- redesign the Property Market
- change Cloud Tasks architecture
- change IAM
- change Security Rules
- optimize performance without a demonstrated defect
- perform speculative load testing
- create a new test because an existing result "feels insufficient"

If a new requirement is discovered, record it as a future scope item. Do not expand GATE 6.

---

# 5. Preflight

Before execution record:

## P0-01 Deployment

- deployed Function revisions
- source revision / commit if available
- rule_version
- scenario_version
- economic parameter version

Compare with the approved GATE 5 environment.

Unexpected deployment change:

`BLOCKED → STOP`

## P0-02 Property Master

Expected:

- Total = 209
- NORMAL = 200
- INCOMPLETE = 9
- `PROP_FINAL_1` = NOT FOUND

Mismatch:

`BLOCKED → STOP`

## P0-03 Core Infrastructure

Record:

- Cloud Tasks queues
- Function list
- IAM state
- Security Rules state
- Firestore collections
- monitoring/logging availability

No configuration changes are permitted during GATE 6.

## P0-04 Baseline

Record:

- Season state
- Player count
- Player Asset count
- Property Master count
- relevant batch/chunk counts
- reconciliation state
- current simulation period
- system health

---

# 6. G6-A — Environment / Deployment Integrity

Verify that the deployed system corresponds to the approved implementation.

Check:

1. Function inventory
2. Function revisions
3. Region
4. Cloud Tasks queues
5. Service account / IAM
6. Security Rules
7. Firestore collection structure
8. logging availability

Acceptance:

- no unauthorized changes
- all required components present
- no missing production dependency

No remediation during this group.

---

# 7. G6-B — End-to-End Lifecycle Regression

Execute ONE controlled minimal lifecycle.

The lifecycle must cover, where implemented:

```text
Season
  ↓
Player Join / Initialization
  ↓
Player State
  ↓
Economic Batch
  ↓
Chunk Dispatch
  ↓
Player Processing
  ↓
Chunk Aggregation
  ↓
Reconciliation
  ↓
Season Clock
  ↓
Decision Log
```

Use a small controlled test population sufficient to exercise the complete path.

The exact player count should be the minimum already supported by the implementation and existing test harness.

Do not increase the test size merely for confidence.

Acceptance:

- every intended transition occurs
- no state transition is skipped
- no duplicate economic effect
- Decision Log is produced according to the approved rule
- reconciliation passes
- Clock advances exactly once

---

# 8. G6-C — Cross-Component State Integrity

Verify the relationship between authoritative state stores.

At minimum inspect:

### Player

- PLAY_PLAYER
- PLAY_PLAYER_ASSET / STATE

### Economic

- PLAY_BATCH
- PLAY_BATCH_CHUNK
- economic state
- Decision Log

### Season

- PLAY_SEASON
- simulation period
- season status

### Property

- Property Master
- Property ownership/state if exercised by the lifecycle

Verify:

- references point to valid entities
- no orphaned player state
- no orphaned batch/chunk state
- period alignment is consistent
- player `last_processed_period` matches executed period
- Batch and Chunk period match
- Season Clock agrees with completed Batch
- reconciliation result agrees with authoritative state

Acceptance:

`0 unexplained inconsistencies`

---

# 9. G6-D — Security / Server Authority Regression

Verify:

## Client

Direct PLAY write attempts remain denied.

## Authorized Server

Authorized backend operations continue to work.

## Authentication

Unauthenticated request:

`401`

Wrong service identity / unauthorized internal request:

`403`

Authorized request:

`200` or the approved successful response.

## Server Authority

Client cannot directly mutate:

- Player economic state
- Player Asset
- Batch
- Chunk
- Season Clock
- Property ownership
- transaction state

Acceptance:

- unauthorized mutation = blocked
- authorized operation = successful
- no security bypass observed

Do not weaken Security Rules to make a test pass.

---

# 10. G6-E — Failure / Recovery Control Regression

Do NOT recreate the entire GATE 3 test suite.

Run only the minimum regression set necessary to prove that later changes did not damage the previously verified recovery controls.

Required scenarios:

### R1 Duplicate Economic Execution

Same economic processing request executed twice.

Expected:

- one effective economic state change
- duplicate absorbed by idempotency

### R2 Worker Crash Before Commit

Expected:

- no partial committed economic effect
- retry can safely complete

### R3 Duplicate Aggregation

Expected:

- Batch completion occurs once
- no duplicate downstream effect

### R4 Duplicate Season Clock

Expected:

- one effective Clock transition
- no P → P+2

### R5 Reconciliation Failure

Inject only the previously approved invariant fault.

Expected:

- reconciliation detects fault
- transaction processing is paused according to approved behavior
- Clock does not advance

These five scenarios are regression checks, not a new failure-testing program.

---

# 11. G6-F — Final Audit & Evidence Completeness

At the end perform exactly ONE final audit.

Verify:

- G6-A result
- G6-B result
- G6-C result
- G6-D result
- G6-E result
- Property Master
- deployment state
- Security state
- Season state
- Player state
- economic state
- logs
- Decision Logs
- reconciliation
- evidence files

Then determine the final GATE 6 state.

---

# 12. Core Final Invariants

At the point of final audit:

### Cash

`cash_total = cash_available + cash_locked`

### Cash Non-Negative

`cash_total >= 0`

### Period Alignment

Player / Batch / Chunk / Season period references are consistent.

### Clock

No duplicate effective advancement.

### Idempotency

Repeated authorized processing produces no duplicate economic effect.

### Property Master

`209 / 200 NORMAL / 9 INCOMPLETE`

### Security

Unauthorized client mutation remains blocked.

### Traceability

Every tested state change has sufficient identifiers to determine:

- Season
- Period
- Batch
- Chunk
- Player
- Request / Task
- rule_version
- scenario_version

---

# 13. Failure Handling

If any determinative failure occurs:

1. Stop the affected test group.
2. Preserve raw evidence.
3. Record exact IDs and timestamps.
4. Classify:
   - deterministic defect
   - transient infrastructure issue
   - test harness issue
   - data issue
   - unknown
5. Mark the GATE state.
6. STOP.

Do not automatically modify the system.

Do not repeat the failed test until it passes.

---

# 14. Anti-Infinite-Verification Policy

This section is mandatory.

## 14.1 Fixed Test Budget

Each G6 group has:

- one normal execution

A single rerun is permitted only when the failure is conclusively attributable to a transient external environment/test-harness condition and no data corruption occurred.

Maximum:

`1 normal + 1 transient rerun`

No third execution.

## 14.2 No PASS Chasing

Never:

`FAIL → FIX → RERUN → FAIL → FIX → RERUN`

If a system change is required:

`STOP → Change Control → separate implementation → regression → new authorization`

## 14.3 No Confidence Reruns

If a test PASSes:

- do not rerun
- do not increase sample size
- do not extend duration
- do not add concurrency
- do not create another equivalent test

## 14.4 No Scope Expansion

Unexpected behavior does not authorize:

- another 360-period simulation
- more players
- new regions
- new scenarios
- new economic parameters
- new failure scenarios

Record the item as future work.

## 14.5 PASS Is Terminal

If all GATE 6 acceptance criteria pass:

`GATE 6 = PASS`

Then:

`STOP`

Do not automatically begin PLAY-07.4 or another phase.

## 14.6 BLOCKED Is Terminal

If GATE 6 cannot establish PASS:

`BLOCKED / PARTIALLY VERIFIED / NOT VERIFIED`

Then:

`STOP`

## 14.7 Evidence Sufficiency

Once sufficient evidence exists to determine the result, stop.

The objective is not to eliminate all theoretical risk.

---

# 15. GATE 6 Acceptance Criteria

GATE 6 = PASS only if:

- deployment integrity PASS
- lifecycle regression PASS
- cross-component integrity PASS
- security / Server Authority PASS
- five required recovery regressions PASS
- Property Master unchanged
- no unexplained data inconsistency
- no unauthorized infrastructure/code change
- evidence complete
- all final invariants PASS

If any criterion is `UNKNOWN`, GATE 6 is not PASS.

---

# 16. Required Evidence Files

Create:

1. `PLAY-07.3_GATE6_FINAL_AUDIT_EXECUTION_REPORT.md`
2. `PLAY-07.3_GATE6_FINAL_AUDIT_RAW_EVIDENCE.md`
3. `PLAY-07.3_GATE6_FINAL_AUDIT_ISSUES.md`
4. `PLAY-07.3_GATE6_FINAL_AUDIT_DECISION_RECORD.md`

Optional machine evidence:

5. `gate6_evidence.json`

Never overwrite GATE 3/4/5 evidence.

---

# 17. Documentation / Whitepaper Record

GATE 6 must preserve enough evidence to support future:

- PLAY technical manual
- PLAY operations manual
- PLAY reliability manual
- PLAY architecture document
- PLAY whitepaper
- Season methodology document

The evidence record must distinguish:

### Verified

Directly observed in the executed test.

### Previously Verified

Established in GATE 3/4/5 and not rerun in GATE 6.

### Not Tested

Outside the approved GATE 6 scope.

### Future Scope

Known but intentionally deferred.

Do not represent "Previously Verified" or "Not Tested" as if it were newly verified.

---

# 18. Final Decision

Use exactly one:

`PASS`

`BLOCKED`

`PARTIALLY VERIFIED`

`NOT VERIFIED`

Every state is terminal.

---

# 19. Final Stop Statement

The final execution report must end with:

`STOP: GATE 6 terminated within the approved scope. No automatic next gate is authorized.`

---

# END OF PLAY-07.3 GATE 6
