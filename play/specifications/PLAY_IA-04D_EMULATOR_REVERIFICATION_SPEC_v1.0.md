# PLAY IA-04D Firebase Emulator Re-Verification Specification v1.0

**Status:** EXECUTION SPECIFICATION  
**Phase:** IA-04D Secondary Market Re-Verification  
**Prerequisite:** Season Supply Policy implementation = READY FOR IA-04D RE-VERIFICATION  
**Simulation:** NOT INCLUDED  
**Human Season:** NOT INCLUDED

---

# 1. Objective

This stage performs the **actual Firebase Emulator re-verification of IA-04D** after the Season Supply Policy change.

The purpose is not to redesign IA-04D.

The purpose is to prove, with runtime evidence, that:

1. Secondary SELL Listing works correctly.
2. Secondary Market matching works correctly.
3. Seller / Buyer settlement is atomic.
4. Cancellation works correctly.
5. Expiration works correctly.
6. Concurrency is safe.
7. Idempotency is safe.
8. Failure/retry does not corrupt economic state.
9. Research Logging and DLQ remain traceable.
10. Reconciliation remains valid.
11. IA-03C / IA-04A / IA-04B remain intact.
12. The new Season Supply Policy does not alter Secondary Market semantics.

---

# 2. Fixed Property / Supply Model

The following is already approved and MUST NOT be changed during this stage.

## 2.1 Property Asset

```text
ONE APARTMENT COMPLEX = ONE PLAY PROPERTY ASSET
```

```text
property_id = complex_id = 검색코드
```

No household-level Property Assets.

## 2.2 Season 1 Supply

```text
supply_policy = FIXED_ONE
total_supply = 1
```

`household_count` does not determine Season 1 Primary supply.

## 2.3 Future Supply

The existing calculation remains available as:

```text
HOUSEHOLD_BASED
max(1, floor(household_count × primary_supply_ratio))
```

Do not modify this during IA-04D verification.

## 2.4 Secondary Market

Secondary transactions transfer an already acquired Property Asset.

Therefore:

```text
Secondary transaction
≠ Primary supply consumption
```

`PLAY_PRIMARY_SUPPLY.remaining_supply` MUST NOT change during Secondary matching.

---

# 3. Fixed IA-04D Market Policy

## 3.1 Transaction Fee

Secondary Market uses the same fee calculation as Primary Market.

Do not create a second fee formula.

## 3.2 Fee Split

Total calculated fee:

```text
Seller = 75%
Buyer  = 25%
```

Use the existing deterministic rounding convention.

## 3.3 Listing

A seller may create a listing only when:

- authenticated
- active Season
- owns the exact Property Asset
- asset is tradable
- no conflicting active listing exists
- listing price is valid

## 3.4 Listing Priority

Registration priority:

> First registered listing first.

UI sorting may include:

- registration order
- price ascending
- price descending

UI sorting MUST NOT become the economic authority.

## 3.5 Match Priority

Actual matching authority:

1. Price
2. Time
3. Server transaction order for concurrent requests

Never use:

- browser timestamp
- client click order
- DOM order
- local clock

as economic authority.

## 3.6 Expiration

A listing expires after:

```text
12 simulated months
```

Expiration uses the authoritative Season Clock.

## 3.7 Cancellation

Current Season:

```text
cancel_fee_rate = 0
```

State rules:

```text
ACTIVE     → CANCELLED   allowed
LOCKED     → CANCELLED   prohibited
SOLD       → CANCELLED   prohibited
EXPIRED    → CANCELLED   prohibited
CANCELLED  → CANCELLED   prohibited
```

Cancellation must be:

- server-authoritative
- atomic
- idempotent

---

# 4. Re-Verification Scope

Run:

```text
D04-01 ~ D04-32
```

All tests must execute against Firebase Emulator.

Source inspection alone is not PASS evidence.

---

# 5. D04 Test Matrix

## Seller / Listing

### D04-01 — Seller Eligibility

Verify:

- authenticated seller accepted
- unauthenticated seller rejected
- inactive Season rejected
- non-owner rejected
- non-tradable asset rejected

Expected:

```text
Only the legitimate owner can create a valid listing.
```

### D04-02 — Sell Price Validation

Reject:

- zero
- negative
- invalid type
- invalid precision
- missing price

Accept only valid listing prices.

### D04-03 — Primary Fee Calculation Reuse

Verify Secondary fee uses the same authoritative fee calculation as Primary.

No duplicated formula.

### D04-04 — Seller / Buyer Fee Split

Verify:

```text
Seller = 75%
Buyer  = 25%
```

Use actual transaction values and verify deterministic rounding.

### D04-05 — Listing Creation

Verify:

- ownership validation
- ACTIVE state
- listing persistence
- idempotency
- no unintended cash mutation
- no unintended Primary Supply mutation

### D04-06 — Duplicate Listing Prevention

Attempt multiple active listings for the same owned Property Asset.

Expected:

```text
Only one valid ACTIVE listing.
```

### D04-07 — Listing Cancellation

Verify:

```text
ACTIVE → CANCELLED
```

Verify ownership remains with seller.

Verify no unintended Primary Supply mutation.

### D04-08 — Cancellation Fee Configuration

Verify current Season:

```text
cancel_fee_rate = 0
```

Do not hard-code the concept away; it must remain configurable.

### D04-09 — LOCKED Cancellation Rejection

Attempt cancellation while listing is LOCKED.

Expected:

```text
REJECT
```

No state corruption.

### D04-10 — Listing Expiration

Advance authoritative simulation time to the expiration boundary.

Expected:

```text
ACTIVE → EXPIRED
```

Expired listing cannot be purchased or matched.

---

# 6. Market Tests

### D04-11 — Active Listing Discovery

Only valid ACTIVE listings appear in the active market.

Exclude:

- SOLD
- CANCELLED
- EXPIRED
- invalid/non-tradable listings

### D04-12 — Registration Sorting

Verify UI/data ordering by registration time.

This must not change economic matching authority.

### D04-13 — Price Ascending Sorting

Verify display ordering only.

### D04-14 — Price Descending Sorting

Verify display ordering only.

### D04-15 — Buyer Funding Validation

Verify buyer must have sufficient authoritative funds for:

```text
purchase price + buyer fee
```

Insufficient funds:

```text
REJECT
```

### D04-16 — Buyer / Seller Separation

Seller cannot purchase own active listing.

Expected:

```text
REJECT
```

### D04-17 — Price Priority

Multiple compatible listings:

```text
lower seller price
→ higher priority
```

### D04-18 — Time Priority

Same price:

```text
earlier valid listing
→ higher priority
```

---

# 7. Concurrency / Integrity

### D04-19 — Concurrent Buyer Race

One ACTIVE listing, multiple simultaneous buyers.

Expected:

```text
exactly 1 SUCCESS
all others REJECT
1 settlement
1 ownership transfer
listing = SOLD
```

No duplicate cash movement.

### D04-20 — Concurrent Seller Race

Same Property Asset, simultaneous SELL requests.

Expected:

```text
exactly 1 valid ACTIVE listing
remaining requests REJECT
```

### D04-21 — Atomic Ownership Transfer

Successful match must atomically produce:

```text
seller ownership removed
buyer ownership created
```

No intermediate externally valid inconsistent state.

### D04-22 — Atomic Cash Settlement

Successful match must atomically update:

```text
seller cash
buyer cash
```

with correct fee allocation.

### D04-23 — Transaction Idempotency

Replay the same transaction/request.

Expected:

```text
no duplicate transaction
no duplicate cash mutation
no duplicate ownership transfer
```

### D04-24 — Retry After Timeout

Simulate client timeout / retry.

Expected:

```text
one economic result
deterministic retry result
```

### D04-25 — Failure Rollback

Inject a supported failure before commit.

Expected:

```text
no partial ownership
no partial cash
no partial listing settlement
```

Retry must succeed exactly once when valid.

---

# 8. Result / Research

### D04-26 — SELL Result

After successful sale:

- seller state refreshes
- ownership reflects sale
- cash reflects settlement
- result identifies the correct Property Asset
- no fake market value is introduced

### D04-27 — MY WORLD Refresh

Verify authoritative `getPlayerState` / equivalent refresh.

Do not rely on client-only state.

### D04-28 — Research Traceability

Verify successful and rejected flows preserve:

```text
EXPOSURE
→ DECISION
→ ACTION
→ VALIDATION
→ TRANSACTION
→ OUTCOME
```

For applicable flows, verify:

- season_id
- participant_id
- simulation_period
- request_id
- trace_id
- correlation_id
- event type
- status

### D04-29 — Research DLQ Durability

Force a Research Event failure using the existing failure-injection mechanism.

Expected:

- economic transaction remains correct
- failed Research Event is durable in DLQ
- original event payload is recoverable
- reprocessing does not duplicate economic mutation

### D04-30 — Reconciliation

Run reconciliation after:

- successful sale
- rejected sale
- concurrent race
- cancellation
- expiration
- retry/failure scenario

Expected:

```text
no unresolved economic invariant violation
```

---

# 9. Regression / Full Loop

### D04-31 — Existing Regression

Verify:

- IA-03C BUY
- IA-04A Result
- IA-04B MY WORLD
- Season Supply Policy
- Research Logging/DLQ
- Idempotency
- Security
- Reliability

No regression in verified behavior.

### D04-32 — Full Lifecycle

Execute:

```text
BUY
 ↓
HOLD
 ↓
SELL LISTING
 ↓
SECONDARY MATCH
 ↓
BUYER OWNERSHIP
 ↓
RESULT
 ↓
MY WORLD
```

Verify both participants.

Verify:

- ownership
- cash
- listing
- transaction
- decision log
- research trace
- reconciliation
- Primary Supply unchanged by Secondary transfer

---

# 10. Evidence Standard

For each D04 test, record:

```text
Test ID
Environment
Seed Data
Request
Request ID / Trace ID
Expected Result
Actual Result
Firestore Before
Firestore After
PASS / FAIL
```

For concurrency:

- number of concurrent requests
- successful request count
- rejected request count
- transaction IDs
- final listing state
- final ownership

For failure tests:

- injected failure point
- pre-state
- post-failure state
- retry result
- final state

Do not mark PASS from logs that do not prove the relevant state.

---

# 11. Required Invariants

After every critical transaction verify:

### Cash

```text
cash_total = cash_available + locked_cash
cash_total >= 0
```

### Ownership

No Property Asset may have two current owners.

### Listing

A terminal listing cannot be matched again.

### Primary Supply

Secondary Market transactions must not alter:

```text
PLAY_PRIMARY_SUPPLY.remaining_supply
```

### Idempotency

One economic request:

```text
≤ 1 economic mutation
```

### Research

Research failure must not silently disappear.

---

# 12. Protected Systems

Do not change:

- Economic Engine semantics
- Season Clock semantics
- Batch architecture
- Reliability architecture
- Security Rules
- Research Logging/DLQ design
- Property Master rules
- Season Supply Policy semantics
- IA-03C BUY contract
- IA-04A / IA-04B contracts
- RealRankers core
- `app_main_lang.js`

If a protected system must change:

> STOP → report exact conflict → do not continue.

---

# 13. No Simulation

This stage must NOT run:

- 10 participant simulation
- 100 participant simulation
- L1000
- L10000
- Human Season

Even if all D04 tests pass, stop after the verification report.

---

# 14. Failure Handling

For every failure:

```text
FAIL
→ Root Cause
→ Minimal Fix
→ Re-run Same Test
→ Regression
→ PASS
```

Do not broad-refactor.

Do not weaken a test to obtain PASS.

Do not convert a known limitation into PASS.

---

# 15. Required Deliverables

Create:

1. `PLAY_IA-04D_EMULATOR_REVERIFICATION_REPORT.md`
2. `PLAY_IA-04D_D04_RUNTIME_EVIDENCE.md` if evidence is too large for the main report
3. updated Function Inventory / Function Design only if implementation changed

The main report must include:

- environment
- code version/commit if available
- D04-01~D04-32 result table
- failures and fixes
- concurrency evidence
- idempotency evidence
- rollback evidence
- research/DLQ evidence
- reconciliation evidence
- regression evidence
- final verdict

---

# 16. Final Verdict

Allowed values:

```text
READY FOR PROPERTY-SCALE SIMULATION
```

or

```text
BLOCKED — VERIFICATION FAILURE
```

or

```text
BLOCKED — TECHNICAL DEPENDENCY
```

Do not use:

- Human Season Ready
- Production Ready
- Fully Complete

`READY FOR PROPERTY-SCALE SIMULATION` means only:

> IA-04D has passed the defined Emulator verification scope and the system is eligible to move to the separate 10/100 participant simulation stage.

It does not mean the overall PLAY product is production-ready.
