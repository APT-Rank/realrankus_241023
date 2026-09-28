# PLAY IA-04D — AG EXECUTION PROMPT v1.1

## Role

You are implementing IA-04D for PLAY.

Treat the Product Owner-approved IA-04D Specification v1.1 as FIXED.

Do not reinterpret the market policies.

---

## 1. Read Before Coding

Read completely:

1. `PLAY_IA-04D_SELL_LISTING_TO_SECONDARY_MARKET_ACTUAL_SELL_SPEC_v1.1.md`
2. `PLAY_IA-04C_SELL_DECISION_AND_PRODUCT_COMPLETION_SPEC_v1.1.md`
3. `PLAY_FUNCTION_INVENTORY_AND_UNCONNECTED_ACTION_AUDIT.md`
4. `PLAY_FUNCTION_DESIGN_AND_IMPLEMENTATION_PLAN.md`
5. IA-03C implementation and verification reports
6. IA-04A implementation report
7. IA-04B implementation report
8. PLAY Architecture / Reliability / Research Logging documents

Before coding, inspect the existing backend implementation.

Do not assume schemas or function names from the specification if the repository contains an authoritative implementation.

---

## 2. Product Policies — FIXED

Implement exactly:

### Secondary Market Transaction Cost
Use the same authoritative fee calculation as Primary Market.

Do NOT create a new fee formula.

### Fee Split
The calculated fee is split:

- Seller 75%
- Buyer 25%

### Listing Priority
Default registration priority:

> first registered listing first

UI sorting must additionally provide:

- 등록순
- 가격 낮은순
- 가격 높은순

UI sorting must NOT alter matching priority.

### Match Priority

1. price
2. time
3. concurrent requests → server transaction order

Never use browser/client timing as economic authority.

### Listing Expiration

12 simulated months.

Use the authoritative PLAY simulation clock.

### Cancellation

Current Season:

`cancel_fee_rate = 0`

But cancellation fee must be configurable for future Seasons.

ACTIVE can cancel.

LOCKED cannot cancel.

---

## 3. Pre-Implementation Backend Audit

Before modifying code, identify the existing implementation for:

- PLAY_PLAYER_ASSET
- PLAY_PROPERTY_OWNERSHIP
- PLAY_PROPERTY_TRANSACTION
- Primary Supply
- Secondary Market / Order Book / Listing schema, if any
- ownership lock
- asset lock
- idempotency
- Decision Log
- Research Logging
- Research DLQ
- reconciliation
- Season Clock
- fee calculation
- `getPlayerState`
- `purchasePrimaryProperty`

Reuse existing contracts.

Do not create duplicate infrastructure if an existing verified contract can be extended safely.

---

## 4. Mandatory STOP Conditions

STOP and report before implementation if:

- Primary fee calculation cannot be reused
- Seller/Buyer split conflicts with an existing verified transaction contract
- Secondary Market schema is incompatible
- ownership lock semantics conflict
- match priority cannot be implemented atomically
- listing expiration requires changing the verified Season Clock
- cancellation requires a new unapproved economic rule
- transaction atomicity cannot be guaranteed
- Research Logging/DLQ would need replacement
- Security Rules require bypass
- IA-03C BUY transaction semantics would need modification

Do not invent a workaround.

---

## 5. Seller Flow

Implement:

```text
MY WORLD
→ OWNED PROPERTY
→ PROPERTY DETAIL
→ SELL
→ SELL CONFIRM
→ PRICE INPUT
→ SELL LISTING
→ LISTING RESULT
```

Validate on the server:

- auth
- active Season
- ownership
- exact property_id
- tradability
- no duplicate active listing
- no existing lock
- valid price
- idempotency

No client economic mutation.

---

## 6. Listing Lifecycle

Implement:

```text
ACTIVE
LOCKED
SOLD
CANCELLED
EXPIRED
```

Valid transitions:

```text
ACTIVE → LOCKED
ACTIVE → CANCELLED
ACTIVE → EXPIRED
LOCKED → SOLD
```

Creation, lock, cancellation, matching and settlement must use authoritative server state.

---

## 7. Listing Creation

Create the minimum authoritative listing state:

- listing_id
- season_id
- property_id
- seller_id
- price
- creation simulation period/time
- expiration simulation period/time
- status
- fee rule/version
- idempotency information

Do not invent seller-facing participant information.

---

## 8. Secondary Market

Build a real functional market view using authoritative listings.

Show:

- complex
- property
- area
- price
- registration time/period
- status
- remaining time where authoritative

Sorting:

1. 등록순
2. 가격 낮은순
3. 가격 높은순

Keep display sorting separate from transaction matching.

---

## 9. Buyer Flow

Implement:

```text
SECONDARY MARKET
→ LISTING DETAIL
→ BUY DECISION
→ FUNDING CHECK
→ FEE
→ BUY CONFIRM
→ MATCH
→ ACTUAL TRANSACTION
→ BUY RESULT
```

Buyer must not be the seller.

Validate authoritative cash and listing state on server.

---

## 10. Actual Secondary Transaction

Use one atomic server transaction.

On success:

### Seller
- ownership removed
- seller fee charged
- net proceeds credited
- property count updated
- net worth updated

### Buyer
- purchase price charged
- buyer fee charged
- ownership created
- property count updated
- net worth updated

### Listing
- SOLD
- no longer tradable

### Logs
- transaction
- decision
- idempotency
- research events

No partial completion.

---

## 11. Concurrency

Explicitly test:

1. one listing + two buyers
2. one property + two sell requests
3. cancel + match race
4. timeout + retry
5. duplicate request

Expected:

- one authoritative success
- no duplicate cash
- no duplicate ownership
- no duplicate transaction
- no orphan listing

---

## 12. Expiration

Use server simulation time.

At 12 simulated months:

`ACTIVE → EXPIRED`

Expired listings cannot:

- buy
- match
- cancel

Expiration must be idempotent.

Do not use client timers as authority.

---

## 13. Cancellation

Current fee:

`0%`

Make it configurable.

For ACTIVE:

- calculate configured fee
- current Season produces zero
- release lock
- mark CANCELLED

For LOCKED:

- reject cancellation.

---

## 14. Research Logging

Preserve:

```text
EXPOSURE
→ DECISION
→ ACTION
→ VALIDATION
→ TRANSACTION
→ OUTCOME
```

for both Seller and Buyer.

Rejected attempts must be traceable.

Use the existing Research Logging + DLQ.

Never silently swallow logging failures.

---

## 15. SELL RESULT / MY WORLD

Seller result must contain authoritative:

- transaction_id
- property_id
- complex
- sell price
- seller fee
- net proceeds
- cash
- property count
- net worth
- ownership state

Refresh with `getPlayerState`.

Sold property disappears from owned assets.

Buyer receives corresponding authoritative result.

---

## 16. Reconciliation

Add/verify detection for:

- SOLD but seller still owns
- buyer owns without transaction
- cash moved without ownership transfer
- duplicate ownership
- duplicate transaction
- inconsistent listing lock
- SOLD still active
- EXPIRED still tradable
- CANCELLED still locked
- duplicate active listing

Reuse existing reconciliation infrastructure.

---

## 17. Function Inventory

Update:

`PLAY_FUNCTION_INVENTORY_AND_UNCONNECTED_ACTION_AUDIT.md`

Every visible interaction must be:

- CONNECTED
- INCOMPLETE
- INTENTIONALLY DISABLED
- NOT APPLICABLE

If anything is valuable but unconnected, document it in:

`PLAY_FUNCTION_DESIGN_AND_IMPLEMENTATION_PLAN.md`

Do not remove UI merely because its backend is not ready.

---

## 18. Tests

Execute D04-01 through D04-32 from the specification.

Important:

- fee boundary tests
- 3:1 seller/buyer fee split
- registration sorting
- price sorting
- price/time matching
- concurrent buyers
- concurrent sellers
- cancellation
- expiration
- atomic ownership transfer
- atomic cash settlement
- idempotency
- retry
- rollback
- Research Logging
- DLQ
- reconciliation
- IA-03C regression
- IA-04A/04B regression
- full BUY → HOLD → SELL → BUY cycle

Do not claim PASS from source inspection alone when runtime execution is required.

---

## 19. Failure Loop

For every failure:

`FAIL`
→ identify root cause
→ minimal fix
→ rerun same failed test
→ run relevant regression tests
→ `PASS`

Do not make broad refactors to solve a local defect.

---

## 20. Protected Areas

Do not modify without explicit approval:

- Economic Engine
- Season Clock
- batch processing
- reliability infrastructure
- Security Rules
- Research Logging/DLQ core
- Property Master
- verified IA-03C BUY semantics
- RealRankers core
- `app_main_lang.js`

---

## 21. No Fake Economic Data

Never use fabricated:

- cash
- property ownership
- market price
- seller identity
- buyer identity
- transaction
- net worth
- fee
- current value

UI placeholders are allowed only where the underlying authoritative data genuinely does not exist.

---

## 22. Final Deliverables

Produce:

1. `PLAY_IA-04D_IMPLEMENTATION_REPORT.md`
2. `PLAY_FUNCTION_INVENTORY_AND_UNCONNECTED_ACTION_AUDIT.md`
3. `PLAY_FUNCTION_DESIGN_AND_IMPLEMENTATION_PLAN.md`
4. D04-01~D04-32 test evidence
5. Functional E2E evidence

Final status must be exactly one of:

- `READY FOR IA-04E`
- `BLOCKED — POLICY CONFLICT`
- `BLOCKED — TECHNICAL DEPENDENCY`
- `BLOCKED — VERIFICATION FAILURE`

Do NOT declare Human Season Ready.

---

## 23. Report Format

Report:

### A. Implemented
- files
- backend functions
- UI states
- state transitions

### B. Policy Mapping
Show how each fixed market policy was implemented.

### C. Data / Backend Mapping
Show authoritative collections/functions used.

### D. Research Mapping
Show Exposure → Decision → Action → Validation → Transaction → Outcome.

### E. Verification
D04-01~D04-32 with PASS/FAIL and evidence.

### F. Regression
IA-03C / IA-04A / IA-04B.

### G. Protected Areas
Confirm no unauthorized changes.

### H. Remaining Issues
List every incomplete or intentionally disabled function.

### I. Final Verdict
One of the four allowed statuses.

STOP after IA-04D. Do not start IA-04E automatically.
