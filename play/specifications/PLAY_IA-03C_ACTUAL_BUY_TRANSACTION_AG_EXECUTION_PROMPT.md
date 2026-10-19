# AG EXECUTION PROMPT — PLAY IA-03C ACTUAL BUY TRANSACTION

## OBJECTIVE

Implement the first real BUY transaction in PLAY.

This is the first stage where a user's action may mutate the economic world.

The purchase target is a LISTING.

Fixed flow:

LISTING
→ LISTING DETAIL
→ BUY INTENT
→ BUY DECISION
→ BUY CONFIRMATION
→ ACTUAL BUY
→ BUY RESULT
→ MY WORLD

## READ FIRST

Read completely:

1. `PLAY_IA-03C_ACTUAL_BUY_TRANSACTION_IMPLEMENTATION_SPEC_v1.0.md`
2. latest IA-03B.1 implementation report
3. latest IA-03A implementation report
4. PLAY Information Architecture Spec
5. existing verified PLAY transaction/property-market/reliability/security/research implementation
6. current `/play` source

Treat the IA-03C spec as Product Owner approved and fixed.

# 1. CRITICAL PRINCIPLE

Do NOT build a new transaction engine.

Reuse the already verified PLAY transaction infrastructure.

Existing principles to preserve:

- Server Authority
- Firestore atomic transaction
- asset lock where applicable
- idempotency
- concurrency protection
- transaction log
- Research Logging
- Research Event DLQ
- reconciliation
- emergency stop / transaction pause
- Security Rules

If the existing infrastructure cannot support a required IA-03C operation:

STOP.

Report the exact gap.

Do not create a parallel implementation.

# 2. BUY STARTS FROM LISTING

Never add direct BUY from COMPLEX.

The purchase target must contain:

- property/listing identity
- price
- exclusive area
- season
- participant context

Use the authoritative server-side record.

Do not trust client-submitted values.

# 3. SERVER VALIDATION

Before committing, validate server-side:

1. authentication
2. participant identity
3. active season
4. season state
5. listing exists
6. listing is available
7. listing price
8. property tradability
9. participant eligibility
10. authoritative cash
11. transaction cost
12. required funds
13. idempotency
14. conflicting transaction

Reject invalid requests without mutation.

# 4. TRANSACTION COST

Use exactly this Product Owner-approved rule.

## Price <= ₩600M

- area <= 85㎡ → 1.1%
- area > 85㎡ → 1.3%

## ₩600M < price <= ₩900M

Use direct total-rate interpolation:

`total_rate = 2.2% + ((price - 600,000,000) / 300,000,000) × 0.2%`

Examples:
- just above ₩600M → ~2.2%
- ₩750M → 2.3%
- ₩900M → 2.4%

No additional area surcharge in this band.

## Price > ₩900M

- area <= 85㎡ → 3.3%
- area > 85㎡ → 3.5%

The SERVER calculates or validates this from authoritative listing price and area.

Do not trust client totals.

# 5. AUTHORITATIVE CASH

Read current player cash from the server-side Player State.

Do not use:

- UI cash
- localStorage
- season starting capital
- client-submitted cash
- hard-coded ₩700M

Require:

`available_cash >= required_funds`

Otherwise reject with insufficient funds.

# 6. ATOMIC PURCHASE

Use the existing authoritative transaction mechanism.

The successful purchase must update consistently:

- participant cash
- player asset/property count
- ownership
- listing availability
- transaction record
- other required verified state

If locked_cash is part of the existing verified protocol, preserve it.

No partial commit is allowed.

# 7. OWNERSHIP

Create exactly one authoritative ownership record for the purchased listing/property.

Include existing schema fields plus, where supported:

- transaction_id
- season_id
- participant_id
- property_id
- listing reference
- purchase price
- transaction cost
- total acquisition cost
- timestamp

Do not invent a second ownership schema if one already exists.

# 8. LISTING STATE

After successful purchase, the listing must no longer be available for another successful purchase.

Use the existing listing/order state transition.

Do not create a parallel listing status system.

# 9. TRANSACTION RECORD

Create exactly one authoritative BUY transaction.

Do not create duplicates on retries.

Use existing transaction schema and idempotency system.

# 10. IDEMPOTENCY

Repeated identical BUY requests must produce only one economic result.

Test:

- same request twice
- same request after timeout
- retry after client/network failure

Never double deduct cash.

Never duplicate ownership.

Never create two successful transactions.

# 11. CONCURRENCY

Two participants buying the same listing simultaneously:

Expected:

- exactly 1 succeeds
- all other requests fail deterministically
- no duplicate ownership
- no double cash deduction
- listing state remains consistent

Use the existing Firestore transaction/lock mechanism.

# 12. FAILURE / ROLLBACK

Use atomic transaction behavior.

If the transaction does not commit:

- cash must remain unchanged
- ownership must remain unchanged
- listing must remain available
- transaction record must not falsely indicate success

Do not create manual compensation if existing atomic rollback already provides this.

# 13. RESEARCH LOGGING

On successful purchase preserve:

Exposure
→ Decision
→ Action
→ Validation
→ Transaction
→ Outcome

Reuse existing Research Logging.

Do not create a new schema.

If Research Event write fails after economic commit:
- preserve the verified DLQ behavior
- do not silently lose the event

Do not roll back a committed economic transaction unless the existing verified architecture explicitly requires it.

# 14. BUY RESULT

Only show success after authoritative transaction commit.

Display:

- 거래 완료
- complex
- listing
- area
- purchase price
- transaction cost
- total acquisition cost
- remaining cash
- property count
- net worth if authoritative
- transaction ID / receipt reference

Do not reuse the pre-transaction “예상” values as if they were final.

# 15. MY WORLD

After success:

`BUY RESULT → MY WORLD`

The property must appear through authoritative player/property state.

Do not create UI-only ownership.

# 16. FAILURE UX

Handle at minimum:

- listing unavailable
- insufficient funds
- invalid listing
- season unavailable
- transaction paused
- duplicate/already processed
- validation failure
- temporary server failure

Never show success without committed transaction.

# 17. TIMEOUT / RETRY

If the client times out:

Do NOT automatically issue a new purchase with a new request ID.

Use existing idempotency/request resolution.

If the infrastructure cannot safely determine whether the original request committed:

STOP and report.

# 18. SECURITY

Do not weaken Security Rules.

Do not allow client direct writes.

Authenticate server-side.

Do not trust client participant_id.

# 19. PROTECTED AREAS

Do not silently modify:

- Economic Engine
- Economic Batch
- Season Clock
- Property Market Engine core
- Property Master
- Security Rules
- Research Logging architecture
- Research Event DLQ
- reconciliation
- emergency stop / transaction pause
- RealRankers legacy code
- app_main_lang.js

Integrate with existing infrastructure.

# 20. TESTS

Run all:

B01 valid purchase
B02 authoritative price
B03 server transaction cost
B04 server required funds
B05 authoritative cash
B06 one cash deduction
B07 one ownership
B08 listing unavailable after purchase
B09 one transaction
B10 committed BUY RESULT
B11 MY WORLD update

B12 insufficient funds no mutation
B13 unavailable listing no mutation
B14 invalid listing no mutation
B15 paused/closed season no mutation

B16 duplicate request one transaction
B17 timeout/retry no double deduction
B18 duplicate ownership prevented

B19 concurrent same-listing purchase one success
B20 losing requests deterministic
B21 consistent state

B22 failure before commit rollback
B23 safe retry
B24 Research Event DLQ
B25 reconciliation

B26 unauthenticated rejected
B27 participant spoof rejected
B28 direct client write blocked

B29 IA-01 → IA-02 → IA-03A → IA-03B regression
B30 transaction infrastructure regression
B31 protected-area diff

# 21. TEST FIXTURES

Use verified property/listing data.

Synthetic test fixtures are allowed only in isolated test context.

Do not write fake economic data into a real production season.

# 22. VISUAL QA

Do not perform pixel-perfect Visual QA.

Do not spend time on visual polish.

Use basic transaction/result UI.

# 23. HARD STOP CONDITIONS

STOP and report if:

- new transaction architecture is required
- Property Market Engine lacks required capability
- authoritative Player State cannot be read
- server transaction-cost validation cannot be performed
- idempotency cannot be guaranteed
- atomic cash/ownership update cannot be guaranteed
- Research traceability cannot be preserved
- Security Rules would need weakening
- client direct write would be required

Do not solve a hard stop with mock economic behavior.

# 24. FINAL REPORT

Report:

1. files changed
2. actual BUY entry path
3. server validation
4. transaction-cost validation
5. authoritative cash source
6. atomic mutation details
7. ownership result
8. listing state result
9. transaction record
10. idempotency results
11. concurrency results
12. rollback/failure results
13. Research Logging/DLQ results
14. BUY RESULT
15. MY WORLD update
16. B01-B31 results
17. security verification
18. protected-area diff
19. remaining IA-04 work

# HARD STOP

Do not implement IA-04.

Do not implement SELL.

Do not implement ranking/rewards/notifications.

Complete IA-03C only, verify it, and STOP.
