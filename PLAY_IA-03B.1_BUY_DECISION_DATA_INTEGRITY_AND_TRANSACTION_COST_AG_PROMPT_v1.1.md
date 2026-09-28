# AG EXECUTION PROMPT — PLAY IA-03B.1 v1.1

## OBJECTIVE

Correct IA-03B before IA-03C.

There are two required corrections:

1. Remove the mocked current cash of ₩700,000,000.
2. Replace the old mocked 1.1% transaction cost with the Product Owner-approved transaction-cost rule below.

Do NOT implement IA-03C.

## READ FIRST

Read:

1. `PLAY_IA-03B.1_BUY_DECISION_DATA_INTEGRITY_AND_TRANSACTION_COST_SPEC_v1.1.md`
2. Latest `PLAY-IA-03B_IMPLEMENTATION_REPORT.md`
3. Latest IA-03A implementation report
4. Current `/play/js/play_app.js`
5. Existing verified PLAY financial/player-state code

Treat the transaction-cost rules below as FIXED.

# 1. TRANSACTION COST — IMPLEMENT EXACTLY

## A. Price ≤ ₩600,000,000

If exclusive area <= 85㎡:

`total_rate = 1.1%`

If exclusive area > 85㎡:

`total_rate = 1.3%`

## B. ₩600,000,000 < Price ≤ ₩900,000,000

Use linear interpolation of the stated TOTAL rate:

`total_rate = 2.2% + ((price - 600,000,000) / 300,000,000) × 0.2%`

Therefore:

- just above ₩600M: approximately 2.2%
- ₩750M: 2.3%
- exactly ₩900M: 2.4%

Do NOT add an additional 85㎡ surcharge in this band.

## C. Price > ₩900,000,000

If exclusive area <= 85㎡:

`total_rate = 3.3%`

If exclusive area > 85㎡:

`total_rate = 3.5%`

## 2. DO NOT SILENTLY CHANGE THE RULE

The middle-band interpretation is linear interpolation.

Do not replace it with:
- brackets
- averages
- arbitrary step rates
- another tax formula
- external legal rules

The Product Owner has specified the PLAY rule for this simulation.

## 3. REQUIRED INPUTS

Use:

- verified listing price
- verified exclusive area

If either is unavailable:

- transaction cost = UNAVAILABLE
- do not fabricate a number

Use the actual selected listing area where available.

Do not substitute:
- gross area
- supply area
- arbitrary representative area

## 4. REMOVE OLD MOCK TRANSACTION COST

Search the current implementation and remove:

`1.1%`

when it is being used as a blanket/mock transaction cost.

Do not remove the legitimate ≤₩600M and ≤85㎡ rule that also happens to be 1.1%.

The distinction is:

BAD:
`all listings → 1.1%`

GOOD:
`price ≤ 600M AND area ≤ 85㎡ → 1.1%`

## 5. REMOVE MOCK CURRENT CASH

Find and remove any hard-coded:

`₩700,000,000`

used as the user's current available cash.

If verified Player State exists:
- use it.

If not:
- display `UNAVAILABLE`.

Do not substitute:
- season initial capital
- mock config
- localStorage
- listing price
- arbitrary constant

## 6. FUNDING STATUS

Use:

- AVAILABLE + sufficient
- AVAILABLE + insufficient
- UNAVAILABLE

Remove any condition such as:

`price <= 700000000`

## 7. FINANCING

Keep loan information:

`Unavailable / Not supported`

unless a verified existing loan engine already exists.

Do not create LTV/DSR/loan logic.

## 8. REQUIRED FUNDS

Calculate:

`required_funds = listing_price + transaction_cost`

ONLY when both values are verified.

Otherwise:

`required_funds = UNAVAILABLE`

## 9. EXPECTED RESULT

Keep it read-only.

If verified inputs exist, preview:

- expected cash
- expected property count
- expected debt
- expected net worth

Do not mutate actual state.

## 10. STATE MACHINE

Do not change:

`NONE → BUY_INTENT → FUNDING_CHECK → COST_CHECK → EXPECTED_RESULT → BUY_CONFIRMATION → IA_03C_ENTRY`

Do not change LISTING-first behavior.

## 11. TESTS

Run:

T01 ≤600M / ≤85㎡ = 1.1%
T02 ≤600M / >85㎡ = 1.3%
T03 600M<price<900M / ≤85㎡ = linear base + 1.2%
T04 600M<price<900M / >85㎡ = linear base + 1.4%
T05 exactly 900M = 3.2% / 3.4%
T06 >900M / ≤85㎡ = 3.3%
T07 >900M / >85㎡ = 3.5%
T08 missing price = unavailable
T09 missing area = unavailable
T10 no blanket 1.1% mock remains
T11 no hard-coded 700M current cash remains
T12 verified Player State used if available
T13 missing Player State = unavailable
T14 no fabricated financing
T15 expected result read-only
T16 cash unchanged
T17 locked_cash unchanged
T18 debt unchanged
T19 ownership unchanged
T20 transaction count unchanged
T21 IA-03B state machine intact
T22 IA-01 → IA-02 → IA-03A → IA-03B regression
T23 protected-area diff

## 12. IMPORTANT BOUNDARY

Do NOT:

- execute BUY
- deduct cash
- lock cash
- create ownership
- create transaction
- modify debt
- create IA-03C transaction code
- create new backend
- create new Firestore schema
- modify Research Logging infrastructure

If a backend change is required to obtain verified Player State:

STOP and report.

## 13. VISUAL QA

Do not perform browser Visual QA.

Do not screenshot compare.

Only make minimal UI changes needed to show the correct rates, amounts, and unavailable states.

## 14. FINAL REPORT

Report:

1. files changed
2. old ₩700M mock removal
3. old blanket 1.1% mock removal
4. transaction-cost formula implemented
5. test results T01-T23
6. Player State source
7. unavailable-state handling
8. economic-state mutation verification
9. regression
10. protected-area diff
11. backend dependency, if any
12. IA-03C readiness

## HARD STOP

Finish IA-03B.1 only.

Do not implement IA-03C.
