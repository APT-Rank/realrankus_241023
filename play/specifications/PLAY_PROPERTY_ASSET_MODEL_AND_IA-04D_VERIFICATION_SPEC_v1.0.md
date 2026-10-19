# PLAY Property Asset Model & IA-04D Verification Specification v1.0

**Status:** EXECUTION SPECIFICATION  
**Phase:** Property Model Finalization → IA-04D Backend Verification  
**Simulation:** NOT INCLUDED IN THIS STAGE

## 1. Objective

This stage has two goals, in order:

1. Finalize and verify the PLAY Property Asset model.
2. Complete Firebase Emulator verification of IA-04D D04-01~D04-32.

Do **not** run the 10-participant or 100-participant simulation in this stage.

---

## 2. Fixed Property Asset Model

### 2.1 Property Unit

> **One apartment complex = one PLAY Property Asset**

`property_id = complex_id = source 검색코드 String`

One complex must never generate multiple tradable PLAY assets because of household count.

### 2.2 Representative Area

For each complex, select the `area_info` value whose exclusive area is closest to **84㎡**.

No arbitrary 84㎡ substitution.

### 2.3 Initial Price

Use the same `area_info` / `sales_info` index:

`nearest-to-84 area → selected index → same sales_info index → latest/final valid transaction price`

Do not use another area, `last_sales`, averages, estimates, zero, or synthetic prices.

If the corresponding sales information is unavailable:

- preserve the Property Master record
- mark it `INCOMPLETE`
- `tradable = false`
- do not create a fallback price

### 2.4 Household Count

`household_count` remains stored in Property Master.

For Season 1 it is:

- **not** a tradable quantity
- **not** primary supply quantity
- **not** secondary supply quantity
- **not** used to create multiple Property Assets
- **not** displayed in Season 1 UI

It is retained for future scaling and research.

### 2.5 Property Master

Retain at minimum:

`property_id, complex_id, complex_name, representative_area_sqm, initial_price, initial_price_date, household_count, legal_address, road_address, x, y, district, source_file, snapshot_version, status, tradable`

### 2.6 NORMAL / INCOMPLETE

NORMAL is tradable only when X/Y, representative area, corresponding initial price, and identity are valid.

INCOMPLETE remains non-tradable and retains the source record.

The current validated context is 209 complexes / 200 NORMAL / 9 INCOMPLETE; verify the repository rather than assuming these counts remain unchanged.

---

## 3. Compatibility Audit

Before coding, inspect:

- Property Master
- `PLAY_PRIMARY_SUPPLY`
- `PLAY_PROPERTY_OWNERSHIP`
- `PLAY_PLAYER_ASSET`
- `PLAY_SECONDARY_LISTING`
- `PLAY_PROPERTY_TRANSACTION`
- property ID mappings
- all uses of `household_count`

If any code still interprets `household_count` as tradable supply, **STOP and report the exact path before changing it**.

Required relationship:

`1 PLAY Property Asset → 0..1 ACTIVE Secondary Listing → 0..1 current owner`

The listing represents the participant-owned PLAY asset, not an individual real-world household.

---

## 4. Fixed IA-04D Market Policies

### Transaction Cost
Secondary Market uses the **same fee calculation as Primary Market**. Reuse the verified Primary calculation.

### Fee Split
Calculated total fee:

- Seller 75%
- Buyer 25%

Reuse the existing deterministic rounding convention.

### Listing Priority
Default registration priority:

> First registered listing first.

UI sorting must support:

- 등록순
- 가격 낮은순
- 가격 높은순

UI sorting must not change matching authority.

### Match Priority

1. Price
2. Time
3. Concurrent requests → Server Transaction order

Never use browser timestamp, client click order, or DOM order as economic authority.

### Listing Expiration

12 simulated months using the authoritative Season Clock.

### Cancellation

Current Season:

`cancel_fee_rate = 0`

But the variable must exist for future Seasons.

- ACTIVE → cancellation allowed
- LOCKED → cancellation prohibited
- SOLD / EXPIRED / CANCELLED → cancellation prohibited

---

## 5. IA-04D Current Verification State

The previous implementation report states:

- `createSecondaryListing` implemented
- `executeSecondaryTransaction` implemented
- Primary fee calculation reused
- Seller 75% / Buyer 25% implemented
- listing priority/matching backend implemented
- expiration period stored
- cancellation not fully implemented
- UI not fully connected
- D04-01~D04-32 not executed in Emulator

Therefore source-code existence is not verification.

This stage must verify runtime behavior.

---

## 6. Backend Completion / Verification

Verify server-authoritative implementation of:

### Seller
- authentication
- active Season
- exact ownership
- tradability
- duplicate listing prevention
- positive integer price
- idempotency
- listing lock/state

### Buyer
- authentication
- active Season
- buyer != seller
- listing ACTIVE
- expiration
- price consistency
- authoritative cash
- fee calculation
- idempotency

### Atomic Transaction

On successful secondary transaction, one atomic operation must consistently update:

- seller ownership
- seller cash
- buyer cash
- buyer ownership
- listing state
- transaction record
- required decision/idempotency records
- research trace

No partial success.

---

## 7. Cancellation

If incomplete, implement the minimum authoritative path:

`ACTIVE → CANCELLED`

Current fee = 0.

Verify ownership, ACTIVE state, lock release, atomicity, idempotency, and required logging.

LOCKED cancellation must reject.

Do not redesign the market.

---

## 8. Expiration

If only an expiration period exists without a state transition, implement the minimum authoritative mechanism using existing Season Clock infrastructure:

`ACTIVE → EXPIRED`

after 12 simulated months.

Expired listings:

- cannot buy
- cannot match
- cannot cancel
- are excluded from active market

Expiration must be idempotent.

Do not create a second economic clock.

---

## 9. Emulator Verification — D04-01~D04-32

Execute all tests with runtime evidence.

### Seller / Listing
D04-01 Seller eligibility  
D04-02 Sell price validation  
D04-03 Primary fee calculation reuse  
D04-04 Seller/Buyer 3:1 fee split  
D04-05 Listing creation  
D04-06 Duplicate listing prevention  
D04-07 Listing cancellation  
D04-08 Cancellation fee configuration  
D04-09 LOCKED cancellation rejection  
D04-10 Listing expiration

### Market
D04-11 Active listing discovery  
D04-12 Registration sorting  
D04-13 Price ascending sorting  
D04-14 Price descending sorting  
D04-15 Buyer funding validation  
D04-16 Buyer/Seller separation  
D04-17 Match price priority  
D04-18 Match time priority

### Concurrency / Integrity
D04-19 Concurrent buyer race  
D04-20 Concurrent seller race  
D04-21 Atomic ownership transfer  
D04-22 Atomic cash settlement  
D04-23 Transaction idempotency  
D04-24 Retry after timeout  
D04-25 Failure rollback

### Result / Research
D04-26 SELL RESULT  
D04-27 MY WORLD refresh  
D04-28 Research traceability  
D04-29 Research DLQ durability  
D04-30 Reconciliation

### Regression / Full Loop
D04-31 IA-03C / IA-04A / IA-04B regression  
D04-32 BUY → HOLD → SELL → BUY cycle

For every critical test record setup, request, response, resulting Firestore state, expected result, actual result, and PASS/FAIL.

Concurrency tests must use actual concurrent execution. Idempotency must demonstrate no duplicate economic mutation. Failure tests must demonstrate rollback.

---

## 10. Protected Areas

Do not modify without explicit approval:

- Economic Engine
- Season Clock semantics
- Batch processing
- Reliability architecture
- Security Rules
- Research Logging/DLQ core
- Property Master source rules
- IA-03C BUY semantics
- IA-04A/04B ownership/result contracts
- RealRankers core
- `app_main_lang.js`

If a change is required:

**STOP → report conflict → wait for approval.**

---

## 11. Research Logging

Preserve:

`EXPOSURE → DECISION → ACTION → VALIDATION → TRANSACTION → OUTCOME`

Use the existing Research Logging and DLQ. Do not create a parallel logging system.

---

## 12. No Simulation Yet

Do NOT run:

- 10 participant simulation
- 100 participant simulation
- L1000
- L10000
- Human Season

The next stage will separately define **Property Asset Scale Simulation — 10 vs 100 Participants**.

---

## 13. Required Reports

Produce:

1. `PLAY_PROPERTY_ASSET_MODEL_VERIFICATION_REPORT.md`
2. `PLAY_IA-04D_VERIFICATION_REPORT.md`
3. updated Function Inventory / Function Design documents if applicable
4. D04 runtime evidence
5. regression evidence

For every failure:

`FAIL → Root Cause → Minimal Fix → Same Test → Regression → PASS`

Do not broad-refactor.

---

## 14. Final Verdict

Use exactly one:

- `READY FOR PROPERTY-SCALE SIMULATION`
- `BLOCKED — PROPERTY MODEL CONFLICT`
- `BLOCKED — VERIFICATION FAILURE`
- `BLOCKED — TECHNICAL DEPENDENCY`

Do not declare Human Season Ready, Production Ready, or Fully Complete.

Stop after the final verdict.
