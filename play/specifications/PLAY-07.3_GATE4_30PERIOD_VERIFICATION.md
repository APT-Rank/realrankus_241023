# PLAY-07.3 GATE 4 — 30-PERIOD STABILITY VERIFICATION & EVIDENCE RECORD

## Document Metadata
| Field | Value |
|---|---|
| Document ID | PLAY-07.3-G4-30PERIOD-VERIFICATION |
| Phase | PLAY-07.3 |
| Gate | GATE 4 |
| Scope | 30 simulated periods |
| Environment | Production-equivalent Firebase/GCP |
| Status | EXECUTION PENDING |
| Prior Gate | GATE 3 PASS |
| Next Gate | GATE 5 — 360-Period Full Simulation |

---

# 0. Purpose

This document is both the **execution specification** and the **permanent evidence-record template**.

PLAY development must preserve not only the final implementation, but also the instructions, conditions, evidence, failures, fixes, decisions, and acceptance history that produced it.

These records will later support:

- PLAY Technical Manual
- PLAY Operations Manual
- PLAY QA / Verification Manual
- Architecture Documentation
- Whitepaper
- Research / Methodology Documentation

**A verification is not complete until its execution record is preserved.**

---

# 1. Record-First Principle

Use this sequence:

```text
Specification
→ Instruction
→ Execution
→ Raw Evidence
→ Result
→ Review
→ Acceptance
→ Archive
```

Never reconstruct the record retrospectively.

---

# 2. Required Artifacts

After execution, create all of the following:

```text
PLAY-07.3_GATE4_30PERIOD_VERIFICATION.md
PLAY-07.3_GATE4_30PERIOD_EXECUTION_REPORT.md
PLAY-07.3_GATE4_30PERIOD_RAW_EVIDENCE.md
PLAY-07.3_GATE4_30PERIOD_ISSUES.md
PLAY-07.3_GATE4_30PERIOD_DECISION_RECORD.md
```

If something is genuinely not applicable, record:

```text
N/A — reason
```

Do not silently omit it.

---

# 3. Provenance

Record:

- instruction document ID/version/date
- executing agent
- execution start/end time
- GCP project
- region
- Season ID
- scenario ID/version
- rule version
- random seed
- deployed Function revisions
- Cloud Tasks queues
- Player count
- chunk size
- Property Master version/snapshot
- source/Git revision if available

The future question must be answerable:

> Exactly what system, data, rules, and instruction produced this result?

---

# 4. Immutability

Once execution begins:

- do not edit expected values to match actual values
- do not remove failed tests
- do not overwrite failed evidence with successful evidence
- do not modify the instruction document

If a second execution is required, create a new execution ID.

Example:

```text
EXEC-001
EXEC-002
```

Both records remain archived.

---

# 5. Prior Baseline

GATE 3 was accepted after actual duplicate execution testing.

GATE 3 covered:

- Duplicate Task
- Concurrent Worker
- Crash Before Commit
- Crash After Commit
- Mid-Chunk Crash
- Aggregator Duplicate
- Clock Duplicate
- Reconciliation Failure

GATE 4 does not re-run those scenarios.

Its purpose is **longitudinal stability over 30 consecutive periods**.

---

# 6. Pre-Flight

## Property Master

Expected:

```text
Total = 209
NORMAL = 200
INCOMPLETE = 9
PROP_FINAL_1 = NOT FOUND
```

Record:

| Item | Expected | Actual | Result |
|---|---:|---:|---|
| Property Master total | 209 | | |
| NORMAL | 200 | | |
| INCOMPLETE | 9 | | |
| PROP_FINAL_1 | NOT FOUND | | |

If any fails, do not start execution.

## Infrastructure Snapshot

Record:

- Functions and revisions
- Region
- Cloud Tasks queues/targets
- deployment timestamps
- source revision/commit if available
- relevant configuration
- Security Rules status
- Firestore region
- BigQuery configuration if relevant

No infrastructure change is allowed during this execution.

---

# 7. Test Season

Use a dedicated E2E Season.

Record:

```text
season_id:
scenario_id:
scenario_version:
rule_version:
random_seed:
player_count:
chunk_size:
```

Do not modify an existing verified production Season.

---

# 8. Player Baseline

Recommended:

```text
Players = 150
Chunk Size = 100
Expected Chunks per Batch = 2
```

Record the exact Player-set identifier or deterministic Player IDs.

The Player population must remain stable throughout the test.

Unexpected membership change = STOP.

---

# 9. 30-Period Execution

Execute:

```text
Period 1
→ Period 2
→ ...
→ Period 30
```

Every period must run:

```text
Batch Creation
→ Chunk Dispatch
→ Player Processing
→ Chunk Completion
→ Batch Aggregation
→ Reconciliation
→ Season Clock
```

Do not advance the period by directly modifying the database.

---

# 10. Period Evidence

Mandatory table:

| Period | Batch ID | Expected Players | Processed | Missing | Duplicate | Chunks | Batch | Reconciliation | Clock Before | Clock After | Errors | Retries |
|---:|---|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---:|
| 1 | | 150 | | | | 2 | | | | | | |
| 2 | | 150 | | | | 2 | | | | | | |
| ... | | | | | | | | | | | | |
| 30 | | 150 | | | | 2 | | | | | | |

This table is mandatory.

---

# 11. Player Processing Audit

Theoretical processing count:

```text
150 players × 30 periods = 4,500 player-period processing events
```

Record:

```text
expected:
actual:
missing:
duplicate:
```

Decision Log expectation must be derived from the actual logging rule, not guessed.

---

# 12. Player State Audit

At minimum record:

- player_id
- last_processed_period
- processed_batches
- cash_total
- cash_available
- locked_cash
- debt
- property_count
- net_worth

Snapshots are mandatory at:

```text
Period 1
Period 5
Period 10
Period 15
Period 20
Period 25
Period 30
```

Do not record only the final state.

---

# 13. Economic Invariants

At every checkpoint verify applicable invariants.

At minimum:

```text
cash_total = cash_available + locked_cash
cash values are not negative unless explicitly permitted
last_processed_period is monotonic
processed_batches contains no unexpected duplicates
net_worth is internally consistent
```

Record:

```text
PASS / FAIL / N/A
```

with evidence.

---

# 14. Batch Audit

Expected:

```text
30 economic batches
30 completed
0 missing
0 duplicate completion
```

Record:

- batch_id
- simulation_period
- batch_type
- status
- expected_player_count
- chunk_count
- completed chunks
- failed chunks
- retry count
- aggregation result

---

# 15. Chunk Audit

For every batch record:

- chunk_id
- chunk_index
- target_players count
- processed_count
- failed_count
- status
- retry count
- execution timestamps

Verify that `target_players` remains the immutable membership basis.

---

# 16. Reconciliation Audit

Expected:

```text
30 Reconciliation PASS
0 unexpected FAIL
```

For every period record:

- reconciliation execution
- result
- anomaly count
- transaction status
- season status
- relevant logs

Unexpected Reconciliation failure = STOP.

---

# 17. Season Clock Audit

Expected:

```text
Initial period = 1
Final period = 31
Successful increments = 30
Double increments = 0
Missing increments = 0
```

Record every transition:

```text
P1 → P2
P2 → P3
...
P30 → P31
```

---

# 18. Error / Retry Ledger

Every error and retry must be recorded.

| Time | Period | Component | Error/Retry | Request/Task ID | Cause | Recovery | Economic Effect | Result |
|---|---:|---|---|---|---|---|---|---|

A retry is not automatically a failure. Verify whether it caused duplicate economic effect.

---

# 19. Raw Evidence

Preserve, where available:

- Function execution IDs
- Cloud Task names/metadata
- Firestore before/after references
- Decision Log IDs
- request IDs
- idempotency keys
- reconciliation logs
- clock transition logs
- error logs
- retry logs
- timestamps

If raw evidence cannot be embedded, record its exact retrieval location/reference.

---

# 20. Checkpoints

Mandatory:

```text
Period 5
Period 10
Period 15
Period 20
Period 25
Period 30
```

At each checkpoint record:

- current period
- completed batches
- expected/actual player processing
- Decision Log count
- Reconciliation
- Clock
- errors
- retries
- anomalies
- invariant results

---

# 21. Failure Stop Conditions

Immediately stop if any occurs:

- player omission
- player duplication
- batch omission
- batch duplication
- chunk omission
- chunk duplication
- Decision Log omission
- Decision Log duplication
- duplicate economic effect
- Reconciliation failure
- clock double advance
- clock missing
- impossible financial state
- Property Master mutation
- unexpected database write/delete
- unexpected infrastructure change
- root cause UNKNOWN

Do not repair during the test.

---

# 22. Change Control

If a defect is discovered, do not fix it inside this execution.

Create an issue record:

```text
Issue ID
Severity
Detection Period
Detection Component
Reproduction
Raw Evidence
Root Cause
Impact
Proposed Fix
Rollback Consideration
Regression Scope
```

Then STOP.

A fix requires a separate change record and a new execution record.

---

# 23. Test Budget

Normal execution:

```text
Maximum = 1
```

Do not repeatedly restart a failed 30-period run.

If a transient infrastructure failure is conclusively identified, record:

- why it was transient
- evidence
- whether data integrity remained intact
- reason a rerun is justified

A rerun receives a new execution ID.

---

# 24. Final Audit

Only after Period 30 completes successfully:

## Season

```text
Initial period:
Final period:
Expected increments:
Actual increments:
```

## Batch

```text
Expected:
Actual:
Missing:
Duplicate:
```

## Chunk

```text
Expected:
Completed:
Failed:
Retried:
```

## Player Processing

```text
Expected:
Actual:
Missing:
Duplicate:
```

## Decision Log

```text
Expected:
Actual:
Missing:
Duplicate:
Orphan:
```

## Reconciliation

```text
Expected PASS:
Actual PASS:
Unexpected FAIL:
```

## Clock

```text
Expected final:
Actual final:
Double advance:
Missing advance:
```

---

# 25. GATE 4 Acceptance

GATE 4 = PASS only if:

- all 30 periods complete
- all expected batches complete
- all expected chunks complete
- all players processed without omission/duplication
- Reconciliation passes every period
- Clock advances exactly once per period
- economic double effect = 0
- invariant violations = 0
- unexpected Property Master changes = 0
- unexplained database mutations = 0
- evidence is sufficient for later reconstruction
- all required records are complete

Otherwise use:

```text
PARTIALLY VERIFIED
```

or

```text
BLOCKED
```

---

# 26. Required Output Files

Create:

### 1. Execution Report
`PLAY-07.3_GATE4_30PERIOD_EXECUTION_REPORT.md`

Sections:

1. Executive Summary
2. Execution Metadata
3. Environment Snapshot
4. Test Season / Player Set
5. Period 1–30 Results
6. Player Processing Audit
7. Batch Audit
8. Chunk Audit
9. Reconciliation Audit
10. Season Clock Audit
11. Economic Invariants
12. Error / Retry Ledger
13. Checkpoint Results
14. Unexpected Changes
15. Issues
16. Evidence Index
17. Final Acceptance
18. GATE 4 Status

### 2. Raw Evidence
`PLAY-07.3_GATE4_30PERIOD_RAW_EVIDENCE.md`

Map:

```text
Test
→ Period
→ Batch
→ Chunk
→ Player
→ Function
→ Task
→ Log
→ Decision Log
→ Reconciliation
→ Clock
```

### 3. Issues
`PLAY-07.3_GATE4_30PERIOD_ISSUES.md`

If none:

```text
NO ISSUES FOUND
```

### 4. Decision Record
`PLAY-07.3_GATE4_30PERIOD_DECISION_RECORD.md`

Record:

- why GATE 4 started
- what was tested
- assumptions
- deviations
- results
- lessons
- acceptance decision
- next approved scope

---

# 27. Future Documentation Use

These records are source material for:

- PLAY Technical Manual
- PLAY Operations Manual
- PLAY QA Manual
- PLAY Architecture Document
- PLAY Whitepaper
- PLAY Research Methodology
- Reliability / Failure Handling Documentation
- Season Verification History

A future engineer who was not present must be able to reconstruct:

1. What we intended to test
2. What environment was tested
3. What data/rules were used
4. What actually happened
5. What evidence proves it
6. What problems occurred
7. What decisions were made
8. Why the Gate was accepted or rejected

---



---

# 33. AUTONOMOUS EXECUTION / ANTI-INFINITE-VERIFICATION POLICY

## 33.1 Execution Approval Model

The AG environment is configured as:

```text
Auto Execution = Always Proceed
Review Policy = Always Proceed
```

Therefore, the AG must assume that **tool/CLI execution does not require interactive human approval**.

However:

> **Always Proceed means automatic execution of an already-approved scope. It does NOT mean automatic expansion of scope.**

The boundaries in this document are the execution authority.

The AG must never interpret successful execution as permission to create additional tests, repeat tests indefinitely, modify the test scope, or proceed to the next Gate.

---

## 33.2 Scope Is a Hard Boundary

For this execution:

```text
AUTHORIZED SCOPE = GATE 4 / 30 PERIODS
```

The following are NOT authorized by the Always Proceed setting:

- additional test cases not specified in this document
- additional E2E cycles
- repeated executions after PASS
- repeated executions after FAIL without a new Execution ID
- exploratory tests
- stress tests
- load tests
- additional failure injection
- architecture experiments
- alternative implementation experiments
- GATE 5
- GATE 6
- 360-period simulation
- full regression
- deterministic replay

If the AG believes additional testing would be useful:

> Record it as `FOLLOW-UP RECOMMENDATION` and STOP.

Do not execute it.

---

## 33.3 PASS = TERMINAL STATE

For each required test, once the acceptance criteria are satisfied:

```text
TEST = PASS
```

is a **terminal state**.

Do not:

- rerun to obtain more confidence
- run the same test with different timing
- increase player count
- increase concurrency
- increase periods
- introduce additional random seeds
- repeat the same test for statistical comfort
- search for a hypothetical failure after PASS

Additional validation belongs to a separately authorized execution.

---

## 33.4 FAIL = Diagnosis, Not Infinite Retry

When a required test fails:

```text
FAIL
```

does NOT mean:

```text
retry until PASS
```

Instead:

```text
FAIL
→ capture evidence
→ classify failure
→ determine whether root cause is known
→ create Issue
→ STOP
```

A failed test may be rerun only when **all** of the following are true:

1. The failure is conclusively classified as transient infrastructure/environment failure.
2. No code defect, data defect, architecture defect, or test-design defect is suspected.
3. No state corruption occurred.
4. The reason for rerun is recorded.
5. A new Execution ID is assigned.
6. The rerun remains inside the original authorized scope.

Maximum:

```text
Original execution = 1
Approved transient rerun = 1
Total executions per Gate = 2 maximum
```

No third execution is permitted.

---

## 33.5 No "One More Test"

The AG must not use reasoning such as:

- "Let's run one more test just to be sure."
- "Let's increase the sample size."
- "Let's repeat the test."
- "Let's try another timing."
- "Let's verify this one more time."
- "Let's run the entire suite again."
- "Let's check whether the result is statistically stable."

These are **scope expansion**.

Instead record:

```text
FOLLOW-UP RECOMMENDATION:
<description>
```

and STOP.

---

## 33.6 No Automatic Escalation

The AG must never automatically escalate:

```text
1 Period
→ 3 Period
→ 30 Period
→ 360 Period
```

unless the current document explicitly authorizes the next step.

For this document:

```text
30 Period = terminal scope
```

After Period 30 and final evidence generation:

```text
STOP
```

Even if every test passes.

---

## 33.7 No Automatic Remediation Loop

The following loop is prohibited:

```text
Test
→ Fail
→ Modify code
→ Deploy
→ Test
→ Fail
→ Modify code
→ Deploy
→ ...
```

Also prohibited:

```text
Test
→ Fail
→ Modify infrastructure
→ Test
→ Fail
→ Modify infrastructure
→ ...
```

If remediation appears necessary:

```text
Issue
→ Root Cause
→ Proposed Fix
→ STOP
```

A fix requires a new approved change record and a new execution record.

---

## 33.8 No Hidden Scope Through "Verification"

The following are also considered scope expansion even if described as verification:

- checking unrelated Functions
- checking unrelated queues
- adding unrelated assertions
- testing unrelated failure modes
- testing unrelated data sets
- creating additional Property Master records
- creating additional test seasons
- increasing the Player population
- changing chunk size
- changing scenario/rule version
- changing random seed
- running a second full E2E
- replaying previous Gates

Only the items explicitly required by this document are authorized.

---

## 33.9 Test Count Budget

Before execution begins, the AG must calculate and record the maximum authorized execution budget.

For GATE 4:

```text
Periods = 30
Required normal execution = 1
Maximum transient rerun = 1
Maximum total executions = 2
```

The following are not additional execution budget:

- log inspection
- evidence collection
- report generation
- read-only state verification required by this document

But a new execution of the simulation is an execution and counts against the budget.

---

## 33.10 Time Budget

The AG must also use a reasonable execution time boundary.

Before starting, estimate:

```text
Expected execution duration:
Hard timeout:
```

If the run exceeds the expected duration materially:

1. Do not automatically increase the timeout.
2. Do not automatically retry.
3. Inspect current execution state.
4. Determine whether the system is progressing.
5. If progress cannot be established, STOP and report `TIMEOUT / UNKNOWN STATE`.

A timeout is not permission to increase the timeout indefinitely.

---

## 33.11 Stalled Execution Policy

If the simulation appears stalled:

```text
NO PROGRESS
```

means:

- no period advancement
- no Batch state transition
- no Chunk progress
- no Player processing progress
- no relevant Function execution
- no relevant Cloud Task progress

for a predefined observation window.

Record:

```text
last successful period
last successful batch
last successful task
last successful state transition
last log timestamp
```

Then STOP.

Do not repeatedly poll forever.

---

## 33.12 Retry Budget

Automatic retries performed by the production system are part of the system under test and may occur normally.

However, the AG must distinguish:

### System Retry

```text
Cloud Task / Function internal retry
```

from:

### Test Rerun

```text
AG starts the test again
```

System retries are observed and recorded.

Test reruns are budgeted and limited by this document.

The AG must never confuse the two.

---

## 33.13 Evidence Sufficiency Rule

Once sufficient evidence exists to determine the result, stop testing.

For PASS:

```text
Acceptance criteria satisfied
+
required evidence captured
=
TEST COMPLETE
```

For FAIL:

```text
Failure reproduced/observed
+
required evidence captured
=
TEST COMPLETE
```

Do not keep executing after the conclusion is already supported by sufficient evidence.

---

## 33.14 Contradictory Evidence Rule

If logs, Firestore state, Cloud Tasks state, and reported results disagree:

```text
STOP
```

Do not run additional tests to "resolve" the contradiction.

Create:

```text
EVIDENCE CONFLICT
```

and record:

- conflicting sources
- timestamps
- IDs
- observed values
- suspected cause
- required follow-up

Human review is required before further execution.

---

## 33.15 Unexpected Success Is Not Permission

If the system completes faster, with fewer retries, or with more successful behavior than expected:

```text
DO NOT EXPAND TESTING
```

Record the result.

Do not increase:

- Player count
- period count
- concurrency
- scenario count
- random seeds
- test repetitions

for additional confidence.

---

## 33.16 Unexpected Failure Is Not Permission

If an unexpected failure occurs:

```text
DO NOT EXPAND TESTING
```

Do not:

- create exploratory tests
- search for a second reproduction
- repeatedly rerun
- modify code
- modify infrastructure

Capture the first sufficient evidence and STOP.

---

## 33.17 Automatic Documentation Is Allowed

Because Auto Execution and Review Policy are Always Proceed, the AG **is authorized to automatically create the required documentation artifacts** specified in this document.

This includes:

```text
Execution Report
Raw Evidence
Issues
Decision Record
```

Documentation generation does not constitute scope expansion.

However, the AG must not invent evidence that was not actually observed.

---

## 33.18 Final Terminal Condition

The GATE 4 execution is permanently terminal when one of the following occurs:

### PASS

```text
30 periods complete
+
all acceptance criteria satisfied
+
evidence complete
+
required records created
```

### BLOCKED

```text
blocking failure
+
evidence captured
+
issue recorded
```

### PARTIALLY VERIFIED

```text
execution stopped before complete acceptance
+
reason documented
```

### NOT VERIFIED

```text
required evidence could not be established
```

In all cases:

```text
STOP — WAITING FOR USER APPROVAL
```

No automatic continuation.

---

# 34. AUTONOMOUS AG DECISION MATRIX

| Situation | AG Action |
|---|---|
| Expected test starts | Proceed automatically |
| Test PASS | Record evidence → STOP test |
| Test FAIL | Record evidence → Diagnose → STOP |
| Transient infrastructure failure | One documented rerun maximum |
| Code defect suspected | STOP |
| Data defect suspected | STOP |
| Architecture issue suspected | STOP |
| Test-design issue suspected | STOP |
| Evidence conflict | STOP |
| Timeout / unknown state | STOP |
| Need for code change | STOP |
| Need for IAM change | STOP |
| Need for Queue change | STOP |
| Need for schema change | STOP |
| Desire for more confidence | Record follow-up → STOP |
| GATE 4 complete | Report → STOP |
| GATE 5 appears useful | Do not execute |
| 360-period test appears useful | Do not execute |

---

# 35. CORE AUTONOMY PRINCIPLE

The system is intentionally configured for:

```text
Auto Execution = Always Proceed
Review Policy = Always Proceed
```

This removes the need for the user to approve every CLI operation.

It does **not** remove the need for execution boundaries.

Therefore:

> **The AG may execute automatically inside the approved boundary, but it may never enlarge the boundary automatically.**

This distinction is mandatory for all future PLAY execution documents.

The desired behavior is:

```text
AUTO-EXECUTE
      ↓
WITHIN SCOPE
      ↓
EVIDENCE
      ↓
PASS / FAIL
      ↓
TERMINAL STOP
```

Never:

```text
AUTO-EXECUTE
→ MORE TESTS
→ MORE TESTS
→ MORE TESTS
→ CODE CHANGE
→ MORE TESTS
→ MORE TESTS
→ ...
```

---

# 36. FUTURE DOCUMENT REQUIREMENT

Every future PLAY execution MD must contain an equivalent:

```text
AUTONOMOUS EXECUTION / ANTI-INFINITE-VERIFICATION POLICY
```

section.

At minimum, every future execution document must define:

1. Authorized scope
2. Terminal PASS condition
3. Terminal FAIL condition
4. Maximum test executions
5. Rerun rule
6. Timeout/stall rule
7. No automatic remediation
8. No automatic scope expansion
9. Evidence sufficiency rule
10. Final STOP condition

This is now part of the PLAY engineering control system.


# 28. Final Stop

After all required execution/evidence records are created:

```text
STOP — WAITING FOR USER APPROVAL
```

Do not start GATE 5.

**Record first. Execute second. Preserve raw evidence. Never rewrite history.**
