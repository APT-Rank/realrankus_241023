# AG EXECUTION PROMPT — PLAY IA-03A DECISION UI v1.0

## Mission

Implement **IA-03A: LISTING DETAIL → DECISION**.

The goal is to add a functional Decision Layer to the existing Listing Detail screen.

This task does NOT implement actual BUY/SELL transactions.

---

## 1. Read First

Read completely:

1. `PLAY_IA-03A_DECISION_UI_IMPLEMENTATION_SPEC_v1.0.md`
2. `PLAY_INFORMATION_ARCHITECTURE_SPEC_v1.0.md`
3. latest IA-01 implementation report
4. latest IA-02 implementation report
5. latest PLAY Top-Level Main Screens implementation spec
6. latest PLAY Top-Level Main Screens AG execution prompt

Treat these as constraints.

---

## 2. Development Mode

Current priority:

```text
FUNCTION
→ INTERACTION
→ STATE
→ DATA
→ TEST
→ REGRESSION
→ VISUAL POLISH LATER
```

Use grayscale/black-white wireframe UI.

Do not perform visual polish.

---

## 3. Browser Policy — IMPORTANT

The Product Owner will visually inspect the screen manually.

Therefore, unless explicitly requested:

**DO NOT:**

- open the browser
- manually click UI
- navigate screens manually
- take screenshots
- compare screenshots
- perform visual QA

Use code-based verification only.

Required:

```text
Static
→ Syntax
→ DOM Contract
→ State Machine
→ Navigation
→ Data Contract
→ Regression
→ Protected-area Diff
```

If browser use appears necessary, STOP and report why.

---

## 4. Current Flow

Existing:

```text
WORLD
→ REGION
→ COMPLEX
→ LISTING
→ LISTING DETAIL
```

Add:

```text
LISTING DETAIL
→ DECISION
```

---

## 5. Decision Actions

Implement exactly:

```text
EXPLORE
COMPARE
WATCH
HOLD
BUY_INTENT
```

Do not add additional economic actions.

---

## 6. EXPLORE

Implement additional information exploration from Listing Detail.

It may expose:

- listing information
- complex information
- recent transaction information
- market information
- region information

It must remain within the current listing context.

Expected:

```text
DETAIL
→ EXPLORE
→ DETAIL
```

---

## 7. COMPARE

Implement comparison structure.

Minimum:

- same-complex listing
- similar-area listing
- recent transaction information

Use existing verified data where available.

Do not invent comparison values.

If data is unavailable:

```text
EMPTY / NOT AVAILABLE
```

Do not fabricate.

Expected:

```text
DETAIL
→ COMPARE
→ SELECT TARGET
→ COMPARE RESULT
→ DETAIL
```

---

## 8. WATCH

Implement:

```text
WATCH OFF
→ WATCH ON
→ WATCH OFF
```

Do not invent a new persistent backend schema.

If persistent user-specific storage is required and no existing structure supports it:

**STOP and report.**

Do not modify backend automatically.

---

## 9. HOLD

HOLD is an explicit decision state.

Implement:

```text
HOLD
→ HOLD CONFIRMED
→ DETAIL
```

HOLD must not modify:

```text
cash
property ownership
debt
transaction
```

It is a decision state, not a transaction.

---

## 10. BUY INTENT

Implement:

```text
BUY INTENT
→ IA-03B ENTRY
```

BUY INTENT means:

> The user has decided to consider this listing for purchase and proceed to the next decision stage.

It does NOT mean purchase.

Do NOT:

- deduct cash
- lock cash
- create ownership
- create transaction
- modify debt
- modify player assets

---

## 11. State Machine

Implement/test:

```text
NONE
EXPLORE
COMPARE
WATCH
HOLD
BUY_INTENT
```

Expected transitions:

```text
DETAIL
├─ EXPLORE → DETAIL
├─ COMPARE → COMPARE → DETAIL
├─ WATCH → WATCH ON/OFF → DETAIL
├─ HOLD → HOLD CONFIRMED → DETAIL
└─ BUY_INTENT → IA-03B ENTRY
```

Use the existing application's state architecture where possible.

Do not create an unnecessary new framework.

---

## 12. Research Logging

Existing research logging infrastructure is protected.

Use existing hooks if already available.

Expected conceptual alignment:

```text
EXPOSURE
→ DECISION
→ ACTION
→ VALIDATION
→ TRANSACTION
→ OUTCOME
```

This task focuses on the Decision layer.

Do not redesign the Research Logging architecture.

If new persistent research schema is required:

**STOP and report.**

---

## 13. Protected Areas

Do NOT modify:

- Economic Engine
- Batch Processing
- Season Clock
- Property Market Engine
- Primary Transaction
- Secondary Transaction
- Security Rules
- Research Logging infrastructure
- Research Event DLQ
- Property Master
- RealRankers `app_main_lang.js`
- RealRankers CSS

If a protected-area modification appears necessary:

```text
STOP
→ CONFLICT
→ affected area
→ reason
→ alternative
→ wait
```

---

## 14. DOM Contract

Ensure code contains identifiable UI contracts for:

```text
listing-detail
decision-panel
decision-explore
decision-compare
decision-watch
decision-hold
decision-buy-intent
```

Follow existing selector conventions if different.

Do not create duplicate IDs.

---

## 15. Automated / Code Tests

Implement or run code-level tests for:

### D01

```text
DETAIL → EXPLORE
```

Expected:

- decision state = EXPLORE
- listing context unchanged

### D02

```text
DETAIL → COMPARE
```

Expected:

- decision state = COMPARE
- compare context exists
- return to detail

### D03

```text
WATCH OFF → ON → OFF
```

Expected:

- watch state toggles correctly

### D04

```text
HOLD
```

Expected:

- HOLD state recorded in UI/state layer
- no economic state mutation

### D05

```text
BUY_INTENT
```

Expected:

- transition to IA-03B entry state
- no transaction

### D06

For all Decision tests:

```text
cash unchanged
property ownership unchanged
debt unchanged
transaction count unchanged
```

### D07

Regression:

```text
WORLD
→ REGION
→ COMPLEX
→ LISTING
→ LISTING DETAIL
```

still passes.

---

## 16. Data Contract

Verify:

- existing listing data remains unchanged
- no fabricated prices
- no fabricated transactions
- no fabricated participants
- no fabricated market data
- missing data produces empty/available-state UI

---

## 17. Implementation Order

Execute only in this order:

```text
1. Audit Listing Detail
2. Decision Panel
3. EXPLORE
4. COMPARE
5. WATCH
6. HOLD
7. BUY_INTENT
8. State Tests
9. Data Contract
10. IA Regression
11. Protected-area Diff
12. STOP
```

Do not start IA-03B.

---

## 18. Final Report

Report only:

### A. Files Changed

Exact files.

### B. Decision Layer

What was implemented.

### C. State Machine

Transitions and results.

### D. DOM Contract

PASS/FAIL.

### E. Functional Tests

D01-D07 results.

### F. Data Contract

PASS/FAIL.

### G. Regression

IA-01 / IA-02 results.

### H. Protected Areas

Diff result.

### I. Browser QA

Always state:

```text
NOT RUN — Product Owner performs visual verification.
```

unless the Product Owner explicitly requested browser verification.

### J. Remaining

State:

```text
Next: IA-03B BUY DECISION
```

Then STOP.

---

## 19. Hard Boundary

Do NOT implement:

- actual BUY
- actual SELL
- transaction
- cash deduction
- cash lock
- ownership change
- debt
- ranking
- notification
- final visual design

This task ends at:

```text
LISTING DETAIL
→ DECISION
→ BUY_INTENT
→ IA-03B ENTRY
```

STOP after verification.
