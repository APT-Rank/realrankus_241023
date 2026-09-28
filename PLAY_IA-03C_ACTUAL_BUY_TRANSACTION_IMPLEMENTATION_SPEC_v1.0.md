# PLAY IA-03C — ACTUAL BUY TRANSACTION IMPLEMENTATION SPEC v1.0

## 1. Status

- Phase: Human Product / Functional Build
- Stage: IA-03C
- Purpose: Execute the first real purchase transaction in PLAY
- Status: EXECUTION SPEC
- Priority: Economic integrity > transaction atomicity > idempotency > research traceability > UX

## 2. Product Definition

IA-03C is the first stage where a user's BUY decision is allowed to mutate the PLAY economic world.

Fixed flow:

LISTING
→ LISTING DETAIL
→ BUY INTENT
→ BUY DECISION
→ BUY CONFIRMATION
→ ACTUAL BUY
→ BUY RESULT
→ MY WORLD

The actual purchase target is always a LISTING.

Never execute a purchase directly against a COMPLEX.

## 3. Existing Verified Infrastructure

Reuse the already verified PLAY transaction infrastructure.

Relevant verified principles:

- Server Authority
- client direct write prohibited
- server-side transaction validation
- Firestore atomic transaction
- cash invariant
- asset lock where applicable
- property ownership update
- transaction log
- idempotency
- concurrency protection
- Research Logging
- Research Event DLQ
- reconciliation
- emergency stop / transaction pause where already implemented

Do not rebuild an existing verified transaction engine.

If the existing backend implementation does not expose a required capability, STOP and report the dependency rather than creating a parallel transaction path.

## 4. Entry Contract

IA-03C is entered only from:

`BUY_CONFIRMATION → IA_03C_ENTRY`

Required context:

- season_id
- participant/player_id
- complex_id/property_id
- selected listing context
- listing price
- exclusive area
- transaction-cost result
- expected-result context if available
- request_id / trace_id / correlation_id where already available

If the selected listing context is missing or invalid:
- reject the request
- do not mutate economic state.

## 5. Server Authority

The browser is NOT authoritative.

The client may submit a BUY request, but the server must re-read authoritative state before committing.

Server must validate at minimum:

1. authenticated participant
2. active season
3. season is not paused/closed
4. listing exists
5. listing is still available
6. listing price is current/valid
7. property is tradable
8. participant is eligible
9. available cash is sufficient
10. transaction cost is valid
11. required funds are valid
12. idempotency key is valid
13. no conflicting transaction already exists

Never trust:
- client-provided cash
- client-provided ownership
- client-provided transaction status
- client-provided final price
- client-provided transaction cost
- client-provided net worth

## 6. Transaction Cost

Use the fixed PLAY transaction-cost rule from IA-03B.1.

### Price ≤ ₩600,000,000

- area ≤ 85㎡ → 1.1%
- area > 85㎡ → 1.3%

### ₩600,000,000 < Price ≤ ₩900,000,000

Linear interpolation of total rate:

`total_rate = 2.2% + ((price - 600,000,000) / 300,000,000) × 0.2%`

Therefore:
- just above ₩600M → approximately 2.2%
- ₩750M → 2.3%
- ₩900M → 2.4%

No additional area surcharge in this band.

### Price > ₩900,000,000

- area ≤ 85㎡ → 3.3%
- area > 85㎡ → 3.5%

The server must calculate/validate the transaction cost from authoritative listing price and exclusive area.

Do not trust the client-calculated amount.

## 7. Required Funds

Server calculates:

`required_funds = authoritative_listing_price + authoritative_transaction_cost`

If required funds cannot be calculated:
- reject request
- no mutation.

## 8. Funding Validation

Server reads authoritative participant state.

Purchase succeeds only when:

`available_cash >= required_funds`

Do not use:
- Season initial capital
- UI mock cash
- localStorage
- client-submitted cash
- arbitrary fallback cash

If insufficient:
- reject with a deterministic insufficient-funds result
- no mutation.

## 9. Atomic Purchase

The purchase must be atomic.

Within the authoritative transaction boundary, update all state that must change together.

Minimum expected state changes:

### Participant Asset

- available cash decreases by required_funds
- property count increases
- net worth recalculated according to the existing verified model

If locked_cash is part of the existing purchase protocol, preserve the verified lock/unlock sequence.

### Property Ownership

Create/update the ownership record for:

- season_id
- participant_id
- property_id / complex_id
- listing context
- purchase price
- transaction cost
- total acquisition cost
- purchase timestamp
- transaction_id

### Listing

The purchased listing must no longer remain available for another successful purchase.

Use the existing verified listing/order state transition.

Do not invent a parallel listing status model.

### Transaction

Create exactly one authoritative transaction record.

Minimum fields should include existing transaction schema identifiers plus:

- transaction_id
- season_id
- participant_id
- property_id
- listing reference
- transaction type = BUY
- purchase price
- transaction cost
- total amount
- status
- request_id / idempotency key
- created_at

Use the existing verified schema where available.

## 10. Idempotency

BUY must be idempotent.

Repeated identical requests must NOT create:

- duplicate ownership
- duplicate transaction
- double cash deduction
- duplicate research events representing separate purchases

Use the existing verified idempotency infrastructure.

The idempotency key should be bound to the purchase request and participant/season context according to the existing PLAY transaction contract.

Do not create a second incompatible idempotency system.

## 11. Concurrency

Two or more participants attempting to purchase the same single listing concurrently:

- maximum one successful purchase
- all other attempts fail deterministically
- no duplicate ownership
- no duplicate transaction
- no double deduction

The existing Firestore transaction / asset-lock mechanism must be reused.

## 12. Failure and Rollback

If any required mutation fails before the atomic transaction commits:

- no partial economic state may remain.

Examples:

- cash changed but ownership failed → forbidden
- ownership created but transaction log failed → forbidden
- listing closed but cash not deducted → forbidden

Use the existing atomic transaction mechanism.

Do not create manual compensation logic if the verified transaction engine already provides atomic rollback.

## 13. Research Logging

On successful purchase:

Exposure
→ Decision
→ Action
→ Validation
→ Transaction
→ Outcome

Reuse the existing Research Logging infrastructure.

Research event correlation must preserve existing:

- research_event_id
- correlation_id
- trace_id
- request_id
- season_id
- participant_id
- simulation_period
- event_type
- status
- schema_version

If the research event write fails, use the already verified Research Event DLQ behavior.

A Research Event failure must NOT roll back a successfully committed economic transaction unless the existing verified architecture explicitly defines it as part of the atomic transaction.

Do not silently lose the event.

## 14. BUY RESULT

After successful transaction, display:

- purchase success
- complex
- listing
- area
- purchase price
- transaction cost
- total acquisition cost
- remaining cash
- property count
- updated net worth if available
- transaction ID / receipt reference

Clearly distinguish:

`거래 완료`

from:

`구매 후 예상`

The result must be based on the committed server state, not the client's pre-transaction estimate.

## 15. MY WORLD Transition

After successful BUY:

`BUY RESULT → MY WORLD`

The new property must appear in:

- My Properties
- Portfolio
- relevant asset state

Do not create a separate UI-only ownership record.

MY WORLD must read the authoritative player/property state.

## 16. Failure UX

Provide deterministic failure states for at least:

- listing unavailable
- insufficient funds
- invalid listing
- season unavailable
- transaction paused
- duplicate request / already processed
- server validation failure
- temporary server failure

Never show “purchase successful” unless the authoritative transaction committed successfully.

## 17. Client Retry

If the client times out after submitting BUY:

- do NOT blindly submit a new purchase with a new request ID.
- use the existing idempotency/request mechanism to resolve the original request.

The UI should distinguish:

- committed
- rejected
- still processing / unknown

If the current infrastructure cannot resolve an unknown transaction safely:
STOP and report the gap.

## 18. Security

Client must not write directly to PLAY transaction/ownership/player-state documents.

Use the existing authenticated server endpoint/function.

Validate authenticated participant identity server-side.

Do not trust client-provided participant_id.

## 19. Protected Areas

Do not modify unless absolutely required and explicitly reported:

- Economic Engine
- Economic Batch Processing
- Season Clock
- Property Market Engine core rules
- Property Master
- Security Rules
- Research Logging architecture
- Research Event DLQ
- reconciliation framework
- emergency stop / transaction pause
- RealRankers legacy code
- app_main_lang.js

If existing transaction infrastructure already supports IA-03C, integrate with it instead of modifying it.

If required infrastructure is missing:
STOP and report before creating new architecture.

## 20. Functional Verification

### Purchase Success

B01: valid listing can be purchased
B02: authoritative price is used
B03: transaction cost is calculated server-side
B04: required funds calculated server-side
B05: authoritative cash is validated
B06: cash deducted exactly once
B07: ownership created exactly once
B08: listing becomes unavailable after purchase
B09: exactly one transaction record created
B10: BUY RESULT reflects committed state
B11: MY WORLD reflects new ownership

### Insufficient / Invalid

B12: insufficient cash → rejected, no mutation
B13: unavailable listing → rejected, no mutation
B14: invalid listing → rejected, no mutation
B15: paused/closed season → rejected, no mutation

### Idempotency

B16: same request repeated → one transaction only
B17: timeout/retry → no double deduction
B18: duplicate ownership prevented

### Concurrency

B19: concurrent purchase of same listing → exactly one success
B20: losing requests produce deterministic failure
B21: no inconsistent listing/ownership/cash state

### Failure / Recovery

B22: simulated failure before commit → complete rollback
B23: transaction retry after failure → safe
B24: research event failure → DLQ behavior preserved
B25: reconciliation remains consistent

### Security

B26: unauthenticated request rejected
B27: participant identity cannot be spoofed
B28: direct client write remains blocked

### Regression

B29: IA-01 → IA-02 → IA-03A → IA-03B regression
B30: existing verified transaction infrastructure regression
B31: protected-area diff clean

## 21. Test Data

Use only verified PLAY property/listing data.

Do not introduce fabricated production listings.

Test fixtures may be synthetic only when clearly isolated as test fixtures and never written into production season state.

## 22. Visual Policy

Function-first.

No pixel-perfect Visual QA.

Use basic transaction/result components.

Visual refinement is a later phase.

## 23. Definition of Done

IA-03C is complete only when:

1. BUY originates from a real LISTING.
2. Server validates the purchase.
3. Transaction cost is server-validated.
4. Cash is authoritative.
5. Purchase is atomic.
6. Idempotency is proven.
7. Concurrent purchase is safe.
8. Ownership and listing state are consistent.
9. Transaction log is authoritative.
10. Research event trace is preserved.
11. Failure produces no partial economic state.
12. BUY RESULT reflects committed state.
13. MY WORLD reflects the purchase.
14. B01-B31 pass.
15. No protected architecture is silently changed.

## 24. Hard Stop Conditions

STOP immediately and report if:

- a new transaction architecture is required
- existing Property Market Engine cannot support the purchase
- authoritative Player State is unavailable
- server-side transaction cost validation is unavailable
- idempotency cannot be guaranteed
- atomic ownership/cash update cannot be guaranteed
- Research Event traceability cannot be preserved
- security rules must be weakened
- client-side direct writes would be required

Do not work around a hard stop with mock economic behavior.

## 25. Next Stage

After IA-03C is verified:

`BUY RESULT → MY WORLD → RESULT/FEEDBACK`

Then proceed to the broader IA-04 Result / My World implementation.
