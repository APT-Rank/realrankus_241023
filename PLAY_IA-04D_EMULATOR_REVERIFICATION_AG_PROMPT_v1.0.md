# PLAY IA-04D Firebase Emulator Re-Verification
## AG Execution Prompt v1.0

Execute ONLY the IA-04D Emulator Re-Verification stage.

Do not run participant simulations.

---

## 1. Read Before Execution

Read:

- `PLAY_IA-04D_EMULATOR_REVERIFICATION_SPEC_v1.0.md`
- `PLAY_SEASON_SUPPLY_POLICY_IMPLEMENTATION_REPORT.md`
- `PLAY_IA-04D_IMPLEMENTATION_REPORT.md`
- IA-03C implementation/verification reports
- IA-04A implementation report
- IA-04B implementation report
- Research Logging + DLQ verification
- Reliability specification
- current Function Inventory / Function Design

Then inspect the actual repository.

Do not rely on previous PASS claims without runtime verification.

---

# 2. Fixed Property Model — DO NOT CHANGE

```text
ONE APARTMENT COMPLEX = ONE PLAY PROPERTY ASSET
property_id = complex_id = 검색코드
```

No household-level Property Assets.

---

# 3. Fixed Season Supply Model — DO NOT CHANGE

Season 1:

```text
supply_policy = FIXED_ONE
total_supply = 1
```

Future:

```text
HOUSEHOLD_BASED
max(1, floor(household_count × primary_supply_ratio))
```

The recently implemented Supply Policy is already verified.

Do not redesign it during IA-04D verification.

---

# 4. Primary vs Secondary

Primary:

```text
PLAY_PRIMARY_SUPPLY.remaining_supply
```

is authoritative.

Secondary:

```text
Seller Ownership
→ Buyer Ownership
```

must NOT consume or recreate Primary Supply.

---

# 5. IA-04D Verification

Run all:

```text
D04-01
D04-02
...
D04-32
```

in Firebase Emulator.

Every test requires runtime evidence.

Source inspection alone is not enough.

---

# 6. Seller / Listing Tests

Verify:

- authentication
- active Season
- exact ownership
- tradability
- duplicate listing prevention
- valid price
- Primary fee calculator reuse
- Seller 75% / Buyer 25%
- listing creation
- cancellation
- cancellation fee = 0 for current Season
- LOCKED cancellation rejection
- 12 simulated-month expiration

Cancellation:

```text
ACTIVE → CANCELLED
```

Expiration:

```text
ACTIVE → EXPIRED
```

Use existing authoritative Season Clock.

Do not invent another timer.

---

# 7. Matching Tests

Verify:

1. price priority
2. time priority
3. concurrent requests resolved by server transaction order

Test:

- multiple listings
- same-price listings
- multiple buyers
- self-purchase rejection
- insufficient funds
- expired listing
- cancelled listing
- sold listing

---

# 8. Concurrency

Actually send concurrent requests.

### One listing / multiple buyers

Expected:

```text
1 success
N-1 rejects
1 transaction
1 ownership transfer
listing SOLD
```

### One property / multiple sellers

Expected:

```text
1 ACTIVE listing
others rejected
```

### Cancel / Buy race

Expected:

```text
one terminal state
no double settlement
no inconsistent ownership
```

---

# 9. Idempotency

Replay identical requests.

Verify:

```text
no duplicate transaction
no duplicate cash mutation
no duplicate ownership
no duplicate listing
```

Use existing idempotency architecture.

---

# 10. Failure / Rollback

Use existing supported failure injection.

For a failed transaction:

```text
FAIL
→ rollback
→ retry
→ exactly one successful economic mutation
```

Check Firestore state before and after.

No partial economic state is acceptable.

---

# 11. Research Logging

Verify:

```text
EXPOSURE
→ DECISION
→ ACTION
→ VALIDATION
→ TRANSACTION
→ OUTCOME
```

for applicable flows.

Also verify rejected actions where required by the existing Research Logging contract.

For a forced Research Event failure:

```text
economic transaction remains correct
Research Event enters DLQ
event can be reprocessed
economic mutation is not duplicated
```

Do not create a second logging path.

---

# 12. Reconciliation

Run reconciliation after critical scenarios.

Check:

```text
cash_total = cash_available + locked_cash
cash_total >= 0
one Property Asset ≠ two current owners
terminal listing ≠ matchable listing
Secondary transaction does not change Primary Supply
```

---

# 13. Regression

Run:

- IA-03C BUY
- IA-04A Result
- IA-04B MY WORLD
- Season Supply Policy
- Research Logging/DLQ
- Idempotency
- Security
- Reliability

Do not modify protected systems merely to make tests pass.

---

# 14. Protected Systems

Do NOT change:

- Economic Engine semantics
- Season Clock semantics
- Batch
- Reliability core
- Security Rules
- Research Logging/DLQ core
- Property Master
- Season Supply Policy
- IA-03C
- IA-04A
- IA-04B
- RealRankers core
- `app_main_lang.js`

If a protected change is required:

STOP and report the exact dependency.

---

# 15. Evidence Format

For every D04 test capture:

```text
D04-XX
Setup:
Request:
Request/Trace ID:
Expected:
Actual:
Firestore Before:
Firestore After:
Result:
```

For concurrency also capture:

```text
Concurrent Request Count
Success Count
Reject Count
Transaction IDs
Final Listing State
Final Ownership
Final Cash
```

Do not mark PASS without evidence.

---

# 16. Failure Loop

If a test fails:

```text
FAIL
→ root cause
→ minimal fix
→ rerun same test
→ regression
→ PASS
```

No broad refactor.

No test weakening.

No silent exception suppression.

---

# 17. Required Reports

Create:

`PLAY_IA-04D_EMULATOR_REVERIFICATION_REPORT.md`

If necessary:

`PLAY_IA-04D_D04_RUNTIME_EVIDENCE.md`

Include:

- environment
- D04-01~D04-32 result table
- runtime evidence
- failures/fixes
- concurrency
- idempotency
- rollback
- Research/DLQ
- reconciliation
- regression
- final verdict

---

# 18. Final Verdict

Use exactly one:

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

Do not say:

- Human Season Ready
- Production Ready
- Fully Complete

---

# 19. ABSOLUTE STOP

Even if every D04 test passes:

STOP.

Do not run:

- 10 participant simulation
- 100 participant simulation
- L1000
- L10000
- Human Season

The next stage is a separate task:

> PROPERTY-SCALE SIMULATION — 10 vs 100 PARTICIPANTS
