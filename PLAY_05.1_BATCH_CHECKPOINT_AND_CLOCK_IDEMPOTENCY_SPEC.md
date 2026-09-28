# PLAY_05.1_BATCH_CHECKPOINT_AND_CLOCK_IDEMPOTENCY_SPEC

## 1. 문서 목적

본 문서는 `PLAY_05_BACKEND_INFRASTRUCTURE_RELIABILITY_SPEC`의 AG 검토
결과에서 지적된 Blocking Issue를 보완한다.

범위는 다음 3가지로 제한한다.

1.  Batch Chunk Checkpoint / Resume
2.  Season Clock 중복 실행 방지
3.  Idempotency Key 및 실행 식별자 체계

본 문서는 경제 규칙, 부동산 시장 규칙, 수입/지출 규칙, 보상 규칙을
변경하지 않는다.

------------------------------------------------------------------------

## 2. 핵심 원칙

PLAY의 시간과 경제 상태는 반드시 다음 원칙을 따른다.

-   한 번 성공한 경제 연산은 동일 실행 식별자로 다시 적용되지 않는다.
-   Worker가 중단되어도 완료된 Chunk는 다시 처리하지 않는다.
-   실패한 Chunk만 재처리할 수 있어야 한다.
-   Scheduler가 중복 호출되어도 동일 Simulation Period가 두 번 진행되지
    않는다.
-   모든 경제 상태 변경은 Server Authority + Firestore Transaction을
    따른다.
-   Client는 Simulation Time을 결정하지 않는다.
-   재시도는 오류가 아니라 정상적인 분산 시스템 동작으로 취급한다.
-   동일한 요청이 여러 번 도착해도 경제 결과는 한 번만 반영된다.

------------------------------------------------------------------------

## 3. 실행 식별자 체계

모든 경제 Batch와 주요 변경 요청에는 다음 식별자를 사용한다.

### 3.1 Season

-   `season_id`: Season 고유 ID
-   `scenario_id`
-   `scenario_version`
-   `rule_version`

### 3.2 Simulation Period

-   `simulation_period`: 해당 Season의 경제 시간 구간
-   예: `Y01`, `Y02`, 또는 구현 시 정의한 동일한 단위

같은 `season_id + simulation_period`는 경제적으로 한 번만 확정
처리되어야 한다.

### 3.3 Batch

-   `batch_id`: 하나의 경제 Batch 실행 단위
-   `batch_type`: 예) `ECONOMIC_TICK`, `PRIMARY_INIT`, `RECONCILIATION`
-   `created_at`
-   `status`: `PENDING | RUNNING | COMPLETED | FAILED | PAUSED`

### 3.4 Chunk

-   `chunk_id`
-   `batch_id`
-   `chunk_index`
-   `status`: `PENDING | RUNNING | COMPLETED | FAILED`
-   `attempt_count`
-   `started_at`
-   `completed_at`
-   `last_error`

------------------------------------------------------------------------

## 4. Batch Chunk 설계

### 4.1 기존 Counter 방식의 문제

다음과 같은 단순 구조는 사용하지 않는다.

``` text
processed_players = 8000
```

이 방식만으로는 병렬 Worker가 어디까지 완료했는지 정확히 추적하기
어렵다.

### 4.2 Chunk 기반 구조

예:

``` text
BATCH_20260924_001
 ├─ CHUNK_001 → COMPLETED
 ├─ CHUNK_002 → COMPLETED
 ├─ CHUNK_003 → COMPLETED
 ├─ CHUNK_004 → FAILED
 ├─ CHUNK_005 → PENDING
 └─ ...
```

Worker는 자신의 `chunk_id`를 기준으로 작업한다.

성공한 경우:

``` text
Chunk.status = COMPLETED
```

실패한 경우:

``` text
Chunk.status = FAILED
attempt_count += 1
```

### 4.3 Resume 규칙

Batch 재개 시 다음 Chunk만 대상으로 한다.

``` text
PENDING
FAILED
```

다음 상태는 재처리하지 않는다.

``` text
COMPLETED
```

단, `RUNNING` 상태에서 Worker 장애가 발생한 경우에는 timeout/lease
기준으로 `FAILED` 또는 재처리 가능 상태로 전환한다.

------------------------------------------------------------------------

## 5. Chunk Worker Idempotency

Worker가 같은 Chunk를 두 번 수행하더라도 경제 상태가 중복 변경되어서는
안 된다.

Worker 실행 시:

1.  `batch_id + chunk_id` 확인
2.  Chunk 상태 확인
3.  이미 `COMPLETED`이면 즉시 종료
4.  처리 전 `RUNNING` 상태 획득
5.  Player별 경제 변경은 Firestore Transaction
6.  각 변경에는 동일한 실행 식별자 사용
7.  전체 Chunk 성공 후 `COMPLETED` 기록

### 중요

Chunk 상태 변경과 Player 경제 상태 변경 사이에서 장애가 발생할 수
있으므로, 실제 구현에서는 `chunk_id`만 믿지 말고 Player 변경에도 실행
식별자를 남겨 재실행 여부를 판별한다.

------------------------------------------------------------------------

## 6. Idempotency Key

모든 변경 요청은 `idempotency_key`를 가져야 한다.

### 6.1 사용자 요청

예:

``` text
request_id = UUID
idempotency_key = request_id
```

또는 거래 행위에 대해:

``` text
idempotency_key = ORDER_ID + ACTION
```

### 6.2 Batch 요청

``` text
idempotency_key =
SEASON_ID + SIMULATION_PERIOD + BATCH_TYPE
```

예:

``` text
S01 + Y05 + ECONOMIC_TICK
```

동일 Key가 이미 성공 처리되었다면 재실행하지 않는다.

------------------------------------------------------------------------

## 7. PLAY_IDEMPOTENCY_LOG

권장 컬렉션:

``` text
PLAY_IDEMPOTENCY_LOGS/{idempotency_key}
```

주요 필드:

``` text
idempotency_key
season_id
batch_id
chunk_id
request_id
operation_type
status
created_at
completed_at
result_reference
```

상태 예:

``` text
PROCESSING
COMPLETED
FAILED
```

Idempotency Log 생성은 실제 경제 상태 변경과 동일한 Firestore
Transaction 경계에서 처리하는 것을 원칙으로 한다.

------------------------------------------------------------------------

## 8. Season Clock 설계

Season Clock은 Client 시간을 사용하지 않는다.

서버가 관리한다.

핵심 상태:

``` text
season_id
current_simulation_period
last_successful_batch_id
last_successful_period
clock_status
```

`clock_status`:

``` text
RUNNING
PAUSED
ERROR
```

------------------------------------------------------------------------

## 9. Season Clock 중복 실행 방지

Scheduler가 동일 Tick을 두 번 호출할 수 있다는 전제를 둔다.

예:

``` text
Scheduler A → Y05 실행
Scheduler B → Y05 실행
```

두 번째 요청은 반드시 차단되어야 한다.

검증:

``` text
season_id + simulation_period + batch_type
```

기준으로 이미 성공한 실행이 있는지 확인한다.

이미 `COMPLETED`이면:

``` text
NO-OP
```

처리한다.

경제 시간은 증가시키지 않는다.

------------------------------------------------------------------------

## 10. Clock Advance Atomicity

다음 순서를 하나의 논리적 상태 전이로 관리한다.

``` text
Current Period 확인
        ↓
Execution Key 생성
        ↓
중복 여부 확인
        ↓
Batch 생성
        ↓
Chunk 실행
        ↓
모든 Chunk COMPLETED
        ↓
Season Current Period 변경
        ↓
Batch COMPLETED
```

중요한 원칙:

> 모든 Player 처리가 완료되기 전에 `current_simulation_period`를 다음
> 구간으로 변경하지 않는다.

단, 구현상 대규모 Batch 때문에 하나의 Firestore Transaction으로 전체
Player를 묶을 수 없으므로, `Batch COMPLETED`를 경제 시간 전진의 최종
커밋 조건으로 사용한다.

------------------------------------------------------------------------

## 11. Partial Batch 상태

예:

``` text
Y10
100개 Chunk

99개 COMPLETED
1개 FAILED
```

이 경우:

``` text
current_simulation_period = Y09
```

상태를 유지한다.

Y10은 아직 완료된 것으로 간주하지 않는다.

실패 Chunk를 재처리한다.

모든 Chunk가 완료된 후에만:

``` text
current_simulation_period = Y10
```

으로 확정한다.

------------------------------------------------------------------------

## 12. Scheduler 장애

Scheduler가 실행되지 않은 경우:

``` text
last_successful_period
```

와 현재 Wall Clock을 비교하여 Lag를 감지한다.

상태:

``` text
CLOCK_LAG
```

Alert 발생.

자동으로 여러 Simulation Period를 무조건 건너뛰지 않는다.

복구 방식은:

``` text
누락된 Period 확인
→ 순차 Batch 생성
→ 각 Batch 완료 확인
→ 다음 Period 진행
```

을 기본 원칙으로 한다.

------------------------------------------------------------------------

## 13. Scheduler 중복 장애

동일 Period에 Scheduler가 여러 번 호출되어도:

``` text
same execution key
```

로 판정한다.

첫 번째 실행:

``` text
PROCESSING → COMPLETED
```

두 번째 실행:

``` text
이미 PROCESSING / COMPLETED
→ 중복 실행 차단
```

Scheduler 자체를 신뢰하지 않고 Server-side 상태를 최종 권위로 사용한다.

------------------------------------------------------------------------

## 14. Worker Crash

예:

``` text
Chunk 008
Player 1~500 처리 중
Worker Crash
```

재시도 시:

1.  Chunk 상태 확인
2.  Player별 Idempotency 상태 확인
3.  이미 성공한 Player는 Skip
4.  미완료 Player만 처리
5.  전체 성공 후 Chunk COMPLETED

따라서 Worker가 중간에 죽어도 경제 상태가 이중 반영되지 않는다.

------------------------------------------------------------------------

## 15. Batch Checkpoint와 Reconciliation

Batch 완료 후 다음 검증을 수행한다.

### 필수 검증

``` text
cash.total >= 0
cash.total = cash.available + cash.locked
asset ownership consistency
debt consistency
transaction consistency
```

Season Clock 진행 전 경량 Reconciliation을 수행한다.

불일치가 발견되면:

``` text
PLAY_SEASON.status = TRANSACTION_PAUSED
```

로 변경한다.

이후 신규 거래/경제 변경을 차단하고 원인 분석을 수행한다.

------------------------------------------------------------------------

## 16. Emergency Stop

Emergency Stop은 다음 상황에서 발동 가능하다.

-   Asset 불일치
-   Cash 음수
-   Ownership 불일치
-   Duplicate execution 탐지
-   Batch corruption
-   비정상 거래 급증
-   배포 후 경제 결과 이상
-   Reconciliation 실패

상태:

``` text
TRANSACTION_PAUSED
```

READ는 허용한다.

경제 상태를 변경하는 Callable Function은 차단한다.

------------------------------------------------------------------------

## 17. Request / Trace ID

모든 사용자 요청에는:

``` text
request_id
```

를 부여한다.

Decision Log 및 Transaction Log에 연결한다.

예:

``` text
request_id
  ↓
BUY request
  ↓
Order
  ↓
Match
  ↓
Transaction
  ↓
Asset Update
  ↓
Decision Log
```

이를 통해 장애 발생 시 하나의 사용자 요청이 어디까지 처리됐는지 추적할
수 있어야 한다.

------------------------------------------------------------------------

## 18. 구현 우선순위

AG 구현 순서는 다음으로 한다.

### Phase 1 --- Reliability Foundation

-   [ ] PLAY_IDEMPOTENCY_LOGS
-   [ ] batch_id / chunk_id schema
-   [ ] request_id
-   [ ] simulation_period
-   [ ] season clock state
-   [ ] Firestore transaction boundary

### Phase 2 --- Batch Controller

-   [ ] Chunk 생성
-   [ ] Chunk 상태 관리
-   [ ] Worker assignment
-   [ ] Retry
-   [ ] Resume
-   [ ] FAILED → 재처리

### Phase 3 --- Season Clock

-   [ ] Scheduler trigger
-   [ ] duplicate execution detection
-   [ ] period completion gate
-   [ ] lag detection
-   [ ] manual recovery trigger

### Phase 4 --- Reconciliation

-   [ ] Cash validation
-   [ ] Asset validation
-   [ ] Ownership validation
-   [ ] Debt validation
-   [ ] Emergency Stop

------------------------------------------------------------------------

## 19. 테스트 요구사항

AG는 최소 다음 테스트를 수행해야 한다.

### T01

동일 Scheduler 요청 2회 → 경제 시간 1회만 진행

### T02

동일 BUY 요청 2회 → 거래 1회만 발생

### T03

동일 Worker Task 2회 → Player 상태 1회만 변경

### T04

Chunk 중간 Crash → 완료 Player 중복 변경 없음

### T05

Chunk 실패 → FAILED Chunk만 Resume

### T06

99% Chunk 완료 + 1% 실패 → Season Clock 전진 금지

### T07

Reconciliation 불일치 → TRANSACTION_PAUSED

### T08

TRANSACTION_PAUSED 상태에서 BUY/SELL → 거부

### T09

Scheduler 장시간 미실행 → CLOCK_LAG 탐지

### T10

재시작 후 마지막 COMPLETED Period부터 정상 Resume

------------------------------------------------------------------------

## 20. 구현 제한

AG는 다음을 임의로 결정하지 않는다.

-   경제 규칙 변경
-   수입/지출 변경
-   LTV/DSR 변경
-   부동산 가격 규칙 변경
-   Primary/Secondary Market 변경
-   거래 수수료 변경
-   Season 기간 변경
-   7억원 초기자산 변경

구현 중 모호하거나 충돌하는 사항은 코드를 임의 수정하지 않고 질문/검토
사항으로 보고한다.

------------------------------------------------------------------------

## 21. Definition of Done

본 문서는 다음 조건을 모두 만족할 때 완료로 본다.

1.  동일 Simulation Period의 중복 실행이 차단된다.
2.  Batch가 Chunk 단위로 추적된다.
3.  실패 Chunk만 재처리할 수 있다.
4.  Worker 재실행에도 경제 상태가 중복 반영되지 않는다.
5.  Season Clock은 Batch 완료 후에만 전진한다.
6.  Reconciliation 실패 시 거래가 자동 중지된다.
7.  Request / Batch / Chunk를 추적할 수 있다.
8.  테스트 T01\~T10이 통과한다.
9.  경제 규칙이 변경되지 않았다.
10. AG가 최종 검토에서 `READY` 또는 동등한 판정을 내린다.

------------------------------------------------------------------------

## 22. 다음 단계

본 문서 검토가 완료되면:

`PLAY_05.1` → Reliability Infrastructure Implementation → PLAY Backend
Data Model → Primary Market Implementation → Secondary Market
Implementation → Economic Batch Integration

순으로 진행한다.

본 문서 단계에서는 실제 경제 기능 구현보다 **시간·배치·재시도·중복
실행에 대한 신뢰성 기반을 먼저 확정**한다.
