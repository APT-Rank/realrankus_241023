# PLAY IA-03B LISTING → BUY DECISION IMPLEMENTATION SPEC v1.0

## 1. Status

- Phase: Human Product / Functional Build
- Stage: IA-03B
- Status: EXECUTION SPEC
- Priority: Functional correctness > visual polish
- BUY starts from LISTING, never directly from COMPLEX.
- This stage prepares and confirms the purchase decision; it does NOT execute the actual transaction.

## 2. Product Decision — FIXED

The PLAY purchase hierarchy is:

WORLD
→ REGION
→ COMPLEX
→ LISTING
→ LISTING DETAIL
→ BUY INTENT
→ BUY DECISION
→ BUY CONFIRMATION
→ IA-03C ACTUAL BUY TRANSACTION

The roles are fixed:

- COMPLEX: “Which apartment complex/market should I explore?”
- LISTING: “Which actual property offer do I want to consider?”
- LISTING DETAIL: “What exactly is this offer?”
- BUY DECISION: “Can I buy it, what will it cost, and what will my state look like?”
- BUY TRANSACTION: “Execute the purchase in the economic world.”

Do not add a BUY action directly to the COMPLEX screen.

## 3. Scope

Implement only:

BUY INTENT
→ FUNDING CHECK
→ TRANSACTION COST
→ EXPECTED RESULT
→ BUY CONFIRMATION
→ IA-03C ENTRY

No actual purchase is executed in IA-03B.

## 4. Entry Condition

Entry must originate from a selected LISTING / LISTING DETAIL.

Required context:

- season_id if currently available
- participant_id if currently available
- complex_id/property_id
- listing context
- listing price / initial price from verified source
- representative area where applicable

If required data is unavailable, show an explicit unavailable state. Do not fabricate values.

## 5. BUY INTENT

Existing IA-03A BUY INTENT remains the entry point.

After BUY INTENT:

1. Preserve selected listing context.
2. Open BUY DECISION state.
3. Do not change cash.
4. Do not lock cash.
5. Do not create ownership.
6. Do not create transaction.
7. Do not change debt.
8. Do not change net worth.

## 6. FUNDING CHECK

Show the user's current financial state and the amount required for this listing.

Minimum display:

- Current available cash
- Listing price
- Required purchase funds
- Funding status: AVAILABLE / INSUFFICIENT / UNAVAILABLE

Important:

- Use actual current player state if available.
- Do not invent current cash.
- Do not invent loan eligibility.
- Do not implement new LTV/DSR/loan rules in this stage.
- If loan calculation is not yet available from a verified engine, clearly show that financing information is unavailable rather than estimating it.

Funding check is read-only.

## 7. TRANSACTION COST

Show applicable purchase cost separately from listing price.

Required structure:

Listing price
+ applicable transaction cost
= required funds

Use only an already verified transaction-cost rule.

Do not introduce taxes, financing fees, or other policies that are not already defined in the verified PLAY engine.

If the exact applicable cost cannot be obtained from the existing verified rule, display “계산 준비 중/정보 없음” rather than fabricating a number.

## 8. EXPECTED RESULT

Provide a read-only preview of the expected post-purchase state.

Possible fields:

- expected available cash
- expected property count
- expected debt
- expected net worth

The preview must be clearly labeled as:

“구매 후 예상”

It must not mutate actual player state.

Where an input is unavailable, display unavailable state instead of synthetic data.

## 9. BUY CONFIRMATION

Final confirmation must summarize:

- selected complex
- selected listing
- area
- listing price
- transaction cost
- required funds
- funding status
- expected post-purchase state

Actions:

- [구매 진행] → IA-03C entry only
- [다시 살펴보기] → return to LISTING DETAIL

The wording must not imply that the purchase has already happened.

## 10. State Machine

Required states:

NONE
→ BUY_INTENT
→ FUNDING_CHECK
→ COST_CHECK
→ EXPECTED_RESULT
→ BUY_CONFIRMATION
→ IA_03C_ENTRY

Back transitions:

BUY_INTENT → LISTING_DETAIL
FUNDING_CHECK → BUY_INTENT
COST_CHECK → FUNDING_CHECK
EXPECTED_RESULT → COST_CHECK
BUY_CONFIRMATION → LISTING_DETAIL or IA_03C_ENTRY

No economic state mutation in any IA-03B state.

## 11. Research Logging

Reuse existing Research Logging hooks.

Conceptual chain:

Exposure
→ Decision
→ Action
→ Validation
→ Transaction
→ Outcome

IA-03B may record decision/action/validation context through existing infrastructure where already supported.

Do not create a new persistent research schema.

If a new persistent schema or backend change is required:

STOP.
Report the conflict.
Do not modify the protected infrastructure.

## 12. Data Integrity Rules

Allowed:

- verified listing/property data
- verified player state
- verified transaction-cost rule
- explicit unavailable states

Forbidden:

- fabricated cash
- fabricated loan eligibility
- fabricated transaction cost
- fabricated market metrics
- synthetic purchase outcome
- fallback price not defined by the Property Market Engine

## 13. Web / Mobile

Desktop:

- existing map/contextual command panel structure
- BUY decision panel appears in the right command area
- selected listing remains the transaction context

Mobile:

- preserve existing top map / bottom command-panel structure
- BUY decision content appears in contextual bottom panel

Do not redesign the global shell.

## 14. Protected Areas

Do not modify:

- Economic Engine
- Economic batch processing
- Season Clock
- Property Market Engine
- Primary/Secondary transaction engine
- Security Rules
- Property Master
- existing Research Logging infrastructure / DLQ
- RealRankers legacy code
- app_main_lang.js
- verified IA-01 / IA-02 / IA-03A behavior except where required for navigation integration

## 15. Functional Verification

Implement code-level tests for:

B01: BUY starts from LISTING DETAIL only.
B02: BUY INTENT preserves selected listing.
B03: FUNDING CHECK uses current player state when available.
B04: unavailable financing data is not fabricated.
B05: transaction cost uses verified rule or explicit unavailable state.
B06: expected result is read-only.
B07: BUY CONFIRMATION summarizes the selected listing.
B08: “구매 진행” enters IA-03C only.
B09: no cash mutation.
B10: no cash lock.
B11: no ownership mutation.
B12: no debt mutation.
B13: no transaction creation.
B14: IA-01 → IA-02 → IA-03A regression remains intact.
B15: protected-area diff is clean.

## 16. Visual Policy

Do not perform pixel-perfect visual QA.

Use simple, clear UI components and existing styles.

The purpose of this stage is:

- correct information
- correct state transition
- correct interaction
- correct economic-state protection

Visual refinement comes later.

## 17. Definition of Done

IA-03B is complete when:

1. BUY begins from LISTING.
2. User can progress through funding → cost → expected result → confirmation.
3. User can return to listing detail.
4. Actual economic state never changes.
5. No transaction is created.
6. No fake financial data is introduced.
7. IA-01/02/03A regression passes.
8. Protected-area diff passes.
9. Code-level verification passes.

## 18. Next Stage

IA-03C:

BUY CONFIRMATION
→ server-side purchase validation
→ transaction atomicity
→ cash lock/deduction
→ ownership
→ debt if applicable
→ transaction log
→ research event
→ result
→ MY WORLD

IA-03C is the first stage allowed to mutate the economic world.
