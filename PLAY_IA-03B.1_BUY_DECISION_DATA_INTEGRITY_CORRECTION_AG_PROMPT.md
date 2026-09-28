# AG EXECUTION PROMPT — PLAY IA-03B.1 BUY DECISION DATA INTEGRITY CORRECTION

## OBJECTIVE

Correct the existing IA-03B implementation before proceeding to IA-03C.

This is a narrow correction task.

Do NOT rebuild IA-03B.

Do NOT implement IA-03C.

The latest IA-03B report shows two problems:

1. Funding check uses mocked available cash of ₩700,000,000.
2. Transaction cost uses a mocked 1.1% fee.

Remove both.

## READ FIRST

Read:

1. `PLAY_IA-03B.1_BUY_DECISION_DATA_INTEGRITY_CORRECTION_SPEC_v1.0.md`
2. Latest `PLAY-IA-03B_IMPLEMENTATION_REPORT.md`
3. Latest IA-03A implementation report
4. Current `/play/js/play_app.js`
5. Existing PLAY architecture / Property Market / Player State implementation relevant to verified financial state

Treat the IA-03B.1 spec as fixed.

## 1. REMOVE MOCK PLAYER CASH

Find the IA-03B funding logic.

Remove any hard-coded or mocked:

`₩700,000,000`

Do not replace it with another arbitrary number.

If a verified Player State is already available:
- bind to it.

If it is not available:
- show `UNAVAILABLE`
- clearly tell the user that current funding information is unavailable.

Do NOT derive cash from:
- Season initial capital
- listing price
- localStorage
- arbitrary config
- UI mock data

unless it is an authoritative verified Player State already used by PLAY.

## 2. REMOVE MOCK TRANSACTION COST

Find the current:

`1.1%`

transaction-cost logic.

Remove it.

Do not replace it with another percentage.

Search the existing verified PLAY code to determine whether an authoritative transaction-cost rule already exists.

If one exists and is safely consumable by the current UI:
- use it.

If none exists:
- display `정보 없음` / `Unavailable`.

Do not create a new transaction-cost rule.

Do not invent taxes, brokerage fees, acquisition tax, financing fees, or other costs.

## 3. REQUIRED FUNDS

Only show a numeric total when:

- listing price is verified
- transaction cost is verified

Otherwise:

`필요 자금: 정보 없음`

Do not calculate:

`listing price + fake fee`

## 4. FUNDING STATUS

Replace the current mocked condition:

`price <= 700,000,000`

with real verified state if available.

States:

- AVAILABLE + sufficient
- AVAILABLE + insufficient
- UNAVAILABLE

If unavailable, do not label the user as financially eligible or ineligible.

## 5. FINANCING

Keep:

`Unavailable / Not supported`

unless a verified existing loan engine already exists.

Do not implement:
- LTV
- DSR
- loan amount
- loan interest
- credit score
- risk spread

## 6. EXPECTED RESULT

Keep the existing read-only preview.

Only calculate values from verified inputs.

If required input is unavailable:
- show unavailable
- do not fabricate a result.

Never mutate:
- cash
- locked_cash
- debt
- property ownership
- property count
- net worth
- transactions

## 7. PRESERVE STATE MACHINE

Do not change:

`NONE`
→ `BUY_INTENT`
→ `FUNDING_CHECK`
→ `COST_CHECK`
→ `EXPECTED_RESULT`
→ `BUY_CONFIRMATION`
→ `IA_03C_ENTRY`

Do not change existing back navigation.

## 8. PRESERVE LISTING-FIRST RULE

BUY must continue to originate from:

`LISTING → LISTING DETAIL → BUY INTENT`

Never add BUY directly to COMPLEX.

## 9. NO BACKEND CHANGES

Do not create:
- new Firestore collections
- new Functions
- new APIs
- new financial rules
- new transaction-cost configuration

If verified Player State or transaction-cost data cannot be accessed without a backend change:

STOP.

Report:

- what data is missing
- where it should come from
- why current code cannot access it
- what would need to change

Do not implement the backend change.

## 10. PROTECTED AREAS

Do not modify:

- Economic Engine
- Economic Batch Processing
- Season Clock
- Property Market Engine
- Primary Transaction Engine
- Secondary Transaction Engine
- Security Rules
- Property Master
- Research Logging
- Research Event DLQ
- RealRankers legacy code
- app_main_lang.js

Only modify the minimum IA-03B UI/data-binding code.

## 11. TESTS

Run and report:

C01 hard-coded ₩700M removed
C02 1.1% mock removed
C03 verified Player State used when available
C04 unavailable Player State handled explicitly
C05 unavailable transaction cost handled explicitly
C06 no fabricated required-funds total
C07 financing remains unavailable without verified loan engine
C08 expected result is read-only
C09 cash unchanged
C10 locked cash unchanged
C11 debt unchanged
C12 ownership unchanged
C13 transaction count unchanged
C14 state machine intact
C15 IA-01 → IA-02 → IA-03A → IA-03B regression
C16 protected-area diff

## 12. VISUAL QA

Do not open browser for visual comparison.

Do not perform screenshot comparison.

Do not redesign the UI.

Only adjust basic labels/states necessary to distinguish:
- AVAILABLE
- INSUFFICIENT
- UNAVAILABLE
- 정보 없음

## 13. FINAL REPORT

Report:

1. files changed
2. exact location of removed ₩700M mock
3. exact location of removed 1.1% mock
4. source of Player State if available
5. source of transaction cost if available
6. unavailable-state behavior
7. expected-result behavior
8. C01-C16 test results
9. economic-state mutation verification
10. protected-area diff
11. whether backend changes were required
12. IA-03C readiness

## HARD STOP

Do NOT implement IA-03C.

Do NOT create actual purchase transactions.

Do NOT deduct or lock cash.

Stop after IA-03B.1 verification.
