# PLAY IA-04D — SELL LISTING → SECONDARY MARKET → ACTUAL SELL
## Implementation Specification v1.1

**Status:** EXECUTION SPECIFICATION  
**Phase:** Human Product / Functional Build  
**Scope:** IA-04D  
**Precondition:** IA-03C Actual BUY Transaction and IA-04A/04B/04C verified  
**Product Owner Policy:** FIXED

---

## 1. Objective

IA-04D completes the SELL side of the PLAY economic loop.

> MY WORLD → OWNED PROPERTY → SELL DECISION → SELL CONFIRM → SELL LISTING → SECONDARY MARKET → BUYER → MATCH → ACTUAL SELL TRANSACTION → SELL RESULT → MY WORLD

The goal is not merely to create a SELL button. The objective is to make an owned property become real market supply, allow another participant to create demand, execute a server-authoritative match, transfer ownership, settle cash, and expose the result to both participants.

The implementation must reuse the same integrity principles already verified for BUY.

---

## 2. Fixed Product Policies

### 2.1 Secondary Market Transaction Cost

Secondary Market transaction cost uses the **same fee calculation as Primary Market**.

Do not create a second fee formula.

The existing Primary fee rule must be reused as the authoritative calculation.

Current Primary fee rule:

| Property Price | Area | Total Fee |
|---|---|---:|
| ≤ 600M KRW | ≤ 85㎡ | 1.1% |
| ≤ 600M KRW | > 85㎡ | 1.3% |
| > 600M and ≤ 900M | any | 2.2% + progressive component |
| > 900M | ≤ 85㎡ | 3.3% |
| > 900M | > 85㎡ | 3.5% |

For 600M~900M:

`2.2% + ((price - 600,000,000) / 300,000,000) × 0.2%`

Example:
- 750M → 2.3%
- 900M → 2.4%

### 2.2 Seller / Buyer Fee Split

The calculated transaction cost is divided:

- **Seller: 75%**
- **Buyer: 25%**

Therefore:

`total_fee = primary_fee_calculation(price, representative_area_sqm)`

`seller_fee = total_fee × 0.75`

`buyer_fee = total_fee × 0.25`

Do not round each side independently in a way that creates an unexplained difference. The implementation must define and test a deterministic KRW rounding rule consistent with the existing fee implementation.

### 2.3 Listing Registration Priority

The default market listing priority is:

> **First registered listing first.**

This is a time-based registration priority.

However, the UI must provide **price sorting** as a user-facing discovery function.

At minimum support:
- 등록순
- 가격 낮은순
- 가격 높은순

Critical distinction:

> **UI sorting does not change actual matching priority.**

### 2.4 Match Priority

Actual matching follows:

1. **Price**
2. **Time**
3. **Concurrent requests → Server Transaction order**

The server is authoritative.

Do not use:
- browser click time,
- client timestamps,
- DOM order,
- client-side race resolution

as the final authority.

### 2.5 Listing Expiration

A listing expires after:

> **12 simulated months**

Expiration must be based on the authoritative PLAY simulation clock.

Expected lifecycle:

`ACTIVE → EXPIRED`

An EXPIRED listing is not tradable.

### 2.6 Cancellation Fee

Current Season:

> **0%**

Cancellation must nevertheless be implemented through configuration so future Seasons can change the rule.

Required conceptual configuration:

```text
cancel_fee_rate
cancel_policy
```

For the current Season:

`cancel_fee_rate = 0`

ACTIVE listings may be cancelled.

LOCKED listings may not be cancelled.

SOLD / EXPIRED / CANCELLED listings may not be cancelled again.

---

## 3. Non-Negotiable Economic Integrity

IA-04D must reuse:

- Server Authority
- Firestore atomic transaction
- Idempotency
- Concurrency safety
- Ownership integrity
- Player asset integrity
- Transaction log
- Decision log
- Research Logging + DLQ
- Reconciliation
- Failure recovery
- Emergency-stop behavior where already established

Client code must never directly mutate economic state.

No client-authoritative:
- cash,
- ownership,
- listing status,
- transaction completion,
- fee,
- settlement,
- net worth.

---

## 4. Scope

### IN SCOPE

1. SELL confirmation
2. Seller price input
3. Seller validation
4. Listing creation
5. Ownership/listing lock
6. Listing lifecycle
7. Secondary Market listing discovery
8. Listing sorting
9. Listing detail
10. Buyer purchase decision
11. Buyer funding validation
12. Secondary Market fee calculation
13. Match
14. Actual SELL transaction
15. Seller cash settlement
16. Buyer cash deduction
17. Ownership transfer
18. Listing closure
19. SELL RESULT
20. Seller MY WORLD refresh
21. Buyer MY WORLD refresh
22. Research traceability
23. Idempotency
24. Concurrency protection
25. Failure/retry/recovery
26. Reconciliation
27. Mobile functional behavior
28. Function Inventory update
29. Functional E2E

### OUT OF SCOPE

- AI buyer behavior
- advanced order-book mechanics
- auction
- dynamic price prediction
- new economic rules
- real-market synchronization
- nationwide property expansion
- ranking/rewards
- advanced participant profiling
- notification system
- final visual polish beyond functional usability

---

## 5. Seller Eligibility

Seller must satisfy all authoritative conditions:

1. authenticated
2. active Season
3. owns the exact `property_id`
4. ownership belongs to requesting participant
5. property is tradable
6. property is not INCOMPLETE
7. property is not already listed
8. property is not already LOCKED
9. authoritative player/property state is valid
10. request is idempotently identifiable

Failure must return a deterministic rejection reason.

---

## 6. Sell Price

Seller enters a positive integer KRW price.

Server validates:
- numeric
- integer KRW
- greater than zero
- active Season
- property eligibility
- listing state
- any already-existing server policy constraints

No AI recommendation is required.

Do not invent a minimum/maximum price rule unless an existing verified backend rule supports it.

If no such rule exists, accept any positive integer price.

---

## 7. Listing Lifecycle

Required states:

```text
ACTIVE
LOCKED
SOLD
CANCELLED
EXPIRED
```

Allowed transitions:

```text
ACTIVE → LOCKED
ACTIVE → CANCELLED
ACTIVE → EXPIRED
LOCKED → SOLD
```

Invalid transitions must be rejected.

A property must not have more than one active listing.

---

## 8. Listing Creation

Listing creation must atomically establish the market state.

At minimum:

- listing document
- seller
- property_id
- listing price
- seller fee rule/version
- creation simulation period/time
- expiration simulation period/time
- status
- ownership/listing lock state
- idempotency identity

The property remains owned by the seller while ACTIVE.

The listing itself represents the seller's market supply.

---

## 9. Listing Cancellation

For ACTIVE listing:

1. authenticate seller
2. verify ownership
3. verify listing ACTIVE
4. calculate cancellation fee using configuration
5. current Season fee = 0%
6. release listing lock
7. restore property to normal owned state
8. mark CANCELLED
9. create required logs

Cancellation must be atomic.

LOCKED listing cannot be cancelled.

---

## 10. Secondary Market Discovery

Secondary Market displays ACTIVE listings only.

Each listing should expose, where authoritative data exists:

- complex
- property_id
- representative area
- listing price
- registration time/period
- remaining time
- listing status

Do not fabricate:
- seller identity
- participant profile
- market statistics
- recent transaction values
- estimated current value

### UI Sorting

Support at minimum:

- 등록순
- 가격 낮은순
- 가격 높은순

Sorting is a display/query behavior only.

It must not alter server matching rules.

---

## 11. Buyer Flow

```text
SECONDARY MARKET
→ LISTING DETAIL
→ BUY DECISION
→ FUNDING CHECK
→ TRANSACTION COST
→ BUY CONFIRM
→ MATCH
→ ACTUAL TRANSACTION
→ BUY RESULT
```

Buyer validation:

1. authenticated
2. active Season
3. listing ACTIVE
4. buyer ≠ seller
5. listing price unchanged
6. property tradable
7. buyer has sufficient authoritative cash
8. buyer transaction cost is available
9. listing is not expired
10. request is idempotently identifiable

---

## 12. Actual Match / Transaction

The actual transaction must be one atomic server-side operation.

On success:

### Seller

- ownership removed
- seller fee deducted
- net sale proceeds added to cash
- property count decreases
- net worth recalculated from authoritative state

### Buyer

- purchase amount deducted
- buyer fee deducted
- ownership created
- property count increases
- net worth recalculated from authoritative state

### Market

- listing → SOLD
- listing no longer tradable
- exactly one transaction record

### Logs

- transaction log
- decision log
- idempotency log
- research events
- required reconciliation state

No partial success is allowed.

---

## 13. Match Concurrency

Required scenarios:

### D04-CON-01

One ACTIVE listing + two simultaneous buyers.

Expected:

- exactly one SUCCESS
- exactly one ownership transfer
- exactly one transaction
- exactly one SOLD listing
- other request deterministically rejected

### D04-CON-02

One property + two simultaneous SELL requests.

Expected:

- exactly one ACTIVE listing
- second request rejected

### D04-CON-03

Listing cancellation + buyer match concurrently.

Expected:

- one authoritative terminal result
- no duplicate settlement
- no orphan ownership/listing state

### D04-CON-04

Match retry after timeout.

Expected:

- idempotent result
- no duplicate cash transfer
- no duplicate ownership
- no duplicate transaction

---

## 14. Expiration

At authoritative simulation time:

```text
ACTIVE + elapsed >= 12 simulated months
→ EXPIRED
```

Expired listings:

- cannot be purchased
- cannot be matched
- cannot be cancelled
- are excluded from active market discovery

The expiration process must be idempotent.

Do not rely on a client timer.

---

## 15. SELL RESULT

After successful sale, seller must receive authoritative result:

- transaction_id
- property_id
- complex
- sell price
- seller fee
- net proceeds
- transaction time
- current cash
- property count
- net worth
- ownership status

Then:

> MY WORLD refreshes from `getPlayerState`.

Sold property must disappear from owned-property list.

Other properties must remain intact.

Buyer receives corresponding authoritative BUY RESULT.

---

## 16. Research Traceability

Seller:

```text
EXPOSURE
→ DECISION
→ ACTION
→ VALIDATION
→ TRANSACTION
→ OUTCOME
```

Buyer:

```text
EXPOSURE
→ DECISION
→ ACTION
→ VALIDATION
→ TRANSACTION
→ OUTCOME
```

Rejected attempts must also remain traceable.

Use the existing Research Logging and DLQ mechanism.

Do not silently swallow logging failures.

Do not create a parallel research logging system.

---

## 17. Reconciliation

Reconciliation must detect at least:

- SOLD listing but seller still owns property
- buyer owns property without transaction
- seller received cash without ownership transfer
- buyer paid cash without ownership transfer
- duplicate ownership
- duplicate transaction
- ACTIVE listing with inconsistent lock
- SOLD listing still ACTIVE
- EXPIRED listing still tradable
- CANCELLED listing still locked
- duplicate active listing for same property

---

## 18. Security

Client direct writes remain prohibited.

Economic writes must occur through authorized server functions.

Verify:
- authenticated participant
- server-authoritative Season
- server-authoritative player state
- server-authoritative property state
- server-authoritative listing state

Do not add authentication bypasses for convenience.

---

## 19. Mobile Functional Requirements

Mobile must preserve the same state machine.

Required flow:

```text
MAP / WORLD
→ MY WORLD
→ PROPERTY DETAIL
→ SELL
→ SELL CONFIRM
→ LISTING RESULT
→ SECONDARY MARKET
→ LISTING DETAIL
→ BUY
→ RESULT
```

Desktop and mobile may differ visually, but not economically or functionally.

---

## 20. Function Inventory

Every newly exposed interaction must be classified:

- CONNECTED
- INCOMPLETE
- UNCONNECTED BUT VALUABLE
- INTENTIONALLY DISABLED
- NOT APPLICABLE

For every unconnected or incomplete function, create:

`PLAY_FUNCTION_DESIGN_AND_IMPLEMENTATION_PLAN.md`

No visible dead button is acceptable.

---

## 21. Tests

Minimum test groups:

### D04-01 Seller eligibility
### D04-02 Sell price validation
### D04-03 Fee calculation reuse
### D04-04 Seller/Buyer 3:1 fee split
### D04-05 Listing creation
### D04-06 Duplicate listing prevention
### D04-07 Listing cancellation
### D04-08 Cancellation fee configuration
### D04-09 LOCKED cancellation rejection
### D04-10 Listing expiration
### D04-11 Active listing discovery
### D04-12 Registration sorting
### D04-13 Price ascending sorting
### D04-14 Price descending sorting
### D04-15 Buyer funding validation
### D04-16 Buyer/Seller separation
### D04-17 Match price priority
### D04-18 Match time priority
### D04-19 Concurrent buyer race
### D04-20 Concurrent seller race
### D04-21 Atomic ownership transfer
### D04-22 Atomic cash settlement
### D04-23 Transaction idempotency
### D04-24 Retry after timeout
### D04-25 Failure rollback
### D04-26 SELL RESULT
### D04-27 MY WORLD refresh
### D04-28 Research traceability
### D04-29 Research DLQ durability
### D04-30 Reconciliation
### D04-31 IA-03C/IA-04A/IA-04B regression
### D04-32 Full BUY → HOLD → SELL → BUY cycle

Every failed test follows:

`FAIL → Root Cause → Minimal Fix → Same Test → Regression → PASS`

Do not declare PASS based only on code inspection where execution is required.

---

## 22. Protected Areas

Do not modify without explicit Product Owner approval:

- verified Economic Engine
- Season Clock
- batch processing
- reliability infrastructure
- Security Rules
- existing Research Logging/DLQ core
- Property Master
- verified IA-03C BUY transaction semantics
- RealRankers core
- `app_main_lang.js`

Reuse existing verified contracts whenever possible.

---

## 23. STOP Rules

STOP implementation and report before changing code if any of the following is unconfirmed:

1. Primary fee calculation cannot be reused
2. Seller/Buyer fee allocation cannot be implemented consistently
3. existing Secondary Market schema conflicts with this policy
4. existing ownership lock semantics conflict
5. matching priority is incompatible with existing backend
6. listing expiration mechanism requires a new economic clock
7. cancellation policy requires a new economic rule
8. transaction atomicity cannot be guaranteed
9. Research Logging cannot be preserved
10. Security model requires bypass
11. existing IA-03C transaction contract would need modification

Do not silently choose a new policy.

---

## 24. Deliverables

Required:

1. `PLAY_IA-04D_IMPLEMENTATION_REPORT.md`
2. `PLAY_FUNCTION_INVENTORY_AND_UNCONNECTED_ACTION_AUDIT.md`
3. `PLAY_FUNCTION_DESIGN_AND_IMPLEMENTATION_PLAN.md`
4. test evidence for D04-01~D04-32
5. final functional E2E evidence

Final status must be one of:

- `READY FOR IA-04E`
- `BLOCKED — POLICY CONFLICT`
- `BLOCKED — TECHNICAL DEPENDENCY`
- `BLOCKED — VERIFICATION FAILURE`

IA-04D does not authorize a Human Season Ready declaration.

---

## 25. Human Season Boundary

Even after IA-04D passes, Human Season remains blocked until:

IA-04E → Function Completion → Full Functional E2E → Final Visual Tuning → Mobile E2E → Human E2E → Human Season Entry Gate → Product Owner Approval
