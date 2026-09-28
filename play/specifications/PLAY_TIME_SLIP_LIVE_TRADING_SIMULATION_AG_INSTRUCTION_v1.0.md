# PLAY_TIME_SLIP_LIVE_TRADING_SIMULATION_AG_INSTRUCTION_v1.0

- **Document Type:** AG Implementation Instruction
- **Status:** READY FOR IMPLEMENTATION
- **Purpose:** Time-Slip Live Simulation 실행 루프 활성화 및 11명 ACTIVE TRADING 검증
- **Participants:** HERO 1명 + AI 10명 = 총 11명
- **Simulation:** 360 simulated months = 30 simulated years
- **Test Region:** 경기도 용인시 수지구
- **Trading Mode:** ACTIVE_TRADING_TEST
- **Minimum Transactions:** 참가자별 매 Period 최소 2회
- **Execution Authority:** PLAY Backend
- **Browser:** Live Observer / Control Client

---

# 1. 작업 목적

현재 다음 요소는 준비되어 있다.

- Time-Slip UI
- TIME-SLIP ON/OFF
- RUN / PAUSE / STEP / STOP
- HERO Participant
- AI Participant 10명
- Firestore
- Economic Engine
- Property Market
- BUY / SELL
- Live UI

그러나 현재:

> TIME-SLIP ON → RUN

을 실행해도 HERO와 AI가 지속적으로 거래하고 Firestore에 데이터가 축적되며 브라우저 화면이 실시간으로 변화하는 모습이 충분히 나타나지 않는다.

이번 작업의 목적은 단순히 RUN 버튼을 고치는 것이 아니다.

**실제 Live Trading Simulation Loop를 완성한다.**

---

# 2. 가장 중요한 변경사항

이번 테스트에서는 일반적인 경제행동 Simulation과 달리:

> **HERO 및 AI 10명 모두가 매 simulated Period마다 최소 2회의 실제 Transaction을 수행해야 한다.**

따라서:

```text
11 Participants
×
2 Transactions / Period
=
최소 22 Transactions / Period
```

이다.

360 Period 전체에서는 이론상 최소:

```text
22 × 360
=
7,920 Transactions
```

이 발생해야 한다.

단, Transaction이 발생하기 위해서는 실제 시장의 공급/보유/현금/거래조건이 충족되어야 하며, 이를 위해 테스트 환경의 거래 전략은 반드시 BUY와 SELL을 연계하는 방식으로 설계해야 한다.

---

# 3. ACTIVE_TRADING_TEST 정의

이번 모드는 일반 Season의 경제행동을 의미하지 않는다.

```text
NORMAL ECONOMIC SIMULATION
        vs
ACTIVE_TRADING_TEST
```

를 명확하게 구분한다.

## NORMAL

실제 경제행동에 가까운 의사결정.

- HOLD 가능
- WATCH 가능
- 거래 없음 가능

## ACTIVE_TRADING_TEST

목적:

- Time-Slip 실행 검증
- Firestore 지속 데이터 생성
- Transaction pipeline 스트레스 테스트
- Live UI 갱신 검증
- Participant activity 검증
- concurrency 검증
- ranking 변화 검증

따라서 거래 빈도를 강제로 높인다.

---

# 4. 절대 원칙

## 4.1 Browser가 거래를 생성하지 않는다

브라우저에서:

```javascript
setInterval()
setTimeout()
```

등으로 거래를 생성하면 안 된다.

AI/HERO Transaction은 Backend가 생성한다.

```text
Browser
 ↓
RUN
 ↓
Season Clock
 ↓
Backend
 ↓
AI/HERO Decision
 ↓
BUY/SELL
 ↓
Transaction
 ↓
Firestore
 ↓
Live State
 ↓
Browser
```

---

# 5. Participant별 최소 거래량

각 Period마다:

```text
HERO  ≥ 2 transactions
AI-01 ≥ 2
AI-02 ≥ 2
AI-03 ≥ 2
AI-04 ≥ 2
AI-05 ≥ 2
AI-06 ≥ 2
AI-07 ≥ 2
AI-08 ≥ 2
AI-09 ≥ 2
AI-10 ≥ 2
```

따라서:

```text
minimum_transactions_per_period = 22
```

이다.

---

# 6. BUY / SELL 구성

단순히 동일한 BUY만 반복해서는 안 된다.

가능한 경우 각 Participant의 2회 거래는:

```text
Transaction #1 → BUY
Transaction #2 → SELL
```

을 기본 목표로 한다.

단, SELL은 보유 Asset이 있어야 하므로 최초 Period에는 다음과 같은 초기화 전략이 필요하다.

### P001

AI/HERO별 거래 가능한 Asset 확보.

예:

```text
Initial Trading Inventory
```

를 테스트 전용 Fixture로 제공하거나,

검증된 Primary Market을 통해 초기 Asset을 확보한다.

이 초기화는 일반 Season의 초기 경제상태를 변경해서는 안 된다.

---

# 7. Initial Trading Inventory

ACTIVE_TRADING_TEST에서는 Participant가 P001부터 SELL할 수 있도록 테스트용 거래 재고를 준비한다.

중요:

> 이것은 일반 Season의 시작 자산 7억원 정책을 변경하는 것이 아니다.

Production/Normal Season:

```text
cash = 700M
property = 0
```

을 유지한다.

ACTIVE_TRADING_TEST에서만 별도의:

```text
test_inventory
```

를 사용할 수 있다.

단, 테스트 재고는 실제 Player Asset과 구분하고 거래 엔진의 검증된 ownership/transaction 규칙을 우회해서는 안 된다.

더 엄격한 검증을 위해 실제 Primary BUY를 먼저 수행하여 Asset을 확보하는 방법을 우선 검토한다.

---

# 8. 거래 전략

각 Participant는 매 Period 최소 2회 거래하도록 Decision Policy를 사용한다.

예:

```text
Observe
 ↓
Select Target Property
 ↓
BUY
 ↓
Select Owned Property
 ↓
SELL
```

또는:

```text
SELL
 ↓
BUY
```

또는 Secondary Market 환경에서는:

```text
BUY
 ↓
BUY
```

도 가능하다.

단, 모든 Transaction은 실제 Transaction Engine을 통과해야 한다.

---

# 9. 절대 금지

다음 방식은 사용하지 않는다.

```text
Firestore에 transaction document만 직접 생성
```

또는

```text
PLAY_PLAYER_ASSET만 직접 증가/감소
```

또는

```text
UI에서 거래 성공을 fake
```

또는

```text
Decision Log만 생성하고 실제 Transaction은 생성하지 않음
```

모든 거래는 검증된:

```text
BUY / SELL Transaction Path
```

를 사용해야 한다.

---

# 10. P001 특별 처리

P001은 모든 Participant에게 최소 2 Transaction을 만들 수 있도록 거래 가능한 상태를 보장해야 한다.

권장 방식:

```text
P001
 ↓
Initial Asset Acquisition
 ↓
BUY
 ↓
SELL
```

초기 Asset 확보가 필요한 경우 실제 Primary Transaction을 사용한다.

그 결과는:

```text
PLAY_PLAYER_ASSET
PLAY_PROPERTY_OWNERSHIP
PLAY_PROPERTY_TRANSACTION
PLAY_DECISION_LOG
Research Events
```

에 정상 기록되어야 한다.

---

# 11. P002 이후

P002부터는 기존 보유 Asset과 거래 가능한 시장을 이용한다.

예:

```text
P002
AI01 BUY
AI01 SELL

AI02 BUY
AI02 SELL

...
```

Secondary Market이 사용되는 경우 실제:

```text
PLAY_SECONDARY_LISTING
PLAY_PROPERTY_TRANSACTION
PLAY_PROPERTY_OWNERSHIP
```

흐름을 사용한다.

---

# 12. 거래 대상

현재 테스트 지역:

> 경기도 용인시 수지구

의 정상 거래 가능한 Property를 사용한다.

Property Master:

```text
209 total
200 NORMAL
9 INCOMPLETE
```

INCOMPLETE Property는 거래 대상에서 제외한다.

---

# 13. Supply Policy

Season 1:

```text
supply_policy = FIXED_ONE
```

을 유지한다.

ACTIVE_TRADING_TEST 때문에 Supply Policy를 변경하지 않는다.

Primary Supply는 실제 Season Supply 규칙을 따른다.

Secondary Market에서는 소유권 이전을 사용한다.

---

# 14. AI 전략 다양성

10명의 AI가 완전히 동일한 행동만 반복하지 않도록 최소 5개 전략군을 사용한다.

예:

### AI-01 / AI-02
CONSERVATIVE

### AI-03 / AI-04
GROWTH

### AI-05 / AI-06
VALUE

### AI-07 / AI-08
MOMENTUM

### AI-09 / AI-10
BALANCED

HERO는 별도의 전략 ID를 가진다.

예:

```text
HERO / HERO_AUTONOMOUS_V1
```

단, HERO에게 경제적 advantage를 부여하지 않는다.

---

# 15. HERO Autonomous Trading

HERO도 사용자가 클릭하지 않아도 Backend AI Policy에 따라 매 Period 거래한다.

예:

```text
P001
HERO BUY
HERO SELL

P002
HERO BUY
HERO SELL

P003
HERO SELL
HERO BUY
```

HERO의 모든 거래는 일반 AI와 동일한 Transaction Engine을 사용한다.

---

# 16. Period Execution Contract

각 Period의 최소 실행 구조:

```text
Period N
 ↓
Load 11 Participants
 ↓
Generate Decisions
 ↓
Transaction #1
 ↓
Validate
 ↓
Commit
 ↓
Transaction #2
 ↓
Validate
 ↓
Commit
 ↓
Persist Decision / Transaction / Outcome
 ↓
Complete Participant
 ↓
Complete Batch
 ↓
Advance Season Clock
```

중요:

**한 Participant의 Transaction 2회가 모두 완료된 후 해당 Participant Period를 완료 처리한다.**

---

# 17. Participant Completion 조건

Participant가 다음 조건을 만족해야 Period 처리 완료다.

```text
decision_count >= 2
transaction_count >= 2
```

필요한 경우:

```text
action_count >= 2
validation_count >= 2
```

도 확인한다.

---

# 18. Batch Completion 조건

Batch는 11명이 모두 완료되어야 한다.

```text
completed_participants = 11
```

그리고:

```text
minimum_transactions =
11 × 2
=
22
```

이어야 한다.

그 이후에만:

```text
Batch COMPLETE
```

가 된다.

---

# 19. Season Clock 진행 조건

다음 Period로 이동하는 조건:

```text
Participant completion = 11
AND
Transaction count >= 22
AND
Batch status = COMPLETED
```

이다.

따라서:

```text
P001 incomplete
```

상태에서:

```text
P002
```

로 넘어가면 안 된다.

---

# 20. Transaction 부족 시 처리

예를 들어:

```text
AI-07
Transaction count = 1
```

이면 Batch를 완료시키지 않는다.

다음과 같이 처리한다.

```text
Participant incomplete
 ↓
Retry / Alternative Strategy
 ↓
Second Transaction
 ↓
Validation
 ↓
Commit
 ↓
Participant complete
```

단, 무한 Retry는 금지한다.

---

# 21. 실패 처리

Transaction이 실패하면:

```text
Decision
→ Action
→ Validation FAILED
```

을 기록한다.

그리고 ACTIVE_TRADING_TEST 정책에 따라:

```text
Alternative Property
```

또는:

```text
Alternative Action
```

을 선택한다.

최종적으로 최소 2개의 성공 Transaction을 달성해야 한다.

---

# 22. 중요한 구분

다음은 성공 Transaction으로 인정하지 않는다.

```text
HTTP 200
```

만으로 성공 판정하지 않는다.

반드시:

```text
Transaction committed
+
Player Asset changed
+
Ownership/Market state changed where applicable
+
Transaction record persisted
```

가 확인되어야 한다.

---

# 23. Firestore 예상 증가량

최소 기준:

```text
11 Participants
×
2 Transactions
=
22 Transactions / Period
```

360 Period:

```text
22 × 360
=
7,920 minimum transactions
```

실제 Decision / Action / Research Event 수는 이보다 많을 수 있다.

---

# 24. Live UI 요구사항

RUN 후 브라우저에서 지속적인 변화가 보여야 한다.

### 홈

- Period 증가
- 최근 Activity 증가
- 경제환경 변화

### 지도보기

- 수지구
- 거래 발생
- Complex 상태 변화
- Listing 변화

### 지역탐색

- 수지구 거래량 변화
- 시장 상태 변화

### 내 자산

HERO의:

- Cash
- Property
- Debt
- Net Worth

변화

### 다른 참가자

11명의:

- Activity
- Transaction
- Asset
- Net Worth

변화

### 시즌랭킹

11명의 Ranking이 거래 결과에 따라 실시간 변화.

---

# 25. Live Activity 예시

RUN 중 화면에서 다음과 같은 실제 Activity가 계속 발생해야 한다.

```text
00:00:01 HERO BUY 광교자이더클래스
00:00:02 AI-03 SELL 수지신정마을
00:00:03 AI-07 BUY 성복역
00:00:04 AI-01 SELL ...
00:00:05 HERO SELL ...
```

Activity는 실제 Firestore Transaction/Decision Event에서 생성한다.

Fake animation 금지.

---

# 26. Diagnostic Panel

Test Mode에서 다음 정보를 실시간 표시한다.

```text
TIME-SLIP LIVE TRADING

Season:
test_hero_season

Region:
수지구

Period:
P027 / 360

Clock:
RUNNING

Participants:
11 / 11

Required Transactions:
22

Completed Transactions:
22

HERO:
2 / 2

AI-01:
2 / 2

AI-02:
2 / 2

...

AI-10:
2 / 2

Last Transaction:
AI-04 BUY

Last Error:
NONE
```

---

# 27. Stalled Detection

다음 상태를 감시한다.

```text
clock_status = RUNNING
```

이면서:

```text
transaction_count
```

가 일정 시간 증가하지 않으면:

```text
TIMESLIP_TRADING_STALLED
```

를 발생시킨다.

Diagnostic:

```text
Current Period
Participant
Transaction Count
Last Transaction
Last Error
Last Batch
```

---

# 28. 자동 PAUSE

다음 상황에서는 자동 PAUSE한다.

- 11명 중 Participant 실행 누락
- Participant 거래 수가 2 미만
- Batch 장시간 RUNNING
- Transaction 반복 실패
- Firestore write failure
- Ownership inconsistency
- Cash inconsistency
- Season Clock inconsistency
- reconciliation failure

---

# 29. 검증 단계

## Phase 1 — 1 Participant

```text
HERO
P001
2 Transactions
```

검증.

---

## Phase 2 — 11 Participants

```text
HERO + AI 10
P001
```

검증:

```text
11 Participants
22 Transactions
```

---

## Phase 3 — 10 Period

```text
P001 → P010
```

최소:

```text
220 Transactions
```

검증.

---

## Phase 4 — 60 Period

```text
P001 → P060
```

최소:

```text
1,320 Transactions
```

검증.

---

## Phase 5 — 360 Period

```text
P001 → P360
```

최소:

```text
7,920 Transactions
```

검증.

---

# 30. Checkpoint

다음 Period에서 상태를 저장한다.

```text
P001
P060
P120
P180
P240
P300
P360
```

각 checkpoint:

- Period
- Participant count
- Transaction count
- HERO state
- AI states
- Cash
- Property
- Debt
- Net Worth
- Decision count
- Research Event count
- Error count
- Processing latency

---

# 31. 기존 엔진 보호

다음 검증된 영역은 임의 변경하지 않는다.

- Economic Engine
- IA-03C BUY
- IA-04D SELL
- Property Master
- FIXED_ONE Supply Policy
- Transaction Atomicity
- Security Rules
- Idempotency
- Research Logging
- Season Clock integrity

ACTIVE_TRADING_TEST는 기존 엔진 위에 올라가는 **Decision/Strategy/Test Driver Layer**로 구현한다.

---

# 32. 정상 Season과 분리

ACTIVE_TRADING_TEST를 일반 Season 정책으로 만들지 않는다.

Configuration 예:

```text
simulation_mode:
  NORMAL
  ACTIVE_TRADING_TEST
```

현재 테스트:

```text
simulation_mode = ACTIVE_TRADING_TEST
minimum_transactions_per_participant_per_period = 2
```

일반 Season:

```text
simulation_mode = NORMAL
```

로 유지한다.

---

# 33. Acceptance Criteria

### Execution

- [ ] RUN 정상
- [ ] Season Clock 진행
- [ ] Batch 생성
- [ ] 11 Participants 실행
- [ ] HERO autonomous trading
- [ ] AI autonomous trading

### Trading

- [ ] Participant별 매 Period 최소 2 Transactions
- [ ] 최소 22 Transactions / Period
- [ ] P010까지 최소 220 Transactions
- [ ] P060까지 최소 1,320 Transactions
- [ ] P360까지 최소 7,920 Transactions

### Persistence

- [ ] 실제 Transaction 기록
- [ ] Player Asset 변화
- [ ] Ownership 변화
- [ ] Decision Log
- [ ] Research Events
- [ ] Firestore 데이터 증가

### Live UI

- [ ] Period 실시간 증가
- [ ] 수지구 지도 변화
- [ ] 수지구 지역 데이터 변화
- [ ] HERO Asset 변화
- [ ] 11 Participant Activity 변화
- [ ] 11 Participant Ranking 변화
- [ ] Live Activity 표시

### Reliability

- [ ] Idempotency
- [ ] No duplicate transaction
- [ ] No duplicate participant execution
- [ ] No duplicate listener
- [ ] Reconnect
- [ ] Stalled detection
- [ ] Automatic pause
- [ ] Reconciliation

### Full Simulation

- [ ] P001 PASS
- [ ] P060 PASS
- [ ] P120 PASS
- [ ] P180 PASS
- [ ] P240 PASS
- [ ] P300 PASS
- [ ] P360 PASS

---

# 34. 최종 판정

## PASS

11명의 모든 Participant가 P360까지 매 Period 최소 2회의 실제 Transaction을 수행하고,

```text
Transaction
→ Firestore
→ Live State
→ Browser
```

전체가 실시간으로 확인된다.

## PASS WITH FINDINGS

최소 거래 조건과 실행은 충족하지만 성능/UX/데이터 품질 개선사항이 존재한다.

## BLOCKED

다음 중 하나라도 발생:

- Participant 실행 누락
- 2 Transaction 조건 미충족
- Firestore persistence 실패
- Transaction atomicity 실패
- ownership inconsistency
- cash inconsistency
- Period 진행 중단
- Live UI 미갱신

---

# 35. 최종 제품 경험

정상 실행 시 사용자는 브라우저에서 다음을 실제로 관찰할 수 있어야 한다.

```text
TIME-SLIP ON
      ↓
RUN
      ↓
P001
      ↓
HERO + AI 10
      ↓
최소 22 Transactions
      ↓
Firestore 데이터 증가
      ↓
지도 변화
      ↓
지역 변화
      ↓
HERO 자산 변화
      ↓
11명 참가자 Activity
      ↓
11명 Ranking 변화
      ↓
P002
      ↓
반복
      ↓
P360
```

최종 성공 기준:

> **RUN 버튼을 누른 순간부터 PLAY 세계가 멈춰 있는 것이 아니라, 11명의 Participant가 실제 거래를 지속적으로 발생시키고 그 결과가 Firestore와 브라우저 화면에 동시에 살아 움직이는 상태가 되어야 한다.**

최종 Gate:

**READY FOR 11-PARTICIPANT / 360-PERIOD ACTIVE TRADING TIME-SLIP SIMULATION**
