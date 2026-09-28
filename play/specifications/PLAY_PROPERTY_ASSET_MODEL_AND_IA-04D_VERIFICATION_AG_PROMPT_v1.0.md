# PLAY — Property Asset Model Finalization & IA-04D Emulator Verification
## AG Execution Prompt v1.0

You are executing a controlled PLAY verification stage.

Your job is:

1. Finalize/verify the new Property Asset abstraction.
2. Complete IA-04D backend verification in Firebase Emulator.
3. STOP.

Do not start the 10-participant or 100-participant simulation.

## 1. Read First

Read completely:

- `PLAY_PROPERTY_ASSET_MODEL_AND_IA-04D_VERIFICATION_SPEC_v1.0.md`
- `PLAY_IA-04D_IMPLEMENTATION_REPORT.md`
- `PLAY_IA-04D_SELL_LISTING_TO_SECONDARY_MARKET_ACTUAL_SELL_SPEC_v1.1.md`
- IA-03C implementation + verification reports
- IA-04A implementation report
- IA-04B implementation report
- Property Master validation reports
- Research Logging / DLQ specification and verification
- Reliability specification
- Function Inventory / Function Design documents

Then inspect the actual repository. Do not rely only on previous reports.

## 2. Fixed Property Model

Implement/verify:

> ONE APARTMENT COMPLEX = ONE PLAY PROPERTY ASSET

Identity:

`property_id = complex_id = 검색코드 String`

Do not create one asset per household. Do not multiply supply by `household_count`.

## 3. Representative Area

Select the `area_info` value closest to 84㎡ using the actual index. Do not substitute an arbitrary 84㎡ value.

## 4. Initial Price

Use:

`selected area_info index → same sales_info index → latest/final valid transaction price`

No fallback.

If corresponding sales_info is unavailable:

`INCOMPLETE; tradable=false`

Do not invent a price.

## 5. Household Count

Keep `household_count` in Property Master.

For Season 1 it must NOT:

- create multiple Property Assets
- define primary supply quantity
- define secondary supply quantity
- affect tradable quantity
- appear in Season 1 UI

If existing code uses household_count to create tradable units or supply, STOP and report the exact code path before changing it.

## 6. Property Model Audit

Inspect:

- Property Master
- PLAY_PRIMARY_SUPPLY
- PLAY_PROPERTY_OWNERSHIP
- PLAY_PLAYER_ASSET
- PLAY_SECONDARY_LISTING
- PLAY_PROPERTY_TRANSACTION
- property mappings
- household_count usage

Verify:

`1 Complex → 1 PLAY Property Asset → 0..1 ACTIVE Secondary Listing → 0..1 current owner`

Find and eliminate only the minimum conflicting implementation. No broad refactor.

## 7. Fixed IA-04D Policy

- Secondary fee = Primary fee calculation
- Seller 75%, Buyer 25%
- Listing registration priority = first registered
- UI sorting = registration / price ascending / price descending
- Match = price → time → server transaction order
- Expiration = 12 simulated months
- Current cancellation fee = 0%
- `cancel_fee_rate` must remain configurable
- ACTIVE can cancel
- LOCKED cannot cancel

Do not change these policies.

## 8. Current IA-04D Gaps

The previous report says:

- backend functions exist
- D04-01~D04-32 not executed in Emulator
- cancellation incomplete
- expiration state transition incomplete
- UI not fully connected

Treat these as actual gaps until runtime verification proves otherwise.

## 9. Complete Cancellation

Implement the minimum server-authoritative path:

`ACTIVE → CANCELLED`

Current fee = 0.

Verify ownership, ACTIVE state, lock release, atomicity, idempotency, and required logging.

LOCKED cancellation must reject.

## 10. Complete Expiration

If only an expiration period exists, implement the minimum mechanism using existing Season Clock infrastructure:

`ACTIVE → EXPIRED`

after 12 simulated months.

Expired listings cannot buy, match, or cancel and are excluded from active market.

Do not create a second clock.

## 11. Execute D04-01~D04-32

Run all tests in the specification in Firebase Emulator.

Do not substitute source inspection for runtime behavior.

Especially verify:

- fee boundaries
- 3:1 split
- listing creation
- duplicate listing
- cancellation
- expiration
- sorting
- price/time matching
- concurrent buyer race
- concurrent seller race
- atomic ownership transfer
- atomic cash settlement
- idempotency
- retry
- rollback
- research trace
- DLQ
- reconciliation
- IA-03C/04A/04B regression
- BUY → HOLD → SELL → BUY

## 12. Concurrency

Use actual concurrent requests.

One listing + two buyers:
- exactly one success
- exactly one reject
- one transaction
- one ownership transfer
- listing SOLD

One property + two seller requests:
- exactly one active listing
- one reject

Cancel + Buy race:
- one authoritative terminal state
- no double settlement
- no inconsistent ownership

## 13. Idempotency

Retry identical requests.

Expected:
- no duplicate transaction
- no duplicate cash mutation
- no duplicate ownership
- no duplicate listing
- deterministic result

Reuse existing PLAY idempotency conventions.

## 14. Failure / Rollback

For supported failure injection:

`FAIL → rollback → retry → exactly one successful economic mutation`

No partial state.

## 15. Research

Preserve:

`EXPOSURE → DECISION → ACTION → VALIDATION → TRANSACTION → OUTCOME`

Use existing Research Logging + DLQ. Do not create another logging system.

## 16. Protected Areas

Do not modify:

- Economic Engine
- Season Clock semantics
- Batch
- Reliability core
- Security Rules
- Research Logging/DLQ core
- Property Master source logic
- IA-03C BUY semantics
- IA-04A/04B contracts
- RealRankers core
- app_main_lang.js

If required: STOP and report.

## 17. No Fake Data

Never use fake:
- cash
- ownership
- listing price
- transaction price
- fee
- net worth
- transaction result

UI-only placeholders are allowed.

## 18. Reports

Produce:

1. `PLAY_PROPERTY_ASSET_MODEL_VERIFICATION_REPORT.md`
2. `PLAY_IA-04D_VERIFICATION_REPORT.md`
3. updated Function Inventory / Function Design if needed
4. D04 runtime evidence
5. regression evidence

Every failure follows:

`FAIL → Root Cause → Minimal Fix → Same Test → Regression → PASS`

## 19. Final Verdict

Use exactly one:

- `READY FOR PROPERTY-SCALE SIMULATION`
- `BLOCKED — PROPERTY MODEL CONFLICT`
- `BLOCKED — VERIFICATION FAILURE`
- `BLOCKED — TECHNICAL DEPENDENCY`

Do not say Human Season Ready, Production Ready, or Fully Complete.

## 20. Absolute Stop

After Property Asset verification + IA-04D Emulator verification:

STOP.

Do not run:
- 10 participant simulation
- 100 participant simulation
- L1000
- L10000
- Human Season

The next task will separately define and execute:

> PROPERTY-SCALE SIMULATION — 10 vs 100 PARTICIPANTS
