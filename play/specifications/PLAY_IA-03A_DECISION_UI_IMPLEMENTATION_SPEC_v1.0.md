# PLAY IA-03A DECISION UI IMPLEMENTATION SPEC v1.0

## 1. 문서 상태

- Status: EXECUTION SPEC
- Phase: Human Product / Functional Build
- Stage: IA-03A — LISTING → DECISION
- Visual Mode: BLACK / WHITE / GRAYSCALE WIREFRAME
- Priority: Function / Interaction / State > Visual Polish
- Product: PLAY Independent Service

이번 단계의 목적은 `LISTING DETAIL`에서 사용자가 실제 경제적 행동을 선택하기 전,
**의사결정 구조(Decision Layer)를 완성하는 것**이다.

이번 단계에서는 실제 BUY/SELL Transaction을 실행하지 않는다.

---

# 2. 현재 위치

현재까지 구현된 IA:

```text
WORLD
 ↓
REGION
 ↓
COMPLEX
 ↓
LISTING
 ↓
LISTING DETAIL
```

이번 단계:

```text
LISTING DETAIL
 ↓
DECISION
```

다음 단계:

```text
DECISION
 ↓
ACTION
 ↓
BUY TRANSACTION
```

따라서 이번 단계는 **Transaction 직전의 Decision Layer**다.

---

# 3. Product Goal

사용자가 Listing Detail을 본 뒤 단순히 "BUY 버튼을 누르는 것"이 아니라,
현재 매물에 대해 어떤 판단을 하고 있는지를 명확하게 선택할 수 있어야 한다.

핵심 구조:

```text
LISTING DETAIL
      ↓
   EXPLORE
      ↓
   COMPARE
      ↓
    WATCH
      ↓
    HOLD
      ↓
 BUY INTENT / SELL INTENT
```

여기서 `BUY INTENT`는 실제 매수가 아니다.

`BUY INTENT`는:

> "이 매물을 매수 대상으로 판단하고 다음 단계로 진행하겠다."

라는 의사결정 상태다.

---

# 4. Decision Actions

이번 단계의 Decision Action은 다음 5개로 정의한다.

## 4.1 EXPLORE

현재 매물에 대한 추가 정보를 탐색한다.

예:

- 매물 정보
- 단지 정보
- 최근 거래
- 시장 정보
- 가격 정보
- 지역 정보

행동 결과:

```text
EXPLORE
→ 추가 정보 표시
→ LISTING DETAIL 유지
```

---

## 4.2 COMPARE

현재 매물을 다른 대상과 비교한다.

최소 비교 대상:

- 같은 단지의 다른 Listing
- 동일/유사 면적의 Listing
- 최근 거래 정보

이번 단계에서는 비교 기능의 구조를 구현한다.

실제 고급 비교 알고리즘은 구현하지 않는다.

행동 결과:

```text
COMPARE
→ Compare Context
→ 비교 대상 선택
→ 비교 결과 표시
→ LISTING DETAIL / COMPARE 복귀
```

---

## 4.3 WATCH

관심 대상으로 등록한다.

목적:

- 이후 다시 확인
- 가격/시장 변화 추적
- 향후 Notification / Discovery와 연결

현재 단계에서는 최소한:

```text
WATCH ON
WATCH OFF
```

상태를 구현한다.

가능하면 실제 사용자별 상태 저장 구조를 사용하되,
새로운 영속 데이터 구조가 필요하다면 임의로 만들지 말고 STOP 후 보고한다.

---

## 4.4 HOLD

현재 아무 행동도 하지 않겠다는 의사결정이다.

중요:

HOLD는 단순 "아무것도 안 함"이 아니다.

PLAY에서는:

> "현재 정보와 조건을 확인했지만 지금은 행동하지 않겠다."

라는 명시적인 Decision Event로 취급할 수 있는 구조를 만든다.

이번 단계에서는 HOLD를 기록 가능한 Decision 상태로 준비한다.

실제 경제상태 변화는 발생하지 않는다.

---

## 4.5 BUY INTENT

BUY를 실제 실행하지 않고:

```text
"이 매물을 매수 대상으로 검토하겠다."
```

라는 의사결정을 생성한다.

다음 화면/단계:

```text
BUY INTENT
 ↓
IA-03B BUY DECISION
```

으로 연결할 수 있는 상태를 만든다.

이번 단계에서는 실제:

- 자금 차감
- 현금 Lock
- 거래비용 차감
- 소유권 변경
- Transaction 생성

을 수행하지 않는다.

---

# 5. Decision UI

## Desktop

기존 구조를 유지한다.

```text
┌──────────────────────────────────────────┬───────────────────────┐
│                                          │                       │
│              MAP / CONTEXT               │   LISTING DETAIL      │
│                                          │                       │
│                                          │   가격                │
│                                          │   면적                │
│                                          │   거래정보            │
│                                          │                       │
│                                          │ ───────────────────   │
│                                          │                       │
│                                          │ [탐색] [비교]          │
│                                          │ [관심] [보유]          │
│                                          │ [매수 검토]            │
│                                          │                       │
└──────────────────────────────────────────┴───────────────────────┘
```

`보유`는 이번 단계에서는 `HOLD`로 표현한다.

---

# 6. Decision State

최소 상태:

```text
NONE
EXPLORE
COMPARE
WATCH
HOLD
BUY_INTENT
```

필요하다면:

```text
selectedListingId
decisionState
watchState
compareTarget
```

등의 UI 상태를 사용한다.

단, 새로운 Backend State가 필요하다고 판단되면 임의 구현하지 않는다.

---

# 7. Decision State Machine

```text
LISTING DETAIL
      │
      ├── EXPLORE
      │      ↓
      │   DETAIL
      │
      ├── COMPARE
      │      ↓
      │   COMPARE
      │      ↓
      │   DETAIL
      │
      ├── WATCH
      │      ↓
      │   WATCH ON/OFF
      │      ↓
      │   DETAIL
      │
      ├── HOLD
      │      ↓
      │   HOLD CONFIRMED
      │      ↓
      │   DETAIL
      │
      └── BUY INTENT
             ↓
        IA-03B ENTRY
```

---

# 8. BUY INTENT Boundary

매우 중요하다.

이번 단계에서 BUY INTENT와 BUY TRANSACTION을 분리한다.

### 허용

```text
BUY INTENT
→ 상태 표시
→ 다음 단계 진입
```

### 금지

```text
BUY INTENT
→ cash 감소
→ locked cash
→ ownership
→ transaction
```

이것들은 IA-03B 이후에 구현한다.

---

# 9. Research Logging Alignment

현재 Research Logging 구조:

```text
EXPOSURE
 ↓
DECISION
 ↓
ACTION
 ↓
VALIDATION
 ↓
TRANSACTION
 ↓
OUTCOME
```

이번 단계의 핵심은 `DECISION`이다.

각 행동은 향후 다음과 연결될 수 있어야 한다.

```text
Listing Exposure
 ↓
Decision
 ↓
Action
```

이번 단계에서 기존 Research Logging Infrastructure를 임의로 수정하지 않는다.

기존 Hook이 존재하면 활용한다.

새로운 persistent logging schema가 필요하다면 STOP 후 보고한다.

---

# 10. Data Integrity

이번 단계에서 Business Data를 만들지 않는다.

실제 Listing 정보는 현재 검증된 Property Master / Listing 데이터 사용.

허용:

- UI state
- empty state
- compare placeholder
- watch UI
- decision state

금지:

- 가짜 가격
- 가짜 거래
- 가짜 참가자
- 가짜 시장지표
- 가짜 거래 성공
- 가짜 BUY transaction

---

# 11. Protected Areas

절대 임의 수정하지 않는다.

- Economic Engine
- Economic Batch Processing
- Season Clock
- Property Market Engine
- Primary Transaction
- Secondary Transaction
- Security Rules
- Research Logging Infrastructure
- Research Event DLQ
- Property Master
- RealRankers app_main_lang.js
- RealRankers CSS

특히 이번 단계에서는 Transaction Engine을 수정하지 않는다.

---

# 12. Visual Rule

현재 단계는 기능 구현 단계다.

UI는:

- 흰색
- 검정
- 회색
- 기본 border
- 기본 icon
- 단순 button

으로 유지한다.

최종 디자인은 나중에 한다.

Product Owner가 실제 화면을 직접 확인한다.

---

# 13. Verification Policy

Browser QA는 기본 검증에서 제외한다.

AG는 명시적인 요청이 없는 한:

- 브라우저 실행
- 수동 클릭
- screenshot
- visual comparison

을 하지 않는다.

대신:

```text
Static Validation
→ Syntax / Module Validation
→ DOM Contract
→ State Machine Test
→ Navigation Test
→ Data Contract
→ IA Regression
→ Protected-area Diff
```

를 수행한다.

---

# 14. Functional Tests

## D01 Listing Detail → Explore

Expected:

```text
EXPLORE state
DETAIL remains active
```

## D02 Listing Detail → Compare

Expected:

```text
COMPARE state
compare context rendered
back to detail
```

## D03 Watch

Expected:

```text
WATCH OFF
→ WATCH ON
→ WATCH OFF
```

## D04 Hold

Expected:

```text
HOLD
→ HOLD CONFIRMED
→ no economic state change
```

## D05 Buy Intent

Expected:

```text
BUY_INTENT
→ IA-03B entry state
```

## D06 No Transaction

All tests above must verify:

```text
cash unchanged
property ownership unchanged
debt unchanged
transaction count unchanged
```

## D07 Existing Flow Regression

```text
WORLD
→ REGION
→ COMPLEX
→ LISTING
→ LISTING DETAIL
```

must remain valid.

---

# 15. DOM Contract

Required elements:

```text
listing-detail
decision-panel
decision-explore
decision-compare
decision-watch
decision-hold
decision-buy-intent
```

Actual selector names may follow existing code conventions.

Do not create duplicate IDs.

---

# 16. Implementation Order

```text
STEP 01
Audit current LISTING DETAIL implementation

STEP 02
Add Decision Panel

STEP 03
Implement EXPLORE

STEP 04
Implement COMPARE

STEP 05
Implement WATCH

STEP 06
Implement HOLD

STEP 07
Implement BUY INTENT

STEP 08
State Machine Tests

STEP 09
IA-01 / IA-02 Regression

STEP 10
Protected-area Diff

STEP 11
STOP
```

---

# 17. Definition of Done

- Listing Detail has Decision Layer
- Explore works
- Compare works
- Watch On/Off works
- Hold works
- Buy Intent works
- BUY Transaction does NOT execute
- Economic state remains unchanged
- Existing Listing flow remains intact
- IA-01/IA-02 regression PASS
- DOM contracts PASS
- State tests PASS
- Data contracts PASS
- Protected areas unchanged
- No fabricated business data
- Browser QA not required
- Product Owner visual verification deferred to manual inspection

---

# 18. Next Stage

After Product Owner approval:

```text
IA-03B
BUY INTENT
 ↓
Funding Check
 ↓
Transaction Cost
 ↓
Expected Result
 ↓
BUY Confirmation
```

Then:

```text
IA-03C
BUY ORDER
 ↓
VALIDATION
 ↓
TRANSACTION
 ↓
PLAYER STATE CHANGE
 ↓
RESULT
```

이번 단계에서는 여기까지 구현하고 STOP한다.
