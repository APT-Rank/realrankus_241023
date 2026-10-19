# AG EXECUTION PROMPT
# PLAY HERO & TIME-SLIP TEST MODE v1.0

## ROLE

Implement and verify the HERO participant and independently toggleable Time-Slip Test Mode for PLAY.

Target:

`/play/index.html`

Do NOT run the full 10P simulation as part of this task.

---

# 1. PRIMARY OBJECTIVE

Create one special participant:

```text
HERO
```

HERO represents the real user/viewer inside the Simulation World.

The experience should be:

```text
I am HERO.
The world is moving around me.
Other participants are making decisions.
My assets are changing.
30 simulated years are passing.
```

At the same time, create a Test Mode switch that can turn the Time-Slip experience ON/OFF without changing the underlying economic system.

---

# 2. FIRST: AUDIT

Before implementation:

1. Inspect current Participant schema.
2. Inspect AI Participant creation.
3. Inspect Player State.
4. Inspect current `/play/index.html`.
5. Inspect current six top-level views.
6. Inspect Live State implementation.
7. Inspect Simulation controls.
8. Inspect existing environment/test flags.
9. Inspect Firestore collections and backend functions relevant to Participant creation.
10. Identify whether HERO can be represented by existing Participant infrastructure without a schema rewrite.

Do not invent a new architecture if existing infrastructure can support it cleanly.

---

# 3. HERO PARTICIPANT

Create exactly one HERO Participant for the test context.

Preferred identity:

```text
participant_id = HERO
participant_type = HERO
```

If the existing schema requires a different ID format, use a stable equivalent and document the mapping.

---

# 4. HERO ECONOMIC PARITY

HERO must use the same economic rules as AI Participants.

Initial state:

```text
cash = 700,000,000
debt = 0
property = 0
financial_asset = 0
net_worth = 700,000,000
```

Do not grant:

- extra cash
- free property
- special fee
- special LTV
- priority
- validation bypass
- transaction bypass

If implementation makes HERO special economically, STOP and report why.

---

# 5. HERO ACTIONS

HERO must be compatible with:

```text
EXPLORE
COMPARE
WATCH
HOLD
BUY
SELL
```

Actual user interaction should be represented as HERO Decision/Action where the existing research architecture supports it.

---

# 6. HERO UI

Connect:

```text
MY ASSET
```

to HERO's authoritative Player State.

Show, where supported:

- cash
- locked cash
- debt
- property count
- net worth
- economic freedom
- owned properties
- recent decisions
- transaction history

Do not create a second browser-only economic state.

---

# 7. HERO IN OTHER VIEWS

HOME:

Show HERO's current state and relevant world activity.

MAP:

Clearly distinguish HERO-owned property where useful.

REGION:

Show HERO interest/holdings/activity where supported.

PEOPLE:

Show other participants separately from HERO.

SEASON RANKING:

Include HERO according to the approved ranking rules unless the current product explicitly defines another policy.

---

# 8. HERO VS AI

Live Activity must distinguish:

```text
YOU / HERO
```

from:

```text
AI / P001 / P002 ...
```

Example:

```text
YOU
HERO bought Property A

AI
P003 bought Property B
```

Do not fabricate activity.

---

# 9. TEST MODE

Implement an explicit:

```text
TIME-SLIP TEST MODE
```

Default:

```text
OFF
```

When OFF:

- hide Run
- hide Pause
- hide Step
- hide Speed
- hide test-only activity controls
- hide test-only simulation controls

When ON:

- show simulated time
- show Run/Pause/Step/Stop
- show speed
- show live activity
- show HERO observation context

---

# 10. IMPORTANT SECURITY RULE

A UI toggle is NOT backend authority.

Do not implement:

```text
localStorage.testMode = true
```

as sufficient authority to run a backend simulation.

The authorized test configuration must be enforced through an appropriate operator/development configuration.

Client-side state may control presentation only.

---

# 11. SAFE DEFAULT

New session:

```text
TIME-SLIP = OFF
```

Unless an authorized environment/test configuration explicitly enables it.

---

# 12. ON/OFF BEHAVIOR

### OFF → ON

Load existing authoritative state.

Do not:

- create another HERO
- create another Season
- create duplicate listeners
- restart economic state
- reset Firestore
- create transactions

### ON → OFF

Hide test controls.

Do not:

- delete data
- reset Season
- reset HERO
- stop unrelated backend state unless the operator explicitly invokes PAUSE

### OFF → ON again

Resume observing the existing authoritative state.

---

# 13. TIME-SLIP CONTROLS

When ON, expose:

```text
RUN
PAUSE
STEP
STOP
```

and:

```text
1x
5x
20x
100x
```

These controls must call the real Simulation authority.

Do not simulate time locally with JavaScript timers.

---

# 14. STEP

One click:

```text
STEP
```

must advance exactly:

```text
1 simulated period
```

Verify:

```text
N → N+1
```

not N+2 and not N.

---

# 15. FULL NAVIGATION

Verify real-time propagation across:

```text
HOME
MAP
REGION
MY ASSET
PEOPLE
SEASON RANKING
```

One HERO transaction or AI transaction must propagate to all affected views.

---

# 16. LIVE STATE

Use the existing centralized Live State architecture.

Do not create separate Firestore listener logic for each page if the shared state layer can handle it.

Avoid duplicate listeners.

---

# 17. RESEARCH

HERO actions must remain compatible with:

```text
Exposure
Decision
Action
Validation
Transaction
Outcome
```

Include:

```text
participant_type = HERO
```

where supported.

Do not bypass Research Logger.

---

# 18. NO BACKEND CORE CHANGES

Do not modify:

- Economic Engine
- Property Master
- Supply Policy
- IA-03C transaction logic
- IA-04D transaction logic
- Security Rules
- Idempotency
- Research Event durability
- Reconciliation

unless an actual dependency is proven.

If dependency is found:

STOP and report it before modifying protected code.

---

# 19. TEST PLAN

## TEST H01 — HERO Creation

Verify exactly one HERO exists for the test context.

## TEST H02 — HERO Initial State

Verify:

```text
700,000,000 cash
0 debt
0 property
700,000,000 net worth
```

## TEST H03 — Economic Parity

Compare HERO rules with one AI participant.

No hidden advantage.

## TEST H04 — HERO My Asset

Verify authoritative state.

## TEST H05 — HERO Activity

Verify actual HERO action appears in activity.

## TEST H06 — HERO Ranking

Verify ranking calculation consistency.

## TEST H07 — Test Mode OFF

Verify all test-only controls are hidden/inactive.

## TEST H08 — Test Mode ON

Verify authorized operator can expose controls.

## TEST H09 — Toggle Integrity

OFF → ON → OFF → ON.

No duplicate HERO.

No duplicate listener.

No duplicate transaction.

No reset.

## TEST H10 — Refresh

Refresh while ON and OFF.

Verify correct state.

## TEST H11 — Six View Propagation

One state change must appear consistently across:

```text
HOME
MAP
REGION
MY ASSET
PEOPLE
SEASON RANKING
```

## TEST H12 — Unauthorized Access

Verify unauthorized client cannot use Test Mode to gain backend simulation authority.

---

# 20. EVIDENCE

Create:

```text
artifacts/hero_time_slip/
├── hero_participant.json
├── hero_initial_state.json
├── hero_state_trace.json
├── hero_ai_rule_parity.json
├── hero_navigation_trace.json
├── hero_ranking_trace.json
├── test_mode_on.json
├── test_mode_off.json
├── test_mode_toggle_integrity.json
├── refresh_persistence.json
├── no_duplicate_execution.json
├── no_privilege_escalation.json
└── final_hero_time_slip_report.md
```

Every PASS must be backed by actual runtime evidence.

Do not fabricate evidence.

---

# 21. FINAL REPORT

Create:

```text
PLAY_HERO_TIME_SLIP_TEST_MODE_IMPLEMENTATION_REPORT.md
```

Include:

1. Existing architecture audit
2. HERO schema
3. HERO creation
4. HERO initial state
5. Economic parity
6. HERO UI mapping
7. Test Mode architecture
8. ON behavior
9. OFF behavior
10. Toggle behavior
11. Six-view propagation
12. Research mapping
13. Security verification
14. Refresh/reconnect
15. Duplicate execution checks
16. Evidence locations
17. Known limitations
18. Final verdict

---

# 22. FINAL VERDICT

Use exactly one:

```text
READY FOR HERO TIME-SLIP SIMULATION
```

or:

```text
HERO/TIME-SLIP VERIFIED — FINDINGS REMAIN
```

or:

```text
BLOCKED — HERO/TIME-SLIP INTEGRATION FAILURE
```

Do not run the full 10P simulation automatically after this task.

---

# 23. NON-GOALS

Do NOT:

- run full 10P/360 simulation
- run 100P
- start Human Season
- change economic rules
- change Property Master
- change supply policy
- change transaction atomicity
- change Security Rules
- add economic privileges to HERO
- delete existing Simulation data
- silently fix unrelated bugs

---

# 24. FINAL PRINCIPLE

The implementation is successful only if:

```text
HERO
  ↓
lives under the same economic rules
  ↓
sees the same world
  ↓
acts inside the same market
  ↓
changes the same authoritative state
  ↓
and the user experiences that state
as a 30-year TIME-SLIP.
```

The Test Mode is only the switch that exposes this experience for controlled testing.

It must not become a hidden second economic system.
