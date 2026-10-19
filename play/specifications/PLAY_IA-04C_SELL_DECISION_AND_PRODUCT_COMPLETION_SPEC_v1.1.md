# PLAY IA-04C SELL DECISION + PRODUCT COMPLETION SPEC v1.1

Status: EXECUTION SPEC
Version: v1.1
Phase: Human Product / Functional Build → Product Completion
Stage: IA-04C
Precondition: IA-04B READY FOR NEXT STEP

---

# 1. Purpose

IA-04C의 1차 목적은 다음 SELL 의사결정 경험을 구현하는 것이다.

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

그러나 IA-04C는 SELL 버튼 하나를 만드는 단계로 끝나지 않는다.

현재 PLAY에는 이미 여러 사용자 노출 버튼과 interaction이 있으며, 일부는 기능이 완성되었고 일부는 기능 연결이 불완전할 수 있다.

따라서 IA-04C부터는 다음을 병행한다.

1. SELL Decision 기능 구현
2. 사용자 노출 UI/interaction 전수 조사
3. 기능이 연결되지 않은 요소의 **제거가 아니라 기능 목적과 구현 방법을 정의**
4. 필요한 데이터/state/backend를 확인하고 실제 기능으로 연결
5. 기능 구현 후 실제 사용자 흐름으로 검증
6. Functional E2E
7. Visual Tuning
8. Responsive/Mobile Tuning
9. Human E2E 준비
10. Human Season 진입 Gate 검증

**기능 미연결 요소는 원칙적으로 제거하지 않는다.**
먼저 "이 요소가 PLAY에서 어떤 사용자 가치를 만들어야 하는가?"를 판단하고, 가능한 기능 구현 경로를 정의한다.

---

# 2. Product Completion Principle

PLAY는 다음을 모두 충족해야 한다.

```text
FUNCTIONAL COMPLETENESS
        +
INTERACTION COMPLETENESS
        +
DATA INTEGRITY
        +
END-TO-END COMPLETENESS
        +
VISUAL QUALITY
        +
RESPONSIVE QUALITY
        +
RESEARCH TRACEABILITY
        =
HUMAN SEASON READY
```

단순히 버튼이 존재하는 것만으로 기능 완료로 보지 않는다.

각 사용자 노출 interaction은:

```text
USER INTENT
 ↓
USER ACTION
 ↓
STATE CHANGE
 ↓
DATA / VALIDATION
 ↓
RESULT
 ↓
NEXT ACTION
```

으로 이어져야 한다.

---

# 3. Current Position

완료:

- Economic Engine
- Property Market Engine
- Transaction Engine
- Reliability / Recovery
- AI Stress Test
- Research Data Schema
- Research Logging / DLQ
- UX Principles
- IA-01 WORLD → REGION → COMPLEX
- IA-02 COMPLEX → LISTING
- IA-03A LISTING → DECISION
- IA-03B BUY DECISION
- IA-03C ACTUAL BUY
- IA-04A BUY RESULT → MY WORLD
- IA-04B MY WORLD → PROPERTY DETAIL

현재:

```text
IA-04C SELL DECISION
```

이후:

```text
IA-04D SELL / SECONDARY MARKET
IA-04E SELL RESULT → MY WORLD
↓
UNCONNECTED / INCOMPLETE FUNCTION DISCOVERY
↓
FUNCTION DESIGN & IMPLEMENTATION
↓
FUNCTIONAL E2E
↓
VISUAL TUNING
↓
RESPONSIVE / MOBILE TUNING
↓
HUMAN E2E
↓
SEASON 0
↓
HUMAN SEASON 1
```

---

# 4. IA-04C Scope

## IN SCOPE

### A. SELL Decision

- MY WORLD → owned property
- PROPERTY DETAIL → SELL entry
- Sell context
- Sell decision
- Sell intent
- HOLD / CANCEL
- decision state
- validation state
- return to Property Detail / My World

### B. Sell Context

가능한 실제 데이터:

- property_id
- complex name
- representative area
- ownership status
- acquisition price
- acquisition date
- holding period
- available market/reference information
- recent sales raw information when authoritative

### C. User Decision

가능한 상태:

```text
NONE
EXPLORE
COMPARE
HOLD
SELL_INTENT
CANCEL
```

이번 단계에서 SELL_INTENT는:

> "이 자산을 매도하는 방향으로 진행하겠다."

라는 의도만 기록한다.

실제 매도 주문/거래는 IA-04D에서 수행한다.

---

# 5. IA-04C OUT OF SCOPE

이번 단계에서 구현하지 않는다.

- 실제 SELL transaction
- Secondary Market matching
- BUY ↔ SELL matching
- cash increase
- ownership transfer
- transaction creation
- settlement
- price prediction
- artificial current market value
- AI price recommendation
- People system
- Season ranking
- Rewards
- Notification infrastructure
- new economic rules

단, 현재 존재하는 사용자 노출 interaction의 기능 완성 여부는 별도 Product Completion Audit에서 조사한다.

---

# 6. SELL Decision UX

Property Detail에서:

```text
PROPERTY DETAIL
      ↓
   SELL?
      ↓
SELL DECISION
```

Sell Decision은 사용자에게 최소한 다음을 알려야 한다.

### My Position

- 취득가격
- 취득일
- 보유기간
- 현재 ownership 상태

### Market Context

실제 제공 가능한 경우:

- initial/reference price
- recent sales
- available market context

없으면:

`현재 시장 정보 없음`

### Decision

- 더 알아보기
- 비교
- HOLD
- SELL INTENT
- 취소

---

# 7. SELL INTENT Boundary

SELL INTENT에서:

- cash 변경 금지
- ownership 변경 금지
- listing 생성 금지
- transaction 생성 금지
- net worth 변경 금지

단지 Decision/Research event 수준의 상태만 처리한다.

실제 mutation:

```text
SELL CONFIRM
→ SELL LISTING
→ MATCH
→ TRANSACTION
```

은 IA-04D 이후다.

---

# 8. No Fake Data

절대 생성하지 않는다.

- 현재 시장가격
- 예상 매도가
- 예상 수익
- 예상 수익률
- AI 추천가격
- 가상 buyer
- 가상 거래량
- 가상 최근 거래

실제 데이터가 없으면:

`정보 없음`

으로 처리한다.

---

# 9. Research Logging

IA-04C는 기존 Research Logging 구조를 따른다.

개념적 흐름:

```text
EXPOSURE
  ↓
DECISION
  ↓
ACTION
  ↓
VALIDATION
```

IA-04C에서 최소 기록해야 할 수 있는 사용자 행동:

- SELL context exposure
- SELL decision exposure
- SELL intent action
- HOLD
- CANCEL
- validation result

기존 infrastructure를 재사용한다.

새 research schema가 필요하면 STOP하고 보고한다.

---

# 10. Function Discovery — 제거가 아니라 기능 설계

IA-04C부터 다음을 **전수 조사**한다.

## Audit Target

Repository의 사용자 노출 UI에 존재하는:

- `<button>`
- `<a>`
- `onclick`
- event listener
- card click
- tab
- filter
- sort
- back
- close
- modal
- map interaction
- breadcrumb
- mobile navigation
- menu
- notification control
- watch control
- compare
- explore
- buy
- sell
- hold
- confirm
- cancel

### 각 interaction은 먼저 다음 질문을 거친다.

1. 사용자는 왜 이것을 누르는가?
2. 이 interaction이 PLAY의 어떤 사용자 가치와 연결되는가?
3. 클릭 후 어떤 상태 변화가 있어야 하는가?
4. 어떤 실제 데이터가 필요한가?
5. 기존 backend/function으로 구현 가능한가?
6. 새로운 backend/schema가 필요한가?
7. Research Logging과 어떻게 연결되는가?
8. 다음 사용자 행동은 무엇이어야 하는가?

---

# 11. Function Classification

각 interaction은 다음 중 하나로 분류한다.

### 1. CONNECTED

실제 기능이 정상 동작한다.

### 2. INCOMPLETE

일부 기능만 동작한다.

→ 부족한 기능을 정의하고 완성한다.

### 3. UNCONNECTED BUT VALUABLE

UI는 존재하지만 기능이 아직 연결되지 않았다.

→ 제거하지 않는다.

→ 사용자 목적을 정의한다.

→ 구현 방법을 설계한다.

→ 가능한 경우 실제 기능으로 구현한다.

### 4. INTENTIONALLY DISABLED

현재 단계상 실제 기능을 구현할 수 없거나 선행 단계가 필요하다.

→ 왜 disabled인지 정의한다.

→ 향후 구현 단계와 연결한다.

### 5. NOT APPLICABLE

실제 사용자 기능이 아닌 기술적/구조적 요소.

---

# 12. Function Design Record

UNCONNECTED / INCOMPLETE 요소마다 다음을 기록한다.

| Field | Description |
|---|---|
| Function ID | 고유 ID |
| Screen | 위치 |
| Element | 버튼/카드/탭 등 |
| User Intent | 사용자가 기대하는 것 |
| Product Purpose | PLAY에서의 가치 |
| Current State | 현재 상태 |
| Required State | 필요한 상태 |
| Data Required | 필요한 실제 데이터 |
| Backend Required | 기존 function/API 여부 |
| Research Logging | Exposure/Decision/Action/Validation |
| Implementation Plan | 구현 방법 |
| Dependency | 선행 조건 |
| Target Phase | 구현 단계 |
| Verification | 검증 방법 |

이 기록 자체가 향후 Product Roadmap의 근거가 된다.

---

# 13. Function Completion Rule

기능 구현 시 단순히 click handler만 붙이지 않는다.

각 기능은:

```text
USER INTENT
 ↓
USER ACTION
 ↓
STATE CHANGE
 ↓
DATA READ / VALIDATION
 ↓
RESULT
 ↓
NEXT ACTION
```

까지 연결되어야 한다.

예:

```text
BUY
 ↓
validation
 ↓
transaction
 ↓
player state refresh
 ↓
BUY RESULT
 ↓
MY WORLD
```

향후 SELL:

```text
SELL
 ↓
validation
 ↓
listing
 ↓
market
 ↓
match
 ↓
transaction
 ↓
SELL RESULT
 ↓
MY WORLD
```

---

# 14. Function Implementation Priority

기능 발견 후 다음 순서로 구현 우선순위를 정한다.

1. Core gameplay
2. Decision / Action
3. Navigation
4. Data exploration
5. Compare / Watch / Filter / Sort
6. Result / Feedback
7. Mobile interaction
8. Utility functions
9. Decorative interaction

기능의 중요도가 낮다는 이유만으로 삭제하지 않는다.

---

# 15. Visual Tuning Requirement

기능 구현과 연결성 검증이 끝난 후 Visual Tuning을 수행한다.

현재 fixed layout:

### Desktop

```text
LEFT ≈ WORLD MAP
RIGHT ≈ CONTEXTUAL COMMAND PANEL
```

### Mobile

```text
TOP ≈ WORLD MAP
BOTTOM ≈ CONTEXTUAL COMMAND PANEL
```

---

# 16. Visual Tuning Scope

## A. Layout

- map / command panel proportions
- spacing
- alignment
- card hierarchy
- information density
- whitespace
- responsive breakpoint

## B. Typography

- heading hierarchy
- price emphasis
- status
- secondary information
- button labels

## C. Components

- buttons
- cards
- panels
- badges
- tabs
- filters
- breadcrumbs
- modals
- empty states
- error states

## D. Interaction Feedback

- hover
- active
- selected
- disabled
- loading
- success
- failure
- transition

## E. PLAY Identity

화면이 일반 부동산 dashboard처럼 보이지 않도록 한다.

핵심 감각:

```text
WORLD
→ DISCOVER
→ DECIDE
→ ACT
→ RESULT
→ NEW DISCOVERY
```

Visual은 기능을 설명하고 다음 행동을 자연스럽게 유도해야 한다.

---

# 17. Visual Priority

Visual Tuning은 다음 순서로 한다.

1. Information hierarchy
2. Interaction clarity
3. Layout
4. Responsive behavior
5. Typography
6. Components
7. Color
8. Animation / micro interaction
9. Decorative polish

기능보다 visual polish를 먼저 하지 않는다.

---

# 18. Mobile Requirement

Mobile을 Desktop의 단순 축소판으로 취급하지 않는다.

최소 검증:

- WORLD
- REGION
- COMPLEX
- LISTING
- LISTING DETAIL
- BUY DECISION
- BUY RESULT
- MY WORLD
- PROPERTY DETAIL
- SELL DECISION

모든 핵심 action이 thumb-friendly 해야 한다.

---

# 19. IA-04D Preparation

IA-04C 완료 후 IA-04D에서는 실제 SELL/Secondary Market을 구현한다.

예상:

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

IA-04C에서 이 backend mutation을 미리 만들지 않는다.

---

# 20. IA-04E Preparation

IA-04D 이후:

```text
SELL RESULT
 ↓
PLAYER STATE REFRESH
 ↓
MY WORLD
```

를 구현한다.

---

# 21. Functional E2E Gate

IA-04E 이후 전체 흐름을 실제 데이터로 검증한다.

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

모든 transition이 실제 동작해야 한다.

---

# 22. Product Function Completion Gate

다음 조건을 모두 만족해야 한다.

### F01
사용자 노출 interaction 전수 inventory 완료.

### F02
모든 CONNECTED 기능 검증 완료.

### F03
모든 INCOMPLETE 기능에 구현 계획 또는 구현 완료.

### F04
모든 UNCONNECTED BUT VALUABLE 기능에 Product Purpose가 정의됨.

### F05
구현 가능한 UNCONNECTED BUT VALUABLE 기능은 실제 구현.

### F06
선행 기능이 필요한 경우 Target Phase가 명확함.

### F07
핵심 Gameplay 기능에 BROKEN 상태가 없음.

### F08
기능을 단순히 제거하여 audit을 통과시키지 않음.

### F09
기능별 Research Traceability가 정의됨.

### F10
기능별 verification 방법이 존재함.

---

# 23. Human Season Entry Gate

Human Season은 다음 조건을 모두 만족해야 한다.

### GATE-H01
Economic Engine verified.

### GATE-H02
Property Market verified.

### GATE-H03
Transaction integrity verified.

### GATE-H04
Reliability / recovery verified.

### GATE-H05
Research Logging + DLQ verified.

### GATE-H06
BUY complete.

### GATE-H07
SELL complete.

### GATE-H08
MY WORLD complete.

### GATE-H09
All user-visible functions inventoried.

### GATE-H10
All core user-visible functions implemented or have an explicit approved Target Phase.

### GATE-H11
No unexplained broken user-visible interaction.

### GATE-H12
Functional E2E PASS.

### GATE-H13
Research traceability E2E PASS.

### GATE-H14
Desktop visual tuning PASS.

### GATE-H15
Mobile visual tuning PASS.

### GATE-H16
Human E2E PASS.

### GATE-H17
No fake business/economic data.

### GATE-H18
No unresolved critical UX blocker.

### GATE-H19
Product Owner approval.

**GATE-H01 ~ H19 중 하나라도 FAIL이면 Human Season을 시작하지 않는다.**

---

# 24. Definition of Done

IA-04C 자체의 DoD:

- SELL Decision UI
- SELL context
- SELL INTENT
- HOLD/CANCEL
- state management
- Research hooks
- no economic mutation
- real data only
- IA-04B regression
- IA-03C regression

Product Completion의 장기 DoD:

- IA-04D
- IA-04E
- Function Inventory
- Function Design Records
- unconnected valuable function implementation
- Functional E2E
- Visual Tuning
- Mobile Tuning
- Human E2E

까지 완료되어야 Human Season Ready가 된다.

---

# 25. Final Reports

IA-04C:

`PLAY_IA-04C_IMPLEMENTATION_REPORT.md`

Function Audit:

`PLAY_FUNCTION_INVENTORY_AND_UNCONNECTED_ACTION_AUDIT.md`

Function Design:

`PLAY_FUNCTION_DESIGN_AND_IMPLEMENTATION_PLAN.md`

Visual:

`PLAY_VISUAL_TUNING_REPORT.md`

Functional E2E:

`PLAY_FUNCTIONAL_E2E_FINAL_REPORT.md`

Human Season Gate:

`PLAY_HUMAN_SEASON_ENTRY_GATE_REPORT.md`

---

# 26. Final Status Rules

IA-04C:

`READY FOR IA-04D`

또는

`BLOCKED`

전체 Product Completion:

`HUMAN_SEASON_READY`

또는

`NOT_READY`

절대 "완벽", "100% 완성" 등의 표현으로 대체하지 않는다.
