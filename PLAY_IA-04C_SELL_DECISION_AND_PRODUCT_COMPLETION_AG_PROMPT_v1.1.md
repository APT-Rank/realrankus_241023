# PLAY IA-04C SELL DECISION + PRODUCT COMPLETION
# AG EXECUTION PROMPT v1.1

## ROLE

IA-04C SELL DECISION을 구현한다.

동시에 지금까지 만들어진 PLAY UI의 모든 사용자 노출 interaction을 전수 조사하고, 기능이 연결되지 않은 요소를 **제거하지 말고 실제 PLAY 기능으로 어떻게 연결할지 정의하고 구현한다.**

중요:

**Human Season은 SELL만 구현했다고 시작하지 않는다.**

Human Season 이전에:

- 모든 핵심 기능
- 모든 사용자 노출 interaction
- Functional E2E
- Research Traceability
- Desktop Visual Tuning
- Mobile Tuning
- Human E2E

까지 완료되어야 한다.

---

# 1. READ FIRST

먼저 반드시 읽는다.

1. `PLAY_IA-04C_SELL_DECISION_AND_PRODUCT_COMPLETION_SPEC_v1.1.md`
2. `PLAY_IA-04B_MY_WORLD_TO_PROPERTY_DETAIL_SPEC_v1.0.md`
3. `PLAY_IA-04B_IMPLEMENTATION_REPORT.md`
4. IA-03C Verification report
5. IA-04A Implementation report
6. IA-04C 이전 PLAY architecture / UX / IA documents

그리고 실제 repository 전체의 PLAY frontend/backend 구조를 확인한다.

---

# 2. CURRENT STATE

완료된 주요 단계:

IA-01 WORLD → REGION → COMPLEX
IA-02 COMPLEX → LISTING
IA-03A LISTING → DECISION
IA-03B BUY DECISION
IA-03C ACTUAL BUY
IA-04A BUY RESULT → MY WORLD
IA-04B MY WORLD → PROPERTY DETAIL

현재 구현:

`IA-04C SELL DECISION`

---

# 3. PHASE A — FUNCTION DISCOVERY FIRST

SELL 구현과 병행하여 전체 PLAY frontend의 interaction inventory를 만든다.

검색 대상:

- button
- anchor
- onclick
- addEventListener
- card click
- tab
- filter
- sort
- breadcrumb
- modal
- close
- back
- map click
- mobile navigation
- menu
- watch
- compare
- explore
- buy
- sell
- hold
- confirm
- cancel
- notification/settings

---

# 4. DO NOT REMOVE UNCONNECTED FUNCTIONS

**절대 "기능이 연결되지 않았다"는 이유만으로 버튼이나 interaction을 삭제하지 않는다.**

먼저 각각에 대해 다음을 분석한다.

1. User Intent
2. Product Purpose
3. Expected State
4. Required Data
5. Required Backend
6. Research Logging
7. Next Action
8. Implementation Phase

---

# 5. FUNCTION CLASSIFICATION

각 interaction을:

### CONNECTED
실제 기능 정상.

### INCOMPLETE
일부 기능만 존재.

→ 부족한 부분 구현.

### UNCONNECTED BUT VALUABLE
UI는 존재하지만 기능 없음.

→ **제거 금지.**
→ 목적 정의.
→ 기능 설계.
→ 가능한 경우 실제 구현.

### INTENTIONALLY DISABLED
선행 기능/정책 때문에 현재 구현 불가.

→ 이유와 Target Phase 명시.

### NOT APPLICABLE
실제 사용자 기능이 아님.

---

# 6. FUNCTION DESIGN RECORD

UNCONNECTED / INCOMPLETE 항목마다:

- Function ID
- Screen
- Element
- User Intent
- Product Purpose
- Current State
- Required State
- Data Required
- Backend Required
- Research Logging
- Implementation Plan
- Dependency
- Target Phase
- Verification

을 기록한다.

파일:

`PLAY_FUNCTION_DESIGN_AND_IMPLEMENTATION_PLAN.md`

---

# 7. FUNCTION IMPLEMENTATION RULE

단순히 handler만 붙이지 않는다.

각 기능은:

```text
USER INTENT
 ↓
USER ACTION
 ↓
STATE
 ↓
DATA / VALIDATION
 ↓
RESULT
 ↓
NEXT ACTION
```

까지 구현한다.

---

# 8. IA-04C SELL DECISION

구현:

```text
MY WORLD
 ↓
MY PROPERTY
 ↓
PROPERTY DETAIL
 ↓
SELL DECISION
 ↓
SELL INTENT
```

제공:

- ownership context
- acquisition price
- acquisition date
- holding period
- available market context
- recent sales when authoritative
- HOLD
- SELL INTENT
- CANCEL

---

# 9. SELL INTENT BOUNDARY

IA-04C에서는 경제 mutation 금지.

금지:

- cash mutation
- ownership deletion
- listing creation
- transaction creation
- settlement
- matching

SELL INTENT는 decision/action 수준.

---

# 10. NO FAKE DATA

금지:

- current market value
- expected sale price
- expected profit
- expected return
- AI price
- fake buyer
- fake market volume
- fake transaction

없으면:

`정보 없음`

---

# 11. RESEARCH LOGGING

기존 infrastructure 재사용.

```text
EXPOSURE
 ↓
DECISION
 ↓
ACTION
 ↓
VALIDATION
```

SELL context, SELL decision, SELL intent, HOLD, CANCEL, validation을 trace할 수 있도록 한다.

새 schema가 필요하면 STOP.

---

# 12. FUNCTION PRIORITY

구현 우선순위:

1. Core gameplay
2. Decision / Action
3. Navigation
4. Data exploration
5. Compare / Watch / Filter / Sort
6. Result / Feedback
7. Mobile interaction
8. Utility
9. Decorative interaction

---

# 13. VISUAL TUNING

기능 연결성이 확보된 후 Visual Tuning.

Desktop:

```text
LEFT = WORLD MAP
RIGHT = CONTEXTUAL COMMAND PANEL
```

Mobile:

```text
TOP = WORLD MAP
BOTTOM = CONTEXTUAL COMMAND PANEL
```

튜닝:

- information hierarchy
- layout
- spacing
- typography
- cards
- buttons
- filters
- breadcrumb
- modal
- empty/error states
- loading/success/failure
- responsive behavior
- mobile touch
- interaction feedback
- PLAY visual identity

PLAY가 일반 부동산 dashboard처럼 보이지 않도록 한다.

---

# 14. VISUAL PRINCIPLE

Visual은 장식이 아니다.

다음 행동을 이해시켜야 한다.

```text
DISCOVER
→ EXPLORE
→ JUDGE
→ ACT
→ RESULT
→ NEW DISCOVERY
```

기능보다 visual polish를 먼저 하지 않는다.

---

# 15. IA-04D / IA-04E

IA-04C 이후:

IA-04D:

```text
SELL DECISION
 ↓
SELL CONFIRMATION
 ↓
SELL LISTING
 ↓
SECONDARY MARKET
 ↓
OTHER PARTICIPANT BUY
 ↓
MATCH
 ↓
TRANSACTION
```

IA-04E:

```text
SELL RESULT
 ↓
PLAYER STATE REFRESH
 ↓
MY WORLD
```

IA-04C에서 mutation을 미리 만들지 않는다.

---

# 16. FUNCTIONAL E2E

IA-04E 이후:

```text
LOGIN
 ↓
SEASON
 ↓
STARTING CAPITAL
 ↓
WORLD
 ↓
REGION
 ↓
COMPLEX
 ↓
LISTING
 ↓
DECISION
 ↓
BUY
 ↓
BUY RESULT
 ↓
MY WORLD
 ↓
PROPERTY DETAIL
 ↓
SELL DECISION
 ↓
SELL
 ↓
SECONDARY MARKET
 ↓
MATCH
 ↓
SELL RESULT
 ↓
MY WORLD
 ↓
WORLD
```

실제 데이터와 실제 backend를 사용한다.

---

# 17. MOBILE E2E

검증:

- WORLD
- REGION
- COMPLEX
- LISTING
- LISTING DETAIL
- BUY
- BUY RESULT
- MY WORLD
- PROPERTY DETAIL
- SELL

---

# 18. HUMAN SEASON GATE

다음을 모두 PASS해야 한다.

- Economic Engine
- Property Market
- Transaction
- Reliability
- Research Logging / DLQ
- BUY
- SELL
- MY WORLD
- all user-visible functions inventoried
- all core functions implemented or explicitly approved Target Phase
- no unexplained broken interaction
- Functional E2E
- Research traceability
- Desktop Visual Tuning
- Mobile Visual Tuning
- Human E2E
- no fake business/economic data
- no critical UX blocker
- Product Owner approval

하나라도 FAIL:

`NOT_READY`

---

# 19. IMPORTANT — NO CHECKLIST GAMING

Human Season Gate를 통과하기 위해:

- 버튼 삭제
- 기능 숨김
- test assertion 약화
- fake data
- mock success
- 임의 disabled 처리

를 하지 않는다.

특히 **사용자에게 의미가 있는 기능을 단순히 제거하여 "미연결 버튼 0개"를 만드는 행위는 금지한다.**

---

# 20. FAILURE LOOP

```text
FAIL
 ↓
ROOT CAUSE
 ↓
MINIMAL FIX
 ↓
SAME TEST
 ↓
REGRESSION
 ↓
PASS
```

---

# 21. PROTECTED AREAS

불필요하게 수정하지 않는다.

- Economic Engine
- Season Clock
- Batch
- Reliability
- Security Rules
- Research Logging core
- Research DLQ
- Property Master
- IA-03C purchase transaction
- RealRankers core
- app_main_lang.js

필수 변경이면 STOP.

---

# 22. REPORTS

반드시 생성:

`PLAY_IA-04C_IMPLEMENTATION_REPORT.md`

`PLAY_FUNCTION_INVENTORY_AND_UNCONNECTED_ACTION_AUDIT.md`

`PLAY_FUNCTION_DESIGN_AND_IMPLEMENTATION_PLAN.md`

`PLAY_VISUAL_TUNING_REPORT.md`

`PLAY_FUNCTIONAL_E2E_FINAL_REPORT.md`

`PLAY_HUMAN_SEASON_ENTRY_GATE_REPORT.md`

---

# 23. FINAL STATUS

IA-04C:

`READY FOR IA-04D`

or

`BLOCKED`

전체 Product Completion:

`HUMAN_SEASON_READY`

or

`NOT_READY`

절대:

- perfect
- flawless
- 100% complete

를 사용하지 않는다.

---

# 24. STOP CONDITIONS

다음이 필요하면 즉시 STOP:

- new economic rule
- new transaction architecture
- new Firestore schema
- new Security Rule
- modification of verified IA-03C transaction
- new valuation model
- new Secondary Market architecture
- changing fixed UX principles
- changing fixed IA without Product Owner approval

STOP report:

1. Conflict
2. Why
3. Affected area
4. Options
5. Recommendation

Product Owner approval 전에는 진행하지 않는다.
