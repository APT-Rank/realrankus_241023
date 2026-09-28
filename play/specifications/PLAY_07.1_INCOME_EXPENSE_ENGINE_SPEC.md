# PLAY-07.1 INCOME & BASIC EXPENSE ENGINE SPECIFICATION

## 1. 문서 목적

PLAY-07 Economic Engine의 첫 번째 구현 단계인 **Global Season Clock + Income + Basic Expense Engine**의 구현 및 검증 범위를 정의한다.

PLAY-06.1에서 Server Authority, Cloud Tasks 내부 인증, Idempotency, Concurrency Control 및 Emergency Stop이 검증되었으므로, PLAY-07.1부터 실제 경제 상태를 변경하는 deterministic economic logic을 구현한다.

핵심 질문:

> 동일한 경제환경과 동일한 초기조건에서 각 Player의 경제 상태가 서버 권한에 의해 동일한 규칙으로 재현 가능하게 변화하는가?

AI는 경제 계산에 사용하지 않는다.

---

## 2. 구현 범위

### 2.1 IN

1. Global Season Clock
2. Simulation Period
3. Season Period progression
4. Standardized annual income curve
5. Income recognition
6. Basic living expense
7. Inflation adjustment
8. PLAY_PLAYER_ASSET economic state update
9. Player-level idempotency
10. Batch-level idempotency
11. Retry safety
12. Reconciliation
13. Failure recovery
14. Decision Log 기본 구조

### 2.2 OUT

이번 단계에서는 구현하지 않는다.

- Property Market
- Primary Market
- Secondary Market
- BUY / SELL
- Rent
- Jeonse
- Loan
- DSR
- LTV
- Tax
- GLI
- Financial Asset
- Reward
- Economic Freedom Score
- Season Analysis
- AI
- User Ranking
- Hall of Fame

---

## 3. 기존 PLAY 설계와의 관계

기존 PLAY-02 Economic Engine 설계를 변경하지 않고 구현한다.

### Season 1 초기 조건

- Initial Cash: 700,000,000 KRW
- Debt: 0
- Property: 0
- Financial Asset: 0
- Net Worth: 700,000,000 KRW

모든 Player는 동일한 초기조건에서 시작한다.

---

## 4. 경제 계산 원칙

경제 계산은 deterministic logic으로 구현한다.

동일한:

- season_id
- scenario_id
- scenario_version
- rule_version
- simulation_period
- player_initial_state

가 주어졌을 경우 동일한 결과가 재현되어야 한다.

AI, LLM, 외부 API 호출 결과 등을 경제 상태 계산에 사용하지 않는다.

---

## 5. Server Authority

경제 상태 변경은 반드시 서버에서 수행한다.

```text
Season Clock
      ↓
Economic Batch
      ↓
Chunk Worker
      ↓
Player Transaction
      ↓
PLAY_PLAYER_ASSET
```

Client는 다음 값을 직접 변경할 수 없어야 한다.

- cash
- debt
- net_worth
- last_processed_period
- last_processed_batch_id

기존 PLAY-06.1 Firestore Security Rules와 Server Authority를 유지한다.

---

## 6. Season Clock

Season은 30년의 가상 경제생활을 시뮬레이션한다.

기존 확정 시간 구조:

- 1 Real Season = 3 Real Months
- 1 Real Day ≈ 4 Simulated Months
- 1 Season ≈ 30 Simulated Years

구체적인 period 단위와 Scenario 정의가 기존 PLAY-02 문서에 있다면 그 정의를 우선한다. 새로운 시간 단위를 임의로 추가하지 않는다.

---

## 7. Economic Batch Flow

```text
Current Season Period
        ↓
createEconomicBatch
        ↓
dispatchBatchChunks
        ↓
Cloud Tasks
        ↓
processBatchChunk
        ↓
Player Transaction
        ↓
aggregateBatch
        ↓
advanceSeasonClock
```

**Worker는 Season Clock을 직접 증가시키지 않는다.**

Batch가 정상적으로 완료된 이후에만 Clock 단계가 다음 Period로 진행한다.

---

## 8. Player Economic Transaction

Player 단위 경제 계산은 Firestore Transaction으로 처리한다.

개념:

```text
BEGIN TRANSACTION

1. PLAY_PLAYER_ASSET READ

2. Check:
   last_processed_period == current_period ?

3. YES
   → NO-OP

4. NO
   → Calculate income
   → Calculate basic living expense
   → Apply inflation
   → Update cash
   → Update net worth
   → Update last_processed_period
   → Update last_processed_batch_id

5. COMMIT
```

경제 상태와 Idempotency Marker는 동일 Transaction에서 처리한다.

---

## 9. Income Engine

Season 1에서는 표준화된 연간 소득 곡선을 사용한다.

기존 PLAY-02에서 확정된 Starting annual income, Career lifecycle, Income curve, Scenario parameters를 그대로 사용한다.

### 초기 기준

Starting Annual Income = 50,000,000 KRW

기존 경제 파라미터를 임의로 변경하지 않는다.

### Income Recognition

각 Simulation Period에 해당하는 소득을 계산한다.

동일 Period가 중복 실행되어도 소득이 중복 지급되지 않아야 한다.

예:

```text
Period 10

첫 실행 → Income + X
재실행 → Income + 0
```

---

## 10. Basic Living Expense

기존 PLAY-02 설계의 기본 생활비를 그대로 사용한다.

- Monthly Basic Living Cost = 3,000,000 KRW
- Annual Basic Living Cost = 36,000,000 KRW

해당 비용은 Simulation Period에 따라 계산한다.

---

## 11. Inflation

Basic Living Expense에는 기존 Scenario의 Inflation을 적용한다.

기존 PLAY-02의 Inflation Curve 및 Scenario 값을 그대로 사용한다.

임의로 다음을 변경하지 않는다.

- Inflation rate
- Income inflation
- Economic phase

Income과 Expense의 inflation 정책이 기존 설계에서 다르게 정의되어 있다면 해당 정의를 우선한다.

---

## 12. Cash Update

PLAY-07.1의 기본 현금 변화:

```text
Cash After Period
=
Cash Before Period
+ Recognized Income
- Basic Living Expense
```

기존 Scenario에서 별도의 확률적 Shock 또는 Expense가 해당 Period에 정의되어 있다면 PLAY-02의 확정 규칙을 우선한다.

이번 단계에서는 Property, Loan, Rent, Jeonse 등의 현금 흐름을 추가하지 않는다.

---

## 13. Net Worth

PLAY-07.1에서 Property와 Financial Asset은 0으로 유지한다.

Debt 역시 0에서 시작하며 Loan Engine은 아직 구현하지 않는다.

기본 구조:

```text
Net Worth
=
Cash
- Debt
+ Property Value
+ Financial Asset
```

초기:

```text
Cash = 700M
Debt = 0
Property = 0
Financial Asset = 0

Net Worth = 700M
```

---

## 14. Economic State Invariants

### Cash

기존 Cash 구조를 유지한다.

```text
cash_total = cash_available + cash_locked
```

PLAY-07.1에서는 Property/Order Book이 아직 없으므로 일반적인 경우 locked cash는 0이다.

### Debt

Loan Engine이 구현되지 않으므로 기존 초기조건에서는:

```text
debt_total = 0
```

### Net Worth

```text
net_worth
=
cash_total
- debt_total
+ property_value
+ financial_asset_total
```

---

## 15. Player Idempotency

Player-level Idempotency Key:

```text
SEASON_ID
+
SIMULATION_PERIOD
+
BATCH_TYPE
+
PLAYER_ID
```

기존 PLAY-05.2에서 확정한 구조를 그대로 사용한다.

PLAY_PLAYER_ASSET에는 다음 필드를 유지한다.

- last_processed_period
- last_processed_batch_id
- last_processed_at

---

## 16. Batch Idempotency

Batch-level Idempotency:

```text
SEASON_ID
+
SIMULATION_PERIOD
+
BATCH_TYPE
```

동일 Batch가 중복 생성되지 않아야 한다.

이미 존재하면 기존 PLAY-06 구현에서 확정한 동일한 결과를 반환한다.

---

## 17. Retry Safety

Cloud Tasks는 At-Least-Once delivery를 전제로 한다.

다음 상황을 안전하게 처리해야 한다.

```text
Worker 실행
    ↓
Firestore Commit
    ↓
Response 전송 전 Worker Failure
    ↓
Cloud Tasks Retry
```

Retry된 Worker가 동일 Player를 다시 처리해도 경제 상태가 중복 변경되지 않아야 한다.

---

## 18. Concurrency

동일 Player / 동일 Period에 대해 복수 Worker가 동시에 실행될 수 있다.

Expected:

```text
경제 상태 변경 = 정확히 1회
```

Firestore Transaction 및 `last_processed_period`로 보장한다.

---

## 19. Mid-Chunk Failure

다음 상황을 실제 환경에서 검증한다.

```text
Chunk
 ├─ Player 1 → Process
 ├─ Player 2 → Process
 ├─ Player 3 → Process
 ├─ Worker Failure
 └─ Player 4~N → 미처리
```

Retry:

```text
Player 1~3 → NO-OP
Player 4~N → Process
```

최종적으로 모든 Player가 정확히 1회만 반영되어야 한다.

단순 동시성 테스트를 Mid-Chunk Failure 테스트로 대체하지 않는다.

---

## 20. Reconciliation

Economic Batch 완료 후 다음을 검증할 수 있어야 한다.

- Batch status
- Chunk count
- Completed chunk count
- Failed chunk count
- Player processed count

Player 상태:

- cash consistency
- debt consistency
- net worth consistency
- last_processed_period
- last_processed_batch_id

불일치가 발견되면 기존 PLAY-05/06 정책에 따라 `TRANSACTION_PAUSED` 등의 보호 상태로 전환한다.

---

## 21. Decision Log

최소 다음을 기록할 수 있는 기본 구조를 유지한다.

- season_id
- player_id
- simulation_period
- event_type
- timestamp
- state_before
- action
- state_after

PLAY-07.1에서는 BUY/SELL 등의 직접 의사결정이 없으므로 경제 Batch에 따른 상태 변화 기록을 기본 Event로 남길 수 있다.

---

## 22. Test Plan

### T01 — Period Progression

Period 0 → Period 1.

Expected:

```text
current_simulation_period = 1
```

### T02 — Income

Starting income 기준으로 Period 소득 반영.

Expected:

```text
Cash 증가 = recognized income
```

단, 같은 Period의 Expense가 함께 적용된다.

### T03 — Basic Living Cost

Expected:

```text
Cash 감소 = 해당 Period 생활비
```

### T04 — Inflation

기존 Scenario Inflation 적용 확인.

### T05 — Duplicate Player Processing

동일 Player / Period를 두 번 실행.

Expected:

```text
첫 번째 → PROCESS
두 번째 → NO-OP
```

### T06 — Concurrent Processing

동일 Player / Period에 5개 이상의 동시 Worker 실행.

Expected:

```text
경제 상태 변경 = 1회
```

### T07 — Worker Retry

처리 완료 후 동일 Task Retry.

Expected:

```text
NO-OP
```

### T08 — Mid-Chunk Failure

Chunk 중간 Worker Failure 후 Retry.

Expected:

```text
이미 처리된 Player → NO-OP
미처리 Player → PROCESS
```

### T09 — Duplicate Season Clock

동일 Period에 Clock Advance 중복 요청.

Expected:

```text
Period 증가 = 1회
```

### T10 — Reconciliation

경제 상태와 Batch/Chunk 상태 일치 여부 확인.

Expected:

```text
No inconsistency
```

---

## 23. Security Regression

PLAY-06.1에서 검증된 보안 경계를 유지한다.

검증:

```text
Unauthenticated Client → DENY
Wrong Service Account → DENY
Wrong Audience → DENY
Expired Token → DENY
Valid Internal Task → ALLOW
```

PLAY-07.1 구현 때문에 Worker 인증을 우회하거나 약화하지 않는다.

---

## 24. Observability

모든 Economic Batch와 Worker 실행에는 최소한 다음 정보를 남긴다.

```text
request_id
trace_id
season_id
batch_id
chunk_id
player_id
simulation_period
batch_type
function
timestamp
```

경제 상태 변경의 Before / After를 감사할 수 있어야 한다.

---

## 25. Failure Handling

다음 장애를 고려한다.

1. Worker Timeout
2. Worker Crash
3. Firestore Transaction Abort
4. Cloud Tasks Retry
5. Duplicate Task
6. Batch Aggregator Delay
7. Season Clock Duplicate
8. Reconciliation Failure

경제 상태가 부분적으로 손상되는 경우보다 안전한 방향으로 정지하는 기존 PLAY-05 정책을 유지한다.

---

## 26. 구현 금지사항

다음 변경은 하지 않는다.

- PLAY-06.1 인증 제거
- Firebase Security Rules 완화
- Client-side economic state write 허용
- Economic calculation을 Client로 이동
- AI/LLM을 경제 계산에 사용
- Property Market 구현
- Loan 구현
- Tax 구현
- Rent/Jeonse 구현
- GLI 계산 추가
- Reward 구현
- Season Analysis 구현
- RealRankers 대규모 리팩터링

---

## 27. Deliverables

구현 후 다음 문서를 생성한다.

```text
PLAY_07.1_INCOME_EXPENSE_ENGINE_SPEC.md
PLAY_07.1_IMPLEMENTATION_REPORT.md
PLAY_07.1_VERIFICATION_REPORT.md
```

---

## 28. Verification Evidence

각 테스트는 다음 형식으로 기록한다.

```text
Test ID:
Timestamp:
Project ID:
Region:
Function:
Execution ID:
Request ID:
Task Name:
Player ID:
Simulation Period:
Firestore Path:
State Before:
State After:
Expected:
Actual:
Evidence:
```

Evidence 없는 PASS는 인정하지 않는다.

---

## 29. Final Verdict

최종 결과는 다음 중 하나만 사용한다.

```text
READY FOR PLAY-07.2
READY AFTER FIXES
NOT READY
```

다음 중 하나라도 발견되면 `NOT READY`:

- Income 중복 지급
- Expense 중복 차감
- Cash inconsistency
- Net Worth inconsistency
- Player Idempotency failure
- Batch Idempotency failure
- Concurrent processing corruption
- Mid-Chunk recovery failure
- Duplicate Clock advance
- Reconciliation failure
- Security regression
- Evidence 없는 핵심 PASS

---

## 30. PLAY-07.1 완료 조건

다음 전체 구조가 실제 환경에서 검증되어야 한다.

```text
Global Season Clock
        ↓
Economic Batch
        ↓
Chunk Dispatch
        ↓
Cloud Tasks
        ↓
Player Economic Transaction
        ↓
Income
        +
Basic Expense
        ↓
PLAY_PLAYER_ASSET
        ↓
Idempotency
        ↓
Batch Aggregation
        ↓
Reconciliation
        ↓
Season Clock Advance
```

동일한 경제 조건에서 동일한 입력이 주어졌을 때 동일한 결과가 재현되어야 한다.

---

## 31. 핵심 원칙

PLAY-07.1에서 가장 중요한 것은 기능의 양이 아니다.

> **경제 상태가 서버에서 deterministic하게 계산되고, 중복 실행·동시성·장애 상황에서도 한 번만 정확하게 반영되는가?**

이다.

PLAY-07.1의 검증이 완료되기 전에는 PLAY-07.2를 구현하지 않는다.
