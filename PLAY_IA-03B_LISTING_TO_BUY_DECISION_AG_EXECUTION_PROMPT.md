# AG EXECUTION PROMPT — PLAY IA-03B BUY DECISION

You are implementing PLAY IA-03B.

## READ FIRST

Read these before changing code:

1. PLAY IA-03B LISTING → BUY DECISION IMPLEMENTATION SPEC v1.0
2. PLAY INFORMATION ARCHITECTURE SPEC v1.0
3. Latest IA-01 implementation report
4. Latest IA-02 implementation report
5. Latest IA-03A implementation report
6. Current PLAY source under `/play`

Treat the IA-03B spec as Product Owner approved and fixed.

## CORE PRODUCT RULE

BUY starts from LISTING.

Never add direct BUY execution from COMPLEX.

Hierarchy:

COMPLEX
→ LISTING
→ LISTING DETAIL
→ BUY INTENT
→ BUY DECISION
→ BUY CONFIRMATION
→ IA-03C ACTUAL BUY

COMPLEX explains the apartment complex.
LISTING is the actual purchase target.

## IMPLEMENT ONLY IA-03B

Implement:

BUY INTENT
→ FUNDING CHECK
→ TRANSACTION COST
→ EXPECTED RESULT
→ BUY CONFIRMATION
→ IA-03C ENTRY

Do NOT implement the actual purchase.

## FUNCTION-FIRST POLICY

Use simple/basic UI objects.

Do not spend time on visual polish, animations, pixel matching, screenshots, or browser Visual QA.

Prioritize:

1. correct data
2. correct interaction
3. correct state machine
4. correct economic-state protection
5. regression safety

## BUY INTENT

When the user enters BUY INTENT from a selected listing:

- preserve listing context
- enter BUY DECISION
- show the selected listing
- do not mutate economic state

No:

- cash deduction
- cash lock
- ownership
- debt
- transaction
- net worth mutation

## FUNDING CHECK

Display:

- current available cash, if verified player state exists
- listing price
- required purchase funds
- funding status

Do not fabricate:

- cash
- loan eligibility
- LTV
- DSR
- financing amount

If financing information is not supported by an existing verified engine, show unavailable state.

## TRANSACTION COST

Use only an existing verified transaction-cost rule.

If unavailable, show unavailable state.

Do not invent taxes or fees.

## EXPECTED RESULT

Show a read-only preview:

- expected cash
- expected property count
- expected debt
- expected net worth

Label clearly:

`구매 후 예상`

Never write this preview into actual player state.

## BUY CONFIRMATION

Summarize:

- complex
- listing
- area
- price
- transaction cost
- required funds
- funding status
- expected result

Buttons:

`구매 진행` → IA-03C ENTRY ONLY

`다시 살펴보기` → LISTING DETAIL

Do not imply that the transaction has already occurred.

## STATE MACHINE

Implement:

NONE
→ BUY_INTENT
→ FUNDING_CHECK
→ COST_CHECK
→ EXPECTED_RESULT
→ BUY_CONFIRMATION
→ IA_03C_ENTRY

Back navigation must work.

## RESEARCH LOGGING

Reuse existing hooks only.

Do not create new persistent research schemas.

If new backend/persistent schema is required:

STOP.
Report the conflict.
Do not modify infrastructure.

## DATA RULE

Use only verified listing/property/player data.

No fabricated:

- price
- cash
- loan eligibility
- transaction cost
- market metrics
- outcome

Explicit unavailable states are preferred over fake values.

## WEB / MOBILE

Preserve:

Desktop:
map left / contextual command panel right.

Mobile:
map top / contextual command panel bottom.

Do not redesign Global Shell.

## PROTECTED AREAS

Do not modify:

- Economic Engine
- Batch Processing
- Season Clock
- Property Market Engine
- Primary/Secondary Transaction Engine
- Security Rules
- Property Master
- Research Logging infrastructure / DLQ
- RealRankers legacy code
- app_main_lang.js
- verified IA-01/02/03A behavior

## TESTS

Implement/code-verify:

B01 BUY starts from LISTING DETAIL
B02 selected listing preserved
B03 current player state used when available
B04 no fabricated financing data
B05 verified transaction cost or unavailable state
B06 expected result read-only
B07 confirmation summary correct
B08 purchase button enters IA-03C only
B09 cash unchanged
B10 cash lock unchanged
B11 ownership unchanged
B12 debt unchanged
B13 transaction count unchanged
B14 IA-01 → IA-02 → IA-03A regression
B15 protected-area diff

## FINAL REPORT

After implementation, produce:

1. files changed
2. BUY decision state machine
3. listing context/data source
4. funding check behavior
5. transaction-cost behavior
6. expected-result behavior
7. confirmation behavior
8. B01–B15 results
9. economic-state mutation verification
10. protected-area diff
11. Research Logging impact
12. remaining IA-03C work

Do not proceed into IA-03C.

STOP after IA-03B is verified.
