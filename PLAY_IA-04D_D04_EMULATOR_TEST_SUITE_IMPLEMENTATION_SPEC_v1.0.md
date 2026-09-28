# PLAY IA-04D D04 Emulator Test Suite Implementation Specification v1.0

**Status:** EXECUTION SPECIFICATION  
**Phase:** IA-04D Verification Infrastructure  
**Purpose:** Build the missing D04-01~D04-32 Firebase Emulator test suite  
**Precondition:** IA-04D backend exists; Season Supply Policy is implemented  
**Next Gate:** IA-04D Emulator Re-Verification  
**Simulation:** NOT INCLUDED

---

# 1. Objective

The latest IA-04D re-verification was blocked because the repository does not contain executable tests for D04-01~D04-32.

This stage therefore has one purpose:

> **Build a real Firebase Emulator integration test suite capable of executing D04-01~D04-32 and producing runtime evidence.**

This stage does NOT decide whether IA-04D passes.

It creates the evidence-producing test infrastructure required for the next stage.

---

# 2. Current Finding

The previous re-verification report states:

- Firebase Local Emulator Suite is the target environment.
- D04-01~D04-32 tests do not exist in the repository.
- Runtime evidence therefore cannot be produced.
- Concurrency, idempotency, rollback, and Research DLQ behavior cannot currently be proven.
- Final status was `BLOCKED — VERIFICATION FAILURE`.

Therefore:

```text
Current IA-04D status
        ↓
BLOCKED
        ↓
D04 Test Suite Implementation
        ↓
IA-04D Emulator Re-Verification
```

Do not bypass this stage.

---

# 3. Scope

This stage includes only:

1. Test architecture
2. Emulator test fixtures
3. Test data factory
4. D04-01~D04-32 executable tests
5. Concurrency harness
6. Idempotency/retry harness
7. Failure/rollback harness
8. Research/DLQ verification helpers
9. Firestore state snapshot helpers
10. Test result/evidence output
11. Test documentation

---

# 4. Explicit Non-Goals

Do NOT:

- change economic rules
- change Season Supply Policy semantics
- change Property Asset identity
- redesign IA-04D
- redesign Primary Market
- redesign Secondary Market
- run 10 participant simulation
- run 100 participant simulation
- run L1000/L10000
- run Human Season
- modify RealRankers
- perform visual QA
- claim IA-04D PASS

If a production implementation defect is discovered while writing tests:

> STOP → document the defect → do not silently modify production behavior unless the minimal test-enabling fix is clearly isolated and explicitly justified.

---

# 5. Protected Contracts

The tests must respect and verify the following existing contracts.

## Property Asset

```text
ONE APARTMENT COMPLEX = ONE PLAY PROPERTY ASSET
property_id = complex_id
```

## Season 1 Supply

```text
supply_policy = FIXED_ONE
total_supply = 1
```

## Future Supply

```text
HOUSEHOLD_BASED
max(1, floor(household_count × primary_supply_ratio))
```

## Secondary Market

Secondary transactions transfer ownership.

They do NOT consume Primary Supply.

## Fees

Secondary Market uses Primary fee calculation.

```text
Seller = 75%
Buyer = 25%
```

## Matching

```text
Price
→ Time
→ Server transaction order for concurrency
```

## Expiration

```text
12 simulated months
```

## Cancellation

Current Season:

```text
cancel_fee_rate = 0
```

---

# 6. Test Environment

Use Firebase Local Emulator Suite.

The test runner must be able to:

- start or connect to Firestore Emulator
- initialize a clean test namespace
- create test Season
- create test Participants
- create test Property Asset
- initialize Player State
- create Primary Supply
- execute production callable/function entry points
- inspect Firestore after execution
- clean up test state

Do not replace production transaction logic with mocked business logic.

Mocks may be used only for external dependencies that are not the economic authority.

---

# 7. Test Data Isolation

Every test must use isolated identifiers.

Minimum:

```text
test_run_id
season_id
participant_id
property_id
listing_id
request_id
trace_id
correlation_id
```

Recommended:

```text
D04-XX-{test_run_id}-{uuid}
```

Tests must not depend on data created by another test.

Tests must be repeatable.

---

# 8. Canonical Fixture

Create a canonical test fixture containing at minimum:

### Season

```text
season_id
status = ACTIVE
supply_policy = FIXED_ONE
simulation_period
```

### Property

```text
property_id
complex_id
status = NORMAL
tradable = true
initial_price
representative_area
household_count
```

### Primary Supply

```text
total_supply = 1
remaining_supply = 1
```

### Seller

Must have:

- valid authenticated identity
- ownership of Property Asset
- sufficient cash
- valid Player State

### Buyer

Must have:

- valid authenticated identity
- sufficient cash
- no ownership of target Property Asset

The fixture must be created through the same authoritative setup path wherever possible.

---

# 9. Authentication

Tests must exercise the actual authorization boundary.

Do not simply call internal functions with arbitrary participant IDs when testing authorization.

Verify:

- authenticated user
- unauthenticated user
- wrong participant identity
- seller identity mismatch
- buyer identity mismatch

---

# 10. State Snapshot Utility

Create a reusable helper that captures relevant Firestore state before and after a test.

Minimum snapshot:

```text
PLAY_PLAYER_ASSET
PLAY_PROPERTY_OWNERSHIP
PLAY_SECONDARY_LISTING
PLAY_PROPERTY_TRANSACTION
PLAY_PRIMARY_SUPPLY
PLAY_DECISION_LOG
RESEARCH_EVENTS
RESEARCH_EVENTS_DLQ
PLAY_IDEMPOTENCY_LOGS
```

The helper must support deterministic comparison.

Do not compare volatile timestamps blindly.

Normalize only fields that are intentionally nondeterministic.

---

# 11. Concurrency Harness

Create a reusable helper capable of launching multiple requests concurrently.

Required scenarios:

```text
N buyers → 1 listing
N sellers → 1 property
cancel + buy race
retry + original request overlap
```

Do not serialize these requests accidentally.

The test must prove actual concurrent behavior.

---

# 12. Idempotency Harness

Create helper:

```text
executeSameRequest(request, N times)
```

Verify:

```text
1 economic mutation
N-1 equivalent/idempotent outcomes
```

depending on the production API contract.

The exact expected response semantics must follow the existing implementation contract.

The economic state must never be duplicated.

---

# 13. Failure Injection Harness

Use the existing supported failure-injection mechanism where available.

Required ability to test:

```text
before commit
after validation
during transaction path
research event failure
```

Do not introduce production-only failure switches solely for the test unless explicitly isolated and documented.

---

# 14. Research / DLQ Test Helpers

Create reusable verification helpers for:

```text
EXPOSURE
DECISION
ACTION
VALIDATION
TRANSACTION
OUTCOME
```

Verify common identifiers:

```text
season_id
participant_id
simulation_period
request_id
trace_id
correlation_id
event_type
status
```

For Research Event failure:

```text
economic transaction remains correct
event is persisted to RESEARCH_EVENTS_DLQ
original payload is recoverable
reprocessing is idempotent
```

---

# 15. D04 Test Implementation

Implement one executable test per D04 requirement.

## D04-01 — Seller Eligibility

Test:

- valid seller
- unauthenticated seller
- inactive Season
- non-owner
- non-tradable asset

## D04-02 — Sell Price Validation

Test:

- zero
- negative
- invalid type
- missing price
- valid price

## D04-03 — Primary Fee Calculation Reuse

Verify Secondary fee equals the authoritative Primary fee calculation.

## D04-04 — Seller / Buyer Fee Split

Verify:

```text
Seller = 75%
Buyer = 25%
```

including deterministic rounding.

## D04-05 — Listing Creation

Verify:

- listing exists
- correct owner
- ACTIVE state
- no unintended cash mutation
- no Primary Supply mutation
- idempotency record as applicable

## D04-06 — Duplicate Listing Prevention

Attempt duplicate ACTIVE listings.

Expected:

```text
one valid ACTIVE listing
```

## D04-07 — Cancellation

Verify:

```text
ACTIVE → CANCELLED
```

Ownership remains with seller.

## D04-08 — Cancellation Fee

Verify current fee:

```text
0
```

and that configuration remains represented.

## D04-09 — LOCKED Cancellation

Expected:

```text
REJECT
```

No state corruption.

## D04-10 — Expiration

Advance simulation time to the 12-month boundary.

Verify:

```text
ACTIVE → EXPIRED
```

Expired listing cannot match.

## D04-11 — Active Listing Discovery

Only ACTIVE listings appear.

## D04-12 — Registration Sorting

Verify display/data ordering.

## D04-13 — Price Ascending

Verify display ordering.

## D04-14 — Price Descending

Verify display ordering.

## D04-15 — Buyer Funding

Verify price + buyer fee affordability.

## D04-16 — Self Purchase

Seller buying own listing must fail.

## D04-17 — Price Priority

Lower compatible price wins.

## D04-18 — Time Priority

Same price:

```text
earlier listing wins
```

## D04-19 — Concurrent Buyer Race

One listing, multiple buyers:

```text
1 success
N-1 reject
1 transaction
1 ownership transfer
```

## D04-20 — Concurrent Seller Race

One property, multiple sellers:

```text
1 valid listing
others reject
```

## D04-21 — Atomic Ownership Transfer

Verify no partial owner state.

## D04-22 — Atomic Cash Settlement

Verify buyer/seller balances and fees atomically.

## D04-23 — Transaction Idempotency

Repeat same request.

No duplicate economic mutation.

## D04-24 — Retry After Timeout

Retry after simulated client timeout.

One economic result.

## D04-25 — Failure Rollback

Failure before commit:

```text
no partial economic mutation
```

## D04-26 — SELL Result

Verify authoritative result state.

## D04-27 — MY WORLD Refresh

Verify state reload reflects authoritative backend state.

## D04-28 — Research Traceability

Verify the complete applicable research chain.

## D04-29 — Research DLQ Durability

Force Research Event failure.

Verify:

- economic state correct
- DLQ exists
- original payload recoverable
- reprocessing safe

## D04-30 — Reconciliation

Run reconciliation after critical scenarios.

## D04-31 — Regression

Run:

- IA-03C
- IA-04A
- IA-04B
- Supply Policy
- Research Logging
- Idempotency
- Security
- Reliability

## D04-32 — Full Lifecycle

Execute:

```text
BUY
→ HOLD
→ SELL LISTING
→ SECONDARY MATCH
→ BUYER OWNERSHIP
→ RESULT
→ MY WORLD
```

Verify both seller and buyer.

---

# 16. Test Evidence

Every test must emit structured evidence.

Required format:

```text
TEST_ID
TEST_RUN_ID
ENVIRONMENT
SETUP
REQUEST
REQUEST_ID
TRACE_ID
EXPECTED
ACTUAL
STATE_BEFORE
STATE_AFTER
RESULT
```

For concurrency:

```text
CONCURRENT_REQUEST_COUNT
SUCCESS_COUNT
REJECT_COUNT
TRANSACTION_IDS
FINAL_LISTING_STATE
FINAL_OWNERSHIP
FINAL_CASH
```

For failure:

```text
FAILURE_POINT
STATE_BEFORE
STATE_AFTER_FAILURE
RETRY_REQUEST
FINAL_STATE
```

---

# 17. Evidence Artifact

The test suite must produce machine-readable output where practical.

Recommended:

```text
artifacts/d04/<test_run_id>/
  summary.json
  D04-01.json
  ...
  D04-32.json
```

Human-readable summary:

```text
PLAY_IA-04D_D04_TEST_SUITE_IMPLEMENTATION_REPORT.md
```

Do not fabricate evidence files.

---

# 18. PASS / FAIL Rules

A test is PASS only when:

1. executable test ran,
2. expected behavior was asserted,
3. actual Firestore state was inspected where relevant,
4. no invariant was violated.

Source inspection alone:

```text
NOT PASS
```

Test skipped:

```text
NOT PASS
```

Test not implemented:

```text
NOT PASS
```

---

# 19. Test Suite Completion Gate

This stage is complete when:

- D04-01~D04-32 executable tests exist
- Emulator execution succeeds
- test harness is repeatable
- evidence artifacts are generated
- failures are reported honestly

Important:

> Passing the test suite does NOT yet mean IA-04D is verified.

It only means:

> **READY FOR IA-04D EMULATOR RE-VERIFICATION**

---

# 20. Failure Loop

If implementation is found to be defective:

```text
TEST FAIL
→ ROOT CAUSE
→ MINIMAL FIX if explicitly justified
→ SAME TEST
→ REGRESSION
```

Do not weaken the assertion.

Do not convert a skipped test to PASS.

Do not hide exceptions.

---

# 21. Final Verdict

Allowed:

```text
READY FOR IA-04D EMULATOR RE-VERIFICATION
```

or

```text
BLOCKED — TEST INFRASTRUCTURE FAILURE
```

or

```text
BLOCKED — PRODUCTION IMPLEMENTATION DEFECT
```

Do not use:

- IA-04D Verified
- Ready for Simulation
- Production Ready
- Human Season Ready

---

# 22. Absolute Stop

After building the D04 test suite and producing its implementation report:

STOP.

Do not execute:

- 10 participant simulation
- 100 participant simulation
- L1000
- L10000
- Human Season

The next stage is IA-04D Emulator Re-Verification using this test suite.
