# PLAY-07.3 BATCH PROCESSING ENGINE — IMPLEMENTATION & SAFETY SPEC

## 1. 목적

PLAY-07.2 Property Market Engine의 최종 검증을 종료하고, 다음 단계인 **PLAY-07.3 Batch Processing Engine**으로 진입한다.

PLAY-07.2에서는 다음 핵심 기능이 검증되었다.

- Property Master 209건
- NORMAL 200 / INCOMPLETE 9
- Primary Supply
- Primary Purchase Concurrency
- BUY / SELL Lock
- Order Cancellation
- Secondary Atomic Matching
- Idempotency
- Price-Time Priority
- Concurrent Secondary Matching
- Crash → Retry → Recovery
- Full Property Lifecycle E2E
- Reconciliation

검증 과정에서 실제 Firestore Transaction 오류, Idempotency Key collision, 테스트 failure masking 문제를 발견하고 수정했다.

따라서 PLAY-07.3에서는 새로운 경제 기능을 무작정 추가하는 것이 아니라,

> **월간 경제 Batch가 수많은 Player에게 적용될 때, 중복 실행·부분 실패·재시도·동시 실행·Season Clock 오류 없이 정확하게 처리되는 Batch Engine**

을 구현하고 검증한다.

---

# 2. 핵심 목표

PLAY-07.3의 핵심 질문은 다음과 같다.

> **하나의 Simulation Period에 대해 모든 Player의 경제 상태를 정확히 한 번 처리하고, 일부 Worker가 실패하거나 재시도되어도 중복 경제효과 없이 전체 Batch를 안전하게 완료할 수 있는가?**

이를 위해 다음 계층을 유지한다.

```text
Season
  ↓
Simulation Period
  ↓
Batch
  ↓
Batch Chunks
  ↓
Player
  ↓
Economic Transaction
```

각 계층의 책임을 명확히 분리한다.

---

# 3. 기존 아키텍처 보존 원칙

PLAY-07.2에서 검증된 다음 원칙을 유지한다.

## 3.1 Server Authority

경제 상태 변경은 Client가 직접 수행하지 않는다.

Client
→ Callable/API
→ Cloud Function
→ Firestore Transaction

구조를 유지한다.

## 3.2 Firestore Source of Truth

경제 상태의 canonical source는 Firestore다.

BigQuery는 분석/조회용 copy이며 경제 상태의 authoritative source가 아니다.

## 3.3 Batch Worker는 Season Clock을 직접 변경하지 않는다

Worker는 자신의 Chunk/Player 처리만 담당한다.

Season Clock은 Batch가 완전히 완료된 후에만 별도 Aggregator/Clock 단계에서 전진한다.

## 3.4 Idempotency

다음 3개 수준을 유지한다.

### Batch

`season_id + simulation_period + batch_type`

### Chunk

`batch_id + chunk_id`

### Player

`season_id + simulation_period + batch_type + player_id`

동일 Player에 대한 동일 Period 경제효과가 두 번 발생하면 안 된다.

---

# 4. PLAY-07.3 범위

이번 단계의 핵심 범위:

1. Economic Batch 생성
2. Player Chunk 분할
3. Cloud Tasks dispatch
4. Chunk Worker
5. Player-level Idempotency
6. 경제 상태 변경
7. Chunk completion
8. Batch Aggregation
9. Batch completion
10. Season Clock advancement
11. Retry
12. Failure recovery
13. Reconciliation
14. Audit / Decision Log
15. Observability

이번 단계에서 다음 기능은 별도 요구사항으로 확장하지 않는다.

- AI 경제 의사결정
- Ranking
- Reward
- Tax
- Complex Policy Model
- 신규 Property Valuation
- GLI 경제계산
- 대규모 UI 개편
- Microservice 분리
- Kubernetes
- Multi-region
- Event Sourcing

---

# 5. Batch Lifecycle

Batch 상태:

```text
PENDING
↓
DISPATCHING
↓
RUNNING
↓
AGGREGATING
↓
COMPLETED
```

실패 시:

```text
RUNNING
↓
FAILED / DEGRADED
↓
RETRY
↓
RUNNING
```

복구 불가능하거나 데이터 무결성이 의심되면:

```text
TRANSACTION_PAUSED
```

로 전환한다.

---

# 6. Batch 생성

Batch 생성 시:

- season_id
- simulation_period
- batch_type
- scenario_id
- scenario_version
- rule_version
- expected_player_count
- chunk_count
- status
- created_at
- started_at
- completed_at

을 기록한다.

동일:

`season_id + simulation_period + batch_type`

으로 두 개의 canonical Batch가 생성되어서는 안 된다.

---

# 7. Chunk 설계

기존 PLAY-05.2에서 정의한 Chunk 구조를 유지한다.

필수 필드:

- chunk_id
- batch_id
- season_id
- simulation_period
- batch_type
- task_name
- chunk_index
- player_count
- processed_count
- failed_count
- status
- attempt_count
- created_at
- started_at
- completed_at
- last_error

초기 chunk size는 기존 설계값을 따른다.

> 100~200 Player

단, 실제 성능 테스트 결과에 따라 조정 가능하며 변경 시 근거를 기록한다.

---

# 8. Player Processing

각 Player 처리에서 반드시 다음을 하나의 Firestore Transaction으로 처리한다.

1. Player 현재 상태 Read
2. `last_processed_period` 확인
3. 이미 처리된 Period인지 확인
4. 아직 처리되지 않았다면 경제 계산
5. cash / income / expense / net worth 변경
6. `last_processed_period` 업데이트
7. Decision Log 생성 또는 canonical action 기록
8. Transaction commit

핵심 원칙:

> **경제 상태 변경과 `last_processed_period` 변경은 동일 Transaction 안에서 이루어져야 한다.**

---

# 9. Player Idempotency

예:

```text
season_1
period_17
ECONOMIC_MONTHLY
player_123
```

에 대해 이미 처리됐다면 다시 실행해도 경제효과가 발생하지 않는다.

Retry 결과:

```text
NO-OP
```

또는 canonical processed result를 반환한다.

중요:

- cash double deduction 금지
- income double credit 금지
- expense double charge 금지
- Decision Log 중복 금지
- net worth double update 금지

---

# 10. Economic Batch 계산

PLAY-07.1에서 확정한 경제 파라미터를 사용한다.

기존 확정값을 변경하지 않는다.

- Simulation Period = 1 simulated month
- 360 periods = 30 simulated years
- Starting Cash = 700M
- Starting Annual Income = 50M
- Basic Living Cost = 3M/month
- Income Growth = inflation - 0.5%p
- 동일 Season에서는 동일 economic environment
- phase-based inflation
- season-level economic shock

경제 계산 공식은 기존 PLAY-07.1 구현을 재사용한다.

PLAY-07.3에서 경제 파라미터를 재설계하지 않는다.

---

# 11. Chunk Worker

Worker는 다음 책임만 갖는다.

1. Chunk claim
2. Player 목록 조회
3. Player별 처리
4. 처리 결과 기록
5. Chunk progress update
6. 실패 Player 기록
7. Chunk completion 판단

Worker는:

- Season Clock 변경 금지
- Batch completion 직접 변경 금지
- 다른 Chunk 수정 금지

---

# 12. Mid-Chunk Failure

예:

100명의 Player 중 47명 처리 후 Worker가 crash.

Retry 시:

- 1~47번 Player → 이미 처리되었으므로 NO-OP
- 48~100번 Player → 정상 처리

되어야 한다.

최종:

```text
processed_count = 100
duplicate economic effects = 0
```

이어야 한다.

---

# 13. Batch Aggregator

Aggregator는 모든 Chunk가 완료되었는지 확인한다.

조건:

```text
ALL chunks == COMPLETED
```

일 때만 Batch를 COMPLETED로 변경한다.

Worker는 Batch를 직접 COMPLETED로 만들지 않는다.

Batch Aggregator 자체도 Idempotent해야 한다.

Aggregator가 2회 실행되어도:

- Batch completion 1회
- Season Clock advancement 1회

만 발생해야 한다.

---

# 14. Season Clock

Season Clock은 다음 조건에서만 전진한다.

```text
current_period == expected_period
AND
Batch.status == COMPLETED
AND
Reconciliation == PASS
```

Period advancement는 한 번만 발생해야 한다.

동일 Clock advancement request가 여러 번 들어와도 중복 전진하면 안 된다.

---

# 15. Failure Scenarios

최소 다음 상황을 테스트한다.

### F01
Batch creation duplicate

### F02
Chunk dispatch duplicate

### F03
Worker crash before Player processing

### F04
Worker crash mid-chunk

### F05
Worker crash after Player transaction commit

### F06
Cloud Task duplicate delivery

### F07
Same Player duplicate processing

### F08
Chunk completion duplicate

### F09
Aggregator duplicate execution

### F10
Season Clock duplicate request

### F11
Firestore contention

### F12
Reconciliation failure

### F13
Invalid Player state

### F14
Bad deployment / rule version mismatch

---

# 16. Reconciliation

Batch 완료 전 반드시 reconciliation을 수행한다.

최소 확인:

### Player count

`expected_player_count == processed_player_count`

### Period

모든 정상 Player:

`last_processed_period == current_period`

### Cash

`cash_total = cash_available + cash_locked`

### Cash

`cash_total >= 0`

### Duplicate processing

동일 Player / Period / Batch Type의 경제효과가 2회 이상 존재하지 않아야 한다.

### Decision Log

경제 action과 log count가 일치해야 한다.

### Batch

모든 Chunk가 COMPLETED여야 한다.

---

# 17. Observability

각 경제 처리에는 추적 가능한 correlation 정보를 남긴다.

최소:

- season_id
- simulation_period
- batch_id
- chunk_id
- player_id
- task_name
- request_id
- idempotency_key
- function_name
- rule_version
- scenario_version
- started_at
- completed_at
- error_code

문제가 발생했을 때:

> Player → Period → Batch → Chunk → Task → Function → Transaction

경로를 역추적할 수 있어야 한다.

---

# 18. Golden Scenario

PLAY-07.3부터 최소 하나의 Golden Scenario를 운영한다.

고정된:

- season configuration
- scenario version
- rule version
- random seed
- player set
- initial state

을 사용한다.

Golden Scenario의 각 Period 결과를 expected state와 비교한다.

코드 변경 후 결과가 달라지면 자동으로 Regression Failure 처리한다.

---

# 19. Deterministic Replay

특정 Player의 특정 Period에서 오류가 발생했을 경우:

```text
season_id
scenario_id
scenario_version
rule_version
random_seed
simulation_period
player_id
```

를 사용하여 동일 상태를 재현할 수 있어야 한다.

Production에서 발생한 경제 상태 이상을 검증 환경에서 재현할 수 있어야 한다.

---

# 20. Side Effect Protection

Batch Engine 수정 후 반드시:

- Economic Engine regression
- Property Market regression
- Idempotency regression
- Reconciliation regression
- Season Clock regression

을 수행한다.

PLAY-07.3의 수정이 PLAY-07.2 Property Market을 깨뜨리면 안 된다.

---

# 21. Test Strategy

구현 순서:

### Phase 1
Batch Creation

### Phase 2
Chunk Dispatch

### Phase 3
Player-level Processing

### Phase 4
Mid-Chunk Recovery

### Phase 5
Batch Aggregation

### Phase 6
Season Clock

### Phase 7
Reconciliation

### Phase 8
Observability

### Phase 9
Golden Scenario / Replay

### Phase 10
Full E2E

각 Phase에서:

```text
Implement
→ Unit Test
→ Integration Test
→ Failure Injection
→ Retry Test
→ Reconciliation
→ Regression
```

순서를 유지한다.

---

# 22. Stop Conditions

다음 중 하나라도 발생하면 다음 Phase로 넘어가지 않는다.

- Player 경제효과 중복
- Batch 중복
- Chunk 중복 처리
- Season Clock 중복 전진
- Partial batch가 COMPLETED 처리됨
- 실패 Player가 정상 처리된 것으로 표시됨
- Reconciliation이 오류를 놓침
- Production 상태 재현 불가
- Golden Scenario 결과 변경
- Property Market regression
- Idempotency regression
- Cash invariant violation
- Audit trail 누락
- 문제 발생 후 원인 추적 불가

---

# 23. 완료 기준

PLAY-07.3은 다음 조건을 모두 만족해야 한다.

1. 360-period simulation 정상 수행
2. Player-level idempotency 검증
3. Mid-chunk crash/retry 검증
4. Duplicate Cloud Task 검증
5. Duplicate Worker 검증
6. Aggregator duplicate 실행 검증
7. Season Clock duplicate 실행 검증
8. Reconciliation 검증
9. Golden Scenario PASS
10. Deterministic Replay PASS
11. PLAY-07.2 Regression PASS
12. 실제 Firebase/GCP 환경 E2E PASS

최종 상태:

> **READY FOR PLAY-08**

단순 기능 구현 완료가 아니라 **운영 가능한 Batch Engine**임을 증명해야 한다.

---

# 24. 최종 원칙

PLAY-07.3부터는 다음 원칙을 모든 개발에 적용한다.

> **Bug-free를 목표로 하지 않는다.**

대신:

> **Traceable**
>
> **Reproducible**
>
> **Correctable**
>
> **Regression-safe**
>
> **Recoverable**

한 시스템을 만든다.

즉,

**버그가 발생해도 발견할 수 있고, 원인을 추적할 수 있고, 같은 상황을 재현할 수 있고, 최소 범위로 수정할 수 있으며, 수정으로 인한 Side Effect를 자동으로 검출할 수 있어야 한다.**
