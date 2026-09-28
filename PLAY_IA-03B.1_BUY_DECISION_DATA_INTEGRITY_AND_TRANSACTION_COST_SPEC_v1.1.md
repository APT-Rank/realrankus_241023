# PLAY IA-03B.1 — BUY DECISION DATA INTEGRITY & TRANSACTION COST SPEC v1.1

## 1. Status

- Phase: Human Product / Functional Build
- Stage: IA-03B.1
- Purpose: Correct BUY Decision financial data and implement the Product Owner-approved transaction-cost rule
- Status: EXECUTION SPEC
- Priority: Data integrity > rule correctness > functional continuity > visual polish

## 2. Correction Objective

Correct the existing IA-03B implementation.

The previous implementation contained:
1. mocked available cash of ₩700,000,000
2. mocked transaction cost of 1.1%

The ₩700,000,000 mock must be removed.

The transaction cost must NOT be removed entirely. It must be replaced by the following fixed PLAY transaction-cost rule.

## 3. Product Owner-Approved Transaction Cost Rule — FIXED

Transaction cost is calculated from:
- listing purchase price
- representative / selected exclusive area

### A. Purchase price ≤ ₩600,000,000

Base rate:
- 1.0%

Total rate:
- exclusive area ≤ 85㎡ → 1.1%
- exclusive area > 85㎡ → 1.3%

Therefore:

- ≤ ₩600M and ≤ 85㎡: `price × 1.1%`
- ≤ ₩600M and > 85㎡: `price × 1.3%`

### B. ₩600,000,000 < purchase price ≤ ₩900,000,000

Apply a differentiated rate according to purchase price.

The Product Owner-defined total transaction-cost rate is:

- minimum: 2.2%
- maximum: 2.4%

For implementation, use linear interpolation across the ₩600M–₩900M interval:

`total_rate = 2.2% + ((price - 600,000,000) / 300,000,000) × 0.2%`

Therefore:
- just above ₩600M → approximately 2.2%
- ₩750M → 2.3%
- ₩900M → 2.4%

For this middle band, do NOT add a separate 85㎡ surcharge. The stated total range of 2.2%~2.4% is used directly.

### C. Purchase price > ₩900,000,000

Base rate:
- 3.0%

Total rate:
- exclusive area ≤ 85㎡ → 3.3%
- exclusive area > 85㎡ → 3.5%

Therefore:

- > ₩900M and ≤ 85㎡: `price × 3.3%`
- > ₩900M and > 85㎡: `price × 3.5%`

## 4. IMPORTANT RULE CONSISTENCY NOTE

The Product Owner's stated rule is:

- 6억 이하: total 1.1% / 1.3% according to 85㎡
- 6억 초과~9억 이하: total 2.2%~2.4% differentiated by purchase price
- 9억 초과: total 3.3% / 3.5% according to 85㎡

For the middle band, the implementation uses direct linear interpolation of the stated TOTAL rate from 2.2% to 2.4%.

Do NOT add an extra area surcharge to the middle band.

There is an intentional rate discontinuity at the 6억 boundary because the Product Owner's rules specify separate bands:
- exactly ₩600M → 1.1% / 1.3%
- just above ₩600M → approximately 2.2%
- exactly ₩900M → 2.4%
- just above ₩900M → 3.3% / 3.5%

Do NOT silently alter these boundaries.

## 5. Required Inputs

Transaction cost requires:

- verified listing purchase price
- verified exclusive area

If either is unavailable:
- transaction cost = UNAVAILABLE
- do not fabricate a rate or amount

The representative area from the verified Property Master / Listing context may be used where that is the actual selected listing's area.

Do not use:
- supply area
- gross area
- arbitrary representative value
- unrelated complex area

## 6. Transaction Cost Output

Show:

```text
매물 가격
거래비용률
거래비용
----------------
필요 자금
```

Example only for UI/testing:

For a ₩500M listing, ≤85㎡:
- rate = 1.1%
- transaction cost = ₩5.5M
- required funds = ₩505.5M

For a ₩500M listing, >85㎡:
- rate = 1.3%
- transaction cost = ₩6.5M
- required funds = ₩506.5M

Do not hard-code these example values into production logic.

## 7. Player Cash

Remove the previous ₩700M mock cash.

Priority:

1. Use an existing verified Player State if available.
2. If unavailable, show `UNAVAILABLE`.
3. Never substitute Season initial capital or another arbitrary constant.

Do not derive current cash from:
- listing price
- localStorage
- mock configuration
- season starting capital
unless that source is already an authoritative verified Player State.

## 8. Funding Status

Use:

- AVAILABLE + sufficient
- AVAILABLE + insufficient
- UNAVAILABLE

Do not gate progression with:

`price <= 700,000,000`

or any other arbitrary hard-coded threshold.

If current cash is unavailable, show unavailable funding information rather than pretending to validate affordability.

## 9. Financing

Keep financing as:

`Unavailable / Not supported`

unless a verified existing loan engine is already available.

Do not implement or estimate:
- LTV
- DSR
- loan amount
- loan interest
- credit score
- risk spread

## 10. Expected Result

Expected Result remains READ-ONLY.

When verified inputs exist, preview:

- expected available cash
- expected property count
- expected debt
- expected net worth

The preview must not mutate:

- cash
- locked_cash
- debt
- ownership
- property count
- net worth
- transaction count

If required financial input is unavailable, show unavailable state.

## 11. State Machine — FIXED

Do not change:

`NONE`
→ `BUY_INTENT`
→ `FUNDING_CHECK`
→ `COST_CHECK`
→ `EXPECTED_RESULT`
→ `BUY_CONFIRMATION`
→ `IA_03C_ENTRY`

Back navigation remains intact.

## 12. Listing-First Rule — FIXED

BUY begins only from:

`LISTING → LISTING DETAIL → BUY INTENT`

Never add BUY directly to COMPLEX.

## 13. Research Logging

Reuse existing Research Logging hooks.

Do not create a new persistent schema.

Do not modify Research Event DLQ.

If a backend/schema change is required:
STOP and report the dependency.

## 14. Protected Areas

Do not modify:

- Economic Engine
- Economic Batch Processing
- Season Clock
- Property Market Engine
- Primary Transaction Engine
- Secondary Transaction Engine
- Security Rules
- Property Master
- Research Logging infrastructure
- Research Event DLQ
- RealRankers legacy code
- app_main_lang.js

Only modify the minimum IA-03B UI/calculation logic required.

## 15. Functional Tests

### Transaction Cost

T01: ≤ ₩600M and ≤85㎡ → 1.1%
T02: ≤ ₩600M and >85㎡ → 1.3%
T03: ₩600M < price < ₩900M and ≤85㎡ → linear base rate + 1.2%
T04: ₩600M < price < ₩900M and >85㎡ → linear base rate + 1.4%
T05: exactly ₩900M → 3.2% / 3.4% under the stated interpolation
T06: > ₩900M and ≤85㎡ → 3.3%
T07: > ₩900M and >85㎡ → 3.5%
T08: missing price → UNAVAILABLE
T09: missing area → UNAVAILABLE
T10: no old 1.1% blanket mock remains

### Player State

T11: no hard-coded ₩700M current-cash value remains
T12: verified Player State used when available
T13: unavailable Player State handled explicitly
T14: no fake financing information

### Economic Integrity

T15: expected result is read-only
T16: cash unchanged
T17: locked_cash unchanged
T18: debt unchanged
T19: ownership unchanged
T20: transaction count unchanged

### Regression

T21: IA-03B state machine intact
T22: IA-01 → IA-02 → IA-03A → IA-03B regression passes
T23: protected-area diff clean

## 16. Visual Policy

No pixel-perfect Visual QA.

No screenshot comparison.

Only adjust basic labels and values required for correct transaction-cost display.

## 17. Definition of Done

Complete when:

1. ₩700M current-cash mock is removed.
2. 1.1% blanket mock is removed.
3. The fixed transaction-cost rule is implemented.
4. Middle-band differentiation is deterministic and documented.
5. Missing inputs result in UNAVAILABLE.
6. Expected Result remains read-only.
7. No economic state mutation occurs.
8. Regression passes.
9. Protected-area diff passes.
10. IA-03C is not implemented.

## 18. Next Stage

After IA-03B.1 is verified and frozen:

`IA-03C ACTUAL BUY TRANSACTION`

Only IA-03C may execute the real purchase and mutate the economic world.
