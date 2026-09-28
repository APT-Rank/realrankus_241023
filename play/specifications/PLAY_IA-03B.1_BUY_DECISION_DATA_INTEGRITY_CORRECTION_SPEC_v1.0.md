# PLAY IA-03B.1 — BUY DECISION DATA INTEGRITY CORRECTION SPEC v1.0

## 1. Status

- Phase: Human Product / Functional Build
- Stage: IA-03B.1
- Purpose: Correct IA-03B BUY Decision data handling before IA-03C
- Status: EXECUTION SPEC
- Priority: Data integrity > functional continuity > visual polish

## 2. Source Basis

This correction is based on the latest IA-03B implementation report.

Current implementation reports:
- BUY Decision state machine is implemented.
- B01-B15 were reported PASS.
- Actual economic state was not mutated.
- However, transaction cost is currently represented by a mocked 1.1% value.
- Funding check currently uses a mocked ₩700,000,000 available-cash condition.

These two mock financial values must be removed before IA-03C.

## 3. Correction Objective

Correct only the following:

1. Remove the hard-coded / mocked ₩700,000,000 player cash from BUY Decision logic.
2. Remove the mocked 1.1% transaction-cost calculation.
3. Preserve the existing IA-03B state machine and UI flow.
4. Do not implement IA-03C.
5. Do not introduce new financial rules.

## 4. Fixed Data Rules

### 4.1 Player Cash

Priority:

1. Use an existing verified Player State if it is already available to the current PLAY frontend flow.
2. If a verified Player State is not available, display an explicit unavailable state.
3. Never insert a fallback value such as ₩700,000,000.

Allowed states:

- AVAILABLE
- INSUFFICIENT
- UNAVAILABLE

If unavailable, UI should communicate that current funding information is unavailable.

Do not infer cash from:
- Season initial capital
- mock configuration
- listing price
- localStorage
- arbitrary constants

unless that source is already an authoritative verified Player State.

### 4.2 Financing

Do not implement or estimate:
- LTV
- DSR
- loan eligibility
- loan amount
- loan interest
- credit/risk spread

If no verified loan engine is connected, retain:
`Unavailable / Not supported`

### 4.3 Transaction Cost

Remove the mocked 1.1% transaction cost.

Use a transaction-cost rule only if an already verified PLAY engine/API exposes it.

If no verified transaction-cost rule is available:
- show transaction cost as `정보 없음` / `Unavailable`
- do not calculate a numeric fee
- do not create a synthetic fee
- do not copy an unrelated rule from another subsystem

Do not introduce:
- tax
- brokerage fee
- acquisition tax
- financing fee
- policy fee
- any new percentage

### 4.4 Required Funds

Only calculate a numeric required-funds total when both are verified:

`listing price + verified transaction cost`

If transaction cost is unavailable:

`required funds = 정보 없음`

Do not present a fake total.

## 5. Expected Result

The Expected Result panel must remain read-only.

If verified current cash and verified transaction cost are available, calculate the preview from those values.

If one or more required inputs are unavailable:
- do not manufacture a number
- display unavailable state for the affected field
- clearly label the section `구매 후 예상`

Do not mutate:
- cash
- locked_cash
- debt
- property ownership
- property count
- net worth
- transaction count

## 6. Funding Progression

Do not gate purchase progression using a mocked condition such as:

`price <= 700,000,000`

Instead:

- AVAILABLE + sufficient → allow progression
- AVAILABLE + insufficient → show insufficient funds
- UNAVAILABLE → show unavailable funding state

If the current product flow requires a user to reach confirmation for functional testing despite unavailable financial data, preserve the decision flow without pretending that the purchase is financially validated. Do not label an unavailable state as AVAILABLE.

## 7. State Machine — DO NOT CHANGE

Preserve:

NONE
→ BUY_INTENT
→ FUNDING_CHECK
→ COST_CHECK
→ EXPECTED_RESULT
→ BUY_CONFIRMATION
→ IA_03C_ENTRY

Existing back navigation must remain intact.

## 8. Listing Context — DO NOT CHANGE

BUY still begins from LISTING / LISTING DETAIL.

Do not add BUY to COMPLEX.

Preserve:
- complex_id/property_id
- selected listing
- listing price
- area
- existing listing context

## 9. Protected Areas

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

Only modify the minimum PLAY UI/data-binding logic required for IA-03B.1.

## 10. No New Backend

Do not create:
- new API
- new Firestore collection
- new Cloud Function
- new financial rule
- new transaction-cost configuration

If obtaining verified Player State or transaction cost requires a backend change that does not already exist:

STOP and report the dependency.

Do not invent an integration.

## 11. Functional Tests

Run:

C01: No hard-coded ₩700,000,000 funding value remains in IA-03B logic.

C02: No mocked 1.1% transaction-cost calculation remains.

C03: Existing verified Player State is used when available.

C04: Missing Player State results in explicit UNAVAILABLE state.

C05: Missing verified transaction-cost rule results in explicit UNAVAILABLE state.

C06: Required-funds total is not fabricated when transaction cost is unavailable.

C07: Financing remains unavailable when no verified loan engine exists.

C08: Expected Result remains read-only.

C09: Cash unchanged.

C10: Locked cash unchanged.

C11: Debt unchanged.

C12: Ownership unchanged.

C13: Transaction count unchanged.

C14: IA-03B state machine remains intact.

C15: IA-01 → IA-02 → IA-03A → IA-03B regression passes.

C16: Protected-area diff is clean.

## 12. Visual Policy

Do not perform pixel-perfect Visual QA.

Only make small UI changes necessary to communicate:
- available
- insufficient
- unavailable
- information unavailable

No visual redesign.

## 13. Definition of Done

IA-03B.1 is complete when:

1. The ₩700M mock cash is removed.
2. The 1.1% mock transaction cost is removed.
3. No fabricated financial values remain in IA-03B.
4. Existing verified data is used where available.
5. Missing data is explicitly represented as unavailable.
6. State machine remains unchanged.
7. No economic state is mutated.
8. Regression passes.
9. Protected-area diff passes.
10. IA-03C is NOT implemented.

## 14. Next Stage

After IA-03B.1 is verified and frozen:

`IA-03C ACTUAL BUY TRANSACTION`

Only IA-03C may introduce actual economic mutation.
