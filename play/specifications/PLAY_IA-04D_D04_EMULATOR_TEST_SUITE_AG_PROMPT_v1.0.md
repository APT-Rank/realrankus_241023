# PLAY — IA-04D D04 Emulator Test Suite Implementation
## AG Execution Prompt v1.0

Execute ONLY this stage.

The previous IA-04D re-verification was blocked because D04-01~D04-32 executable tests do not exist.

Your task is to BUILD THE TEST SUITE.

Do not run participant simulations.

---

## 1. Read First

Read:

- `PLAY_IA-04D_D04_EMULATOR_TEST_SUITE_IMPLEMENTATION_SPEC_v1.0.md`
- `PLAY_IA-04D_EMULATOR_REVERIFICATION_REPORT.md`
- `PLAY_SEASON_SUPPLY_POLICY_IMPLEMENTATION_REPORT.md`
- `PLAY_IA-04D_IMPLEMENTATION_REPORT.md`
- IA-03C verification
- IA-04A verification
- IA-04B verification
- Research Logging/DLQ verification
- Reliability specification
- current Function Inventory / Function Design

Inspect the repository.

---

## 2. Current Blocker

The last report found:

```text
D04-01 ~ D04-32 test scripts = NOT PRESENT
```

Therefore:

```text
IA-04D Re-Verification
        ↓
BLOCKED
        ↓
Build D04 Test Suite
```

Do not bypass the missing test suite.

---

## 3. Build Real Firebase Emulator Tests

Use Firebase Local Emulator Suite.

Tests must execute actual production entry points.

Do not replace economic logic with mock implementations.

Mocks are allowed only for external dependencies that are not economic authority.

---

## 4. Build Test Fixtures

Create reusable fixtures for:

### Season

```text
ACTIVE
supply_policy = FIXED_ONE
```

### Property

```text
NORMAL
tradable = true
property_id = complex_id
```

### Primary Supply

```text
total_supply = 1
remaining_supply = 1
```

### Seller

Valid authentication + ownership + sufficient cash.

### Buyer

Valid authentication + sufficient cash + no ownership.

Every test must be isolated.

---

## 5. Build State Snapshot Helper

Snapshot at least:

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

Normalize only deliberately nondeterministic fields.

---

## 6. Build Concurrency Harness

Must support actual concurrent requests.

Required:

```text
N buyers → 1 listing
N sellers → 1 property
cancel + buy race
retry + original request overlap
```

Do not accidentally serialize them.

---

## 7. Build Idempotency Harness

Same request repeated N times.

Verify no duplicate:

- transaction
- cash mutation
- ownership
- listing

Follow the existing response contract.

---

## 8. Build Failure Harness

Use existing supported failure injection.

Required coverage:

```text
before commit
research event failure
retry after timeout
```

If a required injection point does not exist, report it rather than weakening the test.

---

## 9. Implement D04-01~D04-32

Implement one executable test per requirement from the specification.

Do not combine unrelated tests just to reduce test count.

The repository must contain identifiable D04 test IDs.

---

## 10. D04-01~D04-10

Implement:

- seller eligibility
- sell price validation
- Primary fee reuse
- 75/25 fee split
- listing creation
- duplicate listing
- cancellation
- cancellation fee
- LOCKED cancellation rejection
- 12-month expiration

---

## 11. D04-11~D04-18

Implement:

- active listing discovery
- registration sorting
- price ascending
- price descending
- buyer funding
- self purchase rejection
- price priority
- time priority

---

## 12. D04-19~D04-25

Implement actual:

- concurrent buyer race
- concurrent seller race
- atomic ownership
- atomic cash
- idempotency
- timeout retry
- rollback

Do not use sequential calls to simulate concurrency.

---

## 13. D04-26~D04-30

Implement:

- SELL result
- MY WORLD refresh
- Research traceability
- Research DLQ durability
- reconciliation

Research DLQ test must verify the economic transaction is not duplicated when research-event processing fails or is reprocessed.

---

## 14. D04-31~D04-32

Regression:

```text
IA-03C
IA-04A
IA-04B
Supply Policy
Research Logging
Idempotency
Security
Reliability
```

Then full:

```text
BUY
→ HOLD
→ SELL LISTING
→ SECONDARY MATCH
→ BUYER OWNERSHIP
→ RESULT
→ MY WORLD
```

---

## 15. Runtime Evidence

Every test must produce:

```text
TEST_ID
TEST_RUN_ID
REQUEST_ID
TRACE_ID
EXPECTED
ACTUAL
STATE_BEFORE
STATE_AFTER
PASS/FAIL
```

For concurrency include:

```text
request count
success count
reject count
transaction IDs
final listing state
final ownership
final cash
```

For failure include:

```text
failure point
state before
state after failure
retry
final state
```

---

## 16. Evidence Files

Generate:

```text
artifacts/d04/<test_run_id>/
```

where practical:

```text
summary.json
D04-01.json
...
D04-32.json
```

Also generate:

`PLAY_IA-04D_D04_TEST_SUITE_IMPLEMENTATION_REPORT.md`

The report must distinguish:

```text
implemented
executed
passed
failed
blocked
```

Do not claim verification merely because tests exist.

---

## 17. Production Defect Handling

If a D04 test exposes a production implementation defect:

Do NOT silently modify production code.

Report:

```text
TEST
→ observed failure
→ root cause
→ affected production file
→ proposed minimal fix
```

A minimal fix may be implemented only if clearly isolated and necessary for the test suite, with regression evidence.

Do not broad-refactor IA-04D.

---

## 18. Protected Areas

Do not change:

- Economic Engine
- Season Clock semantics
- Supply Policy semantics
- Property Asset identity
- Reliability architecture
- Security Rules
- Research Logging/DLQ core
- IA-03C contract
- IA-04A contract
- IA-04B contract
- RealRankers
- `app_main_lang.js`

If required:

STOP.

---

## 19. PASS Criteria

This stage PASS means ONLY:

```text
D04-01~D04-32 executable test suite exists
and
test infrastructure is ready for Emulator Re-Verification
```

It does NOT mean:

```text
IA-04D Verified
```

and does NOT mean:

```text
Ready for Simulation
```

---

## 20. Final Verdict

Use exactly:

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

---

## 21. ABSOLUTE STOP

After the D04 Test Suite Implementation Report:

STOP.

Do not run:

- 10 participant simulation
- 100 participant simulation
- L1000
- L10000
- Human Season

The next task will be:

> IA-04D EMULATOR RE-VERIFICATION
