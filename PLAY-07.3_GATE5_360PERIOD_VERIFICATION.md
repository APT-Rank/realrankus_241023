# PLAY-07.3 GATE 5: 360-Period Full Simulation Verification

> **Document Type:** Execution Specification + Evidence Record  
> **Phase:** PLAY-07.3  
> **Gate:** GATE 5  
> **Purpose:** 360-period (30-year) full simulation stability verification  
> **Predecessor:** GATE 4 PASS  
> **Status:** READY FOR EXECUTION  
> **Critical Principle:** Verification must terminate. Passing evidence is sufficient; repeated verification for confidence is prohibited.

---

## 1. Purpose

GATE 5 verifies whether the PLAY economic batch-processing pipeline can sustain a complete 360-period simulated economic life without:

- player-processing omissions or duplicates
- batch/chunk completion failures
- duplicate economic effects
- Season Clock double advancement
- reconciliation failures
- economic-state invariant violations
- unexpected Property Master mutation
- uncontrolled retries or manual intervention
- loss of traceability

GATE 5 is a **long-duration integration verification**, not a request to prove that the system is mathematically or operationally perfect under every possible condition.

### 1.1 Evidence Basis

GATE 4 has already recorded:

- 30/30 periods completed
- 30/30 batches completed
- 60/60 chunks completed
- 150/150 player processing per period
- 0 missing/duplicate player processing
- 30/30 reconciliation passes
- Season Clock 1 → 31
- 0 double advances
- checkpoint invariant validation PASS
- no issues or reruns

These facts are the basis for advancing to GATE 5. Do not rerun GATE 4 merely for confidence.

---

# 2. Scope

## 2.1 Fixed Scope

| Item | Value |
|---|---:|
| Players | 150 |
| Chunk Size | 100 |
| Expected Chunks / Batch | 2 |
| Target Simulation Periods | 360 |
| Starting Period | P=1 |
| Ending Period | P=360 |
| Expected Batch Count | 360 |
| Expected Chunk Count | 720 |
| Checkpoints | P1, P30, P60, P90, P120, P180, P240, P300, P360 |

> If the actual runtime configuration differs, **STOP before execution**. Do not silently adapt the test.

## 2.2 Out of Scope

GATE 5 must NOT:

- modify application code
- modify Firebase/GCP infrastructure
- modify IAM
- create/delete/reconfigure queues
- change Security Rules
- change economic parameters
- change player count
- change chunk size
- add new failure scenarios
- expand to GATE 6
- repeat GATE 4
- perform performance benchmarking beyond the evidence needed for this gate
- introduce new business rules
- introduce AI/ML logic
- alter Property Master
- repair production data during execution

Any discovered defect is recorded and handled through Change Control. It is not silently fixed during GATE 5.

---

# 3. Preflight Gate

Before starting EXEC-001, verify exactly:

### P0-01 Property Master

- total = 209
- NORMAL = 200
- INCOMPLETE = 9
- `PROP_FINAL_1` = NOT FOUND

### P0-02 Infrastructure

- deployed Functions unchanged from approved GATE 4 environment
- Cloud Tasks queues unchanged
- IAM unchanged
- Security Rules unchanged
- PLAY backend remains Server Authority

### P0-03 Code / Version

Record:

- git/source revision if available
- deployed function revision
- rule_version
- scenario_version
- economic parameter version
- execution script version

### P0-04 Starting State

Record:

- Season ID
- current_simulation_period
- season status
- active player count
- Property Master count
- player asset count
- initial reconciliation result

### P0-05 Preflight Decision

Only:

`PASS → EXECUTE`

or

`BLOCKED → STOP`

No automatic remediation is allowed.

---

# 4. Execution ID

Create exactly one primary execution record:

`EXEC-001`

If a legitimate transient rerun is authorized under Section 9, use:

`EXEC-002`

Never overwrite EXEC-001.

---

# 5. Execution Procedure

Run the complete simulation from P=1 through P=360.

For each period:

1. Create economic batch.
2. Dispatch chunks.
3. Process all target players.
4. Aggregate chunks.
5. Run reconciliation.
6. Advance Season Clock exactly once.
7. Record period evidence.
8. Continue to next period only if the acceptance condition is satisfied.

### 5.1 Per-Period Required Evidence

For every period record:

- period
- batch_id
- batch status
- expected player count
- processed player count
- chunk count
- completed chunk count
- reconciliation result
- previous clock period
- new clock period
- duplicate processing count
- omitted processing count
- retry count
- error count
- anomaly count
- execution timestamp

### 5.2 Checkpoint Evidence

At:

P1 / P30 / P60 / P90 / P120 / P180 / P240 / P300 / P360

capture:

- player count
- player state count
- cash invariant
- debt invariant if applicable
- net-worth consistency
- `last_processed_period`
- processed batch information
- Property Master count/status
- reconciliation result
- Season Clock
- anomaly count

Do not create additional checkpoints simply because the system appears unusual. Follow the defined scope.

---

# 6. Core Invariants

The following must remain true.

## INV-01 Cash

`cash_total = cash_available + cash_locked`

and:

`cash_total >= 0`

## INV-02 Player Processing

For each period:

`expected players = processed players`

and:

`missing = 0`

`duplicates = 0`

## INV-03 Batch

Every target period has exactly one effective completed batch.

## INV-04 Chunk

Every batch has the expected chunk count and every chunk reaches COMPLETED.

## INV-05 Clock

For each completed batch:

`P → P+1`

exactly once.

No:

`P → P+2`

No duplicate effective advancement.

## INV-06 Reconciliation

Every completed period must have:

`Reconciliation = PASS`

before the clock advances.

## INV-07 Property Master

Property Master must remain:

`209 total / 200 NORMAL / 9 INCOMPLETE`

unless an explicitly approved test operation says otherwise.

## INV-08 Idempotency

Duplicate task/function execution must not create a second economic effect.

---

# 7. Evidence Collection

Create and preserve these files:

1. `PLAY-07.3_GATE5_360PERIOD_EXECUTION_REPORT.md`
2. `PLAY-07.3_GATE5_360PERIOD_RAW_EVIDENCE.md`
3. `PLAY-07.3_GATE5_360PERIOD_ISSUES.md`
4. `PLAY-07.3_GATE5_360PERIOD_DECISION_RECORD.md`

Optional machine evidence:

- `gate5_evidence.json`
- exported Cloud Logging evidence
- relevant Firestore audit snapshots

### Evidence Rule

Do not invent or summarize away missing evidence.

If evidence is unavailable:

`UNKNOWN`

not `PASS`.

---

# 8. Failure and Anomaly Handling

If any of the following occurs:

- invariant violation
- player omission
- duplicate player effect
- batch failure
- chunk failure
- reconciliation failure
- unexpected clock advancement
- unexpected Property Master mutation
- unexpected data mutation
- security/authentication anomaly
- unexplained state discrepancy

then:

1. Stop the gate at the first determinative failure.
2. Preserve raw evidence.
3. Record exact period and IDs.
4. Record the observed state.
5. Record whether the failure was transient, deterministic, or unknown.
6. Do not automatically retry.
7. Do not modify code or infrastructure.
8. Mark the gate `BLOCKED` or `PARTIALLY VERIFIED`.
9. STOP.

A failure is not permission to enter a repair-and-rerun loop.

---

# 9. Anti-Infinite-Verification Policy

## 9.1 Verification Is a Finite Operation

GATE 5 has one defined question:

> Can the approved PLAY-07.3 pipeline complete 360 consecutive periods under the fixed configuration?

Once sufficient evidence answers that question, the gate terminates.

There is no concept of:

- "verify one more time"
- "increase the sample for confidence"
- "run another 360 periods just to be sure"
- "try a slightly different configuration"
- "repeat because the result was surprisingly good"
- "continue until zero theoretical risk remains"

## 9.2 Execution Budget

Normal execution:

`EXEC-001`

Maximum authorized rerun:

`EXEC-002`

EXEC-002 is permitted **only** when ALL are true:

1. EXEC-001 did not reveal data corruption.
2. The failure is conclusively attributable to a transient external/environmental condition.
3. The cause is documented.
4. No code or infrastructure change is required.
5. Rerun scope is identical.
6. A new execution ID is created.
7. The decision is recorded before rerun.

If these conditions are not all satisfied:

`STOP`

No EXEC-003 exists under GATE 5.

## 9.3 No Remediation Loop

The following pattern is prohibited:

`FAIL → FIX → RERUN → FAIL → FIX → RERUN ...`

If a code, infrastructure, data-model, or configuration change is necessary:

`STOP GATE 5 → create Change Record → implement separately → regression verification → request a new gate execution`

Do not modify the approved environment inside this gate.

## 9.4 No Scope Expansion

The following are prohibited without a new explicit gate:

- 360 → 720 periods
- 150 → 300 players
- chunk 100 → another size
- additional concurrency tests
- additional failure injection
- additional economic scenarios
- additional regions
- new property datasets
- new infrastructure
- new performance thresholds

A surprising result does not expand authorization.

## 9.5 System Retry ≠ Test Rerun

Normal Cloud Tasks / worker retries that are part of the already-approved production mechanism are not themselves a new GATE execution.

However, every retry must remain observable in the execution evidence.

## 9.6 PASS Is Terminal

If all acceptance criteria in Section 10 are satisfied:

`GATE 5 = PASS`

Then:

`STOP`

Do not rerun GATE 5.

Do not automatically begin GATE 6.

## 9.7 FAIL / BLOCKED Is Also Terminal

If the gate cannot establish PASS:

`GATE 5 = BLOCKED` or `PARTIALLY VERIFIED`

Then:

`STOP`

Do not repeatedly execute tests to force a PASS.

---

# 10. GATE 5 Acceptance Criteria

GATE 5 may be marked PASS only when ALL are true:

- 360/360 periods completed
- 360/360 batches completed
- 720/720 chunks completed
- every period processed exactly 150 players
- zero player omissions
- zero duplicate economic effects
- 360/360 reconciliation PASS
- Season Clock advanced exactly once per period
- final Clock state matches expected terminal period
- no unexpected Property Master mutation
- all core invariants PASS
- no unexplained data discrepancy
- complete evidence records exist
- no manual intervention was required for economic processing
- execution remained within approved scope
- no unauthorized code/infrastructure changes occurred

If any criterion is `UNKNOWN`, GATE 5 is not PASS.

---

# 11. Final Audit

At P=360, perform one final audit only.

Verify:

- final Season status
- final simulation period
- player state count
- player processing count
- final cash invariant
- final reconciliation
- Property Master
- batch/chunk totals
- anomaly/error/retry ledger
- evidence completeness

Then finalize:

`PASS / BLOCKED / PARTIALLY VERIFIED`

There is no second final audit.

---

# 12. Documentation Requirements

The final record must preserve:

### Why

Why GATE 5 was authorized.

### What

Exact scope and configuration.

### How

Exact execution procedure.

### Evidence

Raw and summarized evidence.

### Result

Objective acceptance result.

### Issues

Every anomaly, including transient events.

### Decision

Why the gate ended.

### Next Scope

The next gate, if any, must be explicitly stated.

The record must not be rewritten to hide failed or inconclusive attempts.

---

# 13. Terminal State

GATE 5 has exactly four terminal outcomes:

| State | Meaning | Next Action |
|---|---|---|
| PASS | All acceptance criteria satisfied | STOP; await separate GATE 6 authorization |
| BLOCKED | Execution could not validly complete | STOP |
| PARTIALLY VERIFIED | Some criteria verified, full acceptance unavailable | STOP |
| NOT VERIFIED | Evidence insufficient | STOP |

**Every state is terminal for this execution.**

---

# 14. AG Autonomous Decision Matrix

| Situation | AG Action |
|---|---|
| Preflight PASS | Execute GATE 5 |
| Preflight FAIL | STOP |
| Period processing normal | Continue |
| Normal infrastructure retry | Record and continue |
| Deterministic invariant failure | STOP |
| Data discrepancy | STOP |
| Unauthorized change detected | STOP |
| Transient external failure | Record; one authorized rerun maximum |
| EXEC-001 transient failure | Evaluate EXEC-002 eligibility |
| EXEC-002 failure | STOP |
| All 360 periods PASS | Mark GATE 5 PASS and STOP |
| PASS with unexpected extra evidence | Do not rerun; STOP |
| PASS with desire for more confidence | Do not rerun; STOP |
| Any request to expand scope | STOP and require new gate |

---

# 15. Explicit Prohibition

AG must not interpret:

- `Always Proceed`
- autonomous execution
- automatic approval
- test automation
- evidence collection

as authorization for indefinite testing.

**Always Proceed means: proceed automatically within the exact approved scope.**

It does not mean:

> continue testing until the agent personally feels confident.

The human-approved gate boundary is the authority.

---

# 16. Completion Statement

At completion, AG must produce a concise result containing:

1. Execution ID
2. Start/end period
3. Players
4. Batch/chunk totals
5. Reconciliation totals
6. Clock progression
7. invariant result
8. issues/retries
9. evidence files
10. final gate state
11. explicit STOP confirmation

No recommendation to run additional verification may be appended to a PASS result.

---

## END OF PLAY-07.3 GATE 5
