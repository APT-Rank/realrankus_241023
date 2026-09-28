# PLAY_06_BACKEND_INFRASTRUCTURE_IMPLEMENTATION_SPEC

## 1. 문서 목적

본 문서는 PLAY-05 Reliability Architecture와 PLAY-05.2 Batch/Player
Idempotency/Clock Aggregator 설계가 AG 최종 검토에서 `READY` 판정을 받은
이후, 실제 Backend Infrastructure 구현에 착수하기 위한 구현 명세다.

목표는 다음과 같다.

> PLAY의 경제 규칙을 변경하지 않고, Server Authority 기반의 안정적인
> 실행 기반을 실제 Firebase/GCP 환경에 구축한다.

본 단계에서는 부동산 시장 기능, 경제 규칙 확장, UI 고도화보다 **Backend
Infrastructure와 데이터 모델의 기반 구축**을 우선한다.

------------------------------------------------------------------------

# 2. 확정된 전제

다음 사항은 기존 PLAY 설계에서 이미 결정되었으며 본 문서에서 변경하지
않는다.

-   Season = 실제 3개월
-   Simulation = 30년
-   초기 Player Cash = 7억원
-   Initial Debt = 0
-   Initial Property = 0
-   Server Authority
-   Firebase Authentication 재사용
-   PLAY Client 직접 Write 금지
-   Firestore Transaction
-   Cloud Functions
-   Cloud Tasks
-   Chunk 기반 Batch
-   Player-level Idempotency
-   Batch Aggregator
-   Season Clock
-   Emergency Stop
-   Reconciliation
-   Firestore current state / BigQuery history 방향
-   기존 RealRankers 서비스와 PLAY 로직 분리

------------------------------------------------------------------------

# 3. 구현 범위

## IN SCOPE

### Infrastructure

-   Firebase/GCP 환경
-   Cloud Functions 2nd Gen
-   Firestore
-   Cloud Tasks
-   Security Rules
-   PITR
-   Logging
-   Monitoring
-   Alerting

### PLAY Core Data

-   PLAY_SEASON
-   PLAY_PLAYER
-   PLAY_PLAYER_ASSET
-   PLAY_BATCH
-   PLAY_BATCH_CHUNKS
-   PLAY_IDEMPOTENCY_LOGS

### Core Functions

-   Season creation
-   Player initialization
-   Batch creation
-   Chunk dispatch
-   Chunk Worker
-   Player economic transaction skeleton
-   Batch Aggregator
-   Season Clock Advance
-   Reconciliation
-   Emergency Stop
-   Health Check

------------------------------------------------------------------------

# 4. OUT OF SCOPE

이번 구현에서 다음은 구현하지 않는다.

-   Primary Market
-   Secondary Market
-   BUY / SELL
-   Property Ownership
-   Rent / Jeonse
-   Full Economic Engine
-   Tax
-   Loan calculation
-   GLI calculation
-   Reward
-   Hall of Fame
-   Season Analysis
-   BigQuery analytical model

단, 향후 기능이 연결될 수 있도록 데이터 구조와 인터페이스는 확장
가능하게 설계한다.

------------------------------------------------------------------------

# 5. Architecture

``` text
                 Existing RealRankers
                        │
                  Firebase Auth
                        │
                        ▼
                PLAY Frontend
                        │
                 Callable/API
                        │
                        ▼
             PLAY Cloud Functions
                        │
          ┌─────────────┼─────────────┐
          │             │             │
       Firestore     Cloud Tasks    Logging
          │             │             │
          │             ▼             │
          │        Chunk Workers       │
          │             │             │
          │             ▼             │
          │       Batch Aggregator     │
          │             │             │
          └─────────────┼─────────────┘
                        │
                   Season Clock
                        │
                        ▼
                 PLAY Economic World
```

------------------------------------------------------------------------

# 6. Environment Separation

최소 다음 환경을 분리한다.

``` text
development
staging
production
```

환경별 Firebase Project 또는 동등한 완전한 논리적 격리를 사용한다.

특히:

``` text
PLAY_DEV
PLAY_STAGING
PLAY_PROD
```

데이터가 서로 섞이지 않아야 한다.

Production 데이터에 개발 Worker가 접근하는 구조를 허용하지 않는다.

------------------------------------------------------------------------

# 7. Firebase Project / Existing RealRankers 분리

기존 RealRankers와 PLAY가 동일 Firebase Project를 공유하는 경우에도
다음을 강제한다.

### Shared

-   Firebase Auth
-   기존 Property Master Read
-   기존 Real Market Data Read

### PLAY-owned

-   PLAY_SEASON
-   PLAY_PLAYER
-   PLAY_PLAYER_ASSET
-   PLAY_BATCH
-   PLAY_BATCH_CHUNKS
-   PLAY_IDEMPOTENCY_LOGS

PLAY 데이터는 `PLAY_` namespace를 사용한다.

기존 RealRankers Client 코드가 PLAY 데이터를 직접 Write하지 못하게 한다.

------------------------------------------------------------------------

# 8. Firestore Security Rules

원칙:

``` text
PLAY Client Write = DENY
```

Client는 인증된 사용자에게 허용된 범위의 READ만 수행한다.

예:

``` text
PLAY_PLAYER
→ 자기 Player 데이터만 READ

PLAY_PLAYER_ASSET
→ 자기 Asset 데이터만 READ

PLAY_SEASON
→ 공개 Season 정보 READ

PLAY_BATCH
→ 필요한 공개 상태 READ
```

Write는 Client에서 허용하지 않는다.

모든 변경은 Cloud Functions Admin SDK를 통해 수행한다.

------------------------------------------------------------------------

# 9. Data Model

## 9.1 PLAY_SEASON

``` text
season_id
season_name

status
clock_status

scenario_id
scenario_version
rule_version

current_simulation_period
last_successful_period
last_successful_batch_id

start_at
end_at

transaction_status

created_at
updated_at
```

Status 예:

``` text
DRAFT
READY
ACTIVE
PAUSED
CLOSED
ANALYZING
ARCHIVED
```

Clock:

``` text
RUNNING
PAUSED
ERROR
```

Transaction:

``` text
OPEN
TRANSACTION_PAUSED
```

------------------------------------------------------------------------

# 10. PLAY_PLAYER

``` text
player_id
user_id
season_id

status

joined_at
last_active_at

created_at
updated_at
```

Player 상태는 경제 계산의 Source of Truth가 아니라 계정/참여 상태를
관리하는 용도로 사용한다.

경제 상태는 `PLAY_PLAYER_ASSET`에서 관리한다.

------------------------------------------------------------------------

# 11. PLAY_PLAYER_ASSET

``` text
player_id
season_id

cash_total
cash_available
cash_locked

debt_total

property_count
financial_asset_total

net_worth

last_processed_period
last_processed_batch_id
last_processed_at

created_at
updated_at
```

필수 정합성:

``` text
cash_total = cash_available + cash_locked
cash_total >= 0
```

향후 경제 엔진에서 자산 필드가 확장될 수 있다.

------------------------------------------------------------------------

# 12. PLAY_BATCH

``` text
batch_id
season_id

simulation_period
batch_type

status

total_chunks
completed_chunks
failed_chunks

created_at
started_at
completed_at

last_error
```

Batch Status:

``` text
PENDING
RUNNING
COMPLETED
FAILED
PAUSED
```

Batch는 Player 경제 상태를 직접 저장하지 않는다.

------------------------------------------------------------------------

# 13. PLAY_BATCH_CHUNKS

``` text
chunk_id
batch_id
season_id

simulation_period
batch_type

status

task_name
attempt_count

player_count
processed_count
failed_count

started_at
completed_at
last_error
```

Status:

``` text
PENDING
RUNNING
COMPLETED
FAILED
```

Chunk Worker는 자기 Chunk만 수정한다.

------------------------------------------------------------------------

# 14. PLAY_IDEMPOTENCY_LOGS

``` text
idempotency_key

season_id
batch_id
chunk_id
player_id

simulation_period
operation_type

request_id

status

created_at
completed_at

result_reference
```

범위:

``` text
Request
Batch
Chunk
Player Economic Operation
```

각 계층별 Key를 분리한다.

------------------------------------------------------------------------

# 15. Idempotency Rules

## Request

``` text
request_id
```

## Batch

``` text
season_id
+ simulation_period
+ batch_type
```

## Chunk

``` text
batch_id
+ chunk_id
```

## Player

``` text
season_id
+ simulation_period
+ batch_type
+ player_id
```

동일 Player 경제 Operation은 동일 Period에서 한 번만 성공한다.

------------------------------------------------------------------------

# 16. Core Function Structure

권장 Function:

``` text
createSeason
joinSeason
initializePlayer

createEconomicBatch
dispatchBatchChunks
processBatchChunk

aggregateBatch
advanceSeasonClock

runReconciliation
pauseTransactions
resumeTransactions

healthCheck
```

Function 이름은 실제 프로젝트 convention에 맞게 조정할 수 있다.

------------------------------------------------------------------------

# 17. createSeason

입력:

``` text
season_name
scenario_id
scenario_version
rule_version
```

서버가 생성:

``` text
season_id
status = DRAFT
clock_status = PAUSED
current_simulation_period = INITIAL
```

Client가 경제 초기값을 결정하지 않는다.

------------------------------------------------------------------------

# 18. joinSeason

사용자가 Season에 참여하면 Server Authority가:

``` text
PLAY_PLAYER
PLAY_PLAYER_ASSET
```

을 생성한다.

초기 상태:

``` text
cash_total = 700,000,000
cash_available = 700,000,000
cash_locked = 0

debt_total = 0
property_count = 0
financial_asset_total = 0
net_worth = 700,000,000
```

`last_processed_period`는 아직 경제 Tick이 실행되지 않은 상태로
기록한다.

------------------------------------------------------------------------

# 19. Economic Batch 생성

Season Clock이 다음 Period를 진행해야 할 때:

``` text
createEconomicBatch
```

실행.

검증:

``` text
season.status == ACTIVE
transaction_status != TRANSACTION_PAUSED
```

그리고:

``` text
current_simulation_period
```

를 기준으로 Batch를 생성한다.

동일 Period Batch가 이미 존재하면 새 Batch를 만들지 않는다.

------------------------------------------------------------------------

# 20. Chunk 생성

Player 목록을 configurable chunk size로 나눈다.

초기 운영값:

``` text
CHUNK_SIZE = 100~200
```

단, 이는 경제 규칙이 아니라 운영 파라미터다.

부하 테스트 결과에 따라 변경 가능하다.

각 Chunk:

``` text
PENDING
```

으로 생성한다.

------------------------------------------------------------------------

# 21. Cloud Tasks Dispatch

각 Chunk에 대해 Task를 생성한다.

Task Payload:

``` text
season_id
batch_id
chunk_id
simulation_period
```

Task 생성 후:

``` text
task_name
```

을 Chunk 문서에 저장한다.

Cloud Tasks는 at-least-once delivery를 전제로 한다.

따라서 Worker는 항상 중복 실행 가능성을 전제로 구현한다.

------------------------------------------------------------------------

# 22. processBatchChunk

Worker 시작:

1.  Season 확인
2.  Batch 확인
3.  Chunk 확인
4.  Transaction status 확인
5.  Chunk 상태 확인
6.  Chunk `RUNNING` 획득
7.  Player 목록 처리
8.  각 Player Transaction
9.  처리 수 기록
10. 전체 성공 시 Chunk `COMPLETED`

이미:

``` text
COMPLETED
```

인 Chunk는 즉시 종료한다.

------------------------------------------------------------------------

# 23. Player Economic Transaction

각 Player는 독립적인 Firestore Transaction으로 처리한다.

Transaction:

``` text
READ PLAY_PLAYER_ASSET

IF last_processed_period == target_period:
    NO-OP

ELSE:
    economic calculation skeleton
    asset update
    last_processed_period update
    last_processed_batch_id update
    last_processed_at update
```

현재 단계에서는 실제 경제 계산 대신 확장 가능한 함수 경계를 만든다.

예:

``` text
calculatePlayerPeriodEconomy()
```

------------------------------------------------------------------------

# 24. Batch Aggregator

본 구현에서는 AG 권고에 따라:

**Option B --- Deferred Cloud Task / Polling**

을 기본 방식으로 채택한다.

Batch 생성 시 Aggregator Task를 예약한다.

예:

``` text
3~5분 후 aggregateBatch 실행
```

Aggregator:

``` text
전체 Chunk 상태 조회
```

조건:

``` text
COMPLETED == total_chunks
```

이면:

``` text
Batch → COMPLETED
```

그 외에는:

``` text
Aggregator 재예약
```

한다.

단, 무한 재예약을 방지하기 위해 retry/timeout 정책을 둔다.

------------------------------------------------------------------------

# 25. Season Clock Advance

Aggregator가 Batch를 완료시킨 후 Clock Advance를 요청한다.

검증:

``` text
Batch.status == COMPLETED

AND

Batch.simulation_period
==
Season.current_simulation_period
```

Transaction으로:

``` text
current_simulation_period
→ next period

last_successful_period
→ completed period

last_successful_batch_id
→ batch_id
```

를 갱신한다.

이미 다음 Period라면 NO-OP.

------------------------------------------------------------------------

# 26. Reconciliation

최소 검증:

``` text
cash_total >= 0

cash_total
==
cash_available + cash_locked

net_worth
==
assets - liabilities

completed_chunk
==
player_count

completed_batch
==
total_chunks
```

불일치 발견:

``` text
transaction_status = TRANSACTION_PAUSED
clock_status = PAUSED
```

그리고 Alert.

------------------------------------------------------------------------

# 27. Emergency Stop

다음 상황에서 즉시 거래 변경을 중단할 수 있다.

-   Asset mismatch
-   Duplicate economic execution
-   Batch corruption
-   Ownership inconsistency
-   Negative cash
-   Reconciliation failure
-   비정상 Transaction 급증
-   잘못된 Deployment

상태:

``` text
TRANSACTION_PAUSED
```

READ는 허용.

경제 변경은 차단.

------------------------------------------------------------------------

# 28. Health Check

Health Check에서 확인할 항목:

``` text
Season status
Clock status
Last successful batch
Current simulation period
Batch lag
Failed chunks
DLQ count
Cloud Tasks backlog
Function error rate
Firestore transaction abort rate
```

Critical 상태에서는 Alert.

------------------------------------------------------------------------

# 29. Logging

모든 주요 요청에:

``` text
request_id
trace_id
season_id
batch_id
chunk_id
player_id
simulation_period
```

를 연결한다.

목표:

``` text
User Request
→ Function
→ Task
→ Worker
→ Player Transaction
→ Decision/Event Log
```

전체 추적 가능.

------------------------------------------------------------------------

# 30. Monitoring

최소 Metric:

### Function

-   invocation count
-   error count
-   latency
-   timeout

### Firestore

-   transaction abort
-   write latency
-   read latency

### Cloud Tasks

-   queue depth
-   retry count
-   task latency
-   failed task

### PLAY

-   batch lag
-   failed chunk
-   clock lag
-   reconciliation failure
-   emergency stop count

------------------------------------------------------------------------

# 31. PITR / Backup

Production 환경에서는 Firestore PITR을 활성화한다.

개발/테스트 환경에서는 비용 및 운영정책에 따라 다르게 설정할 수 있다.

Production 복구 절차:

``` text
Emergency Stop
→ Incident Timestamp 확인
→ 영향 범위 확인
→ PITR / 복구 절차
→ Reconciliation
→ Resume
```

무조건 자동 Rollback하지 않는다.

경제 데이터의 특성상 복구 전 영향 범위를 확인한다.

------------------------------------------------------------------------

# 32. Deployment

환경별 배포:

``` text
DEV
 ↓
STAGING
 ↓
PRODUCTION
```

Production 배포 전:

-   Unit Test
-   Integration Test
-   Idempotency Test
-   Crash Recovery Test
-   Contention Test
-   Batch Resume Test
-   Clock Test
-   Security Rules Test

통과를 요구한다.

------------------------------------------------------------------------

# 33. Rollback

Function Code와 Data Rollback을 구분한다.

### Code Rollback

이전 Cloud Functions Version으로 복귀.

### Data Recovery

필요한 경우 PITR 등 복구 절차 사용.

코드 Rollback이 자동으로 경제 데이터를 원상복구하는 것으로 간주하지
않는다.

------------------------------------------------------------------------

# 34. Initial Implementation Order

## Phase 1 --- Project / Infrastructure

-   [ ] Firebase Project
-   [ ] Functions 2nd Gen
-   [ ] Firestore
-   [ ] Cloud Tasks
-   [ ] Security Rules
-   [ ] Logging
-   [ ] Monitoring
-   [ ] PITR

## Phase 2 --- Data Model

-   [ ] PLAY_SEASON
-   [ ] PLAY_PLAYER
-   [ ] PLAY_PLAYER_ASSET
-   [ ] PLAY_BATCH
-   [ ] PLAY_BATCH_CHUNKS
-   [ ] PLAY_IDEMPOTENCY_LOGS

## Phase 3 --- Authority

-   [ ] Callable/API endpoint
-   [ ] Admin SDK
-   [ ] Client Write Block
-   [ ] Auth validation

## Phase 4 --- Batch

-   [ ] Batch Controller
-   [ ] Chunk Generator
-   [ ] Cloud Tasks Dispatcher
-   [ ] Chunk Worker
-   [ ] Player Transaction
-   [ ] Aggregator
-   [ ] Clock Advance

## Phase 5 --- Reliability

-   [ ] Reconciliation
-   [ ] Emergency Stop
-   [ ] Health Check
-   [ ] Alerting
-   [ ] Crash Test
-   [ ] Duplicate Test
-   [ ] Resume Test

------------------------------------------------------------------------

# 35. Test Plan

## Infrastructure

T-INF-01 Firebase connectivity

T-INF-02 Functions deployment

T-INF-03 Cloud Tasks execution

T-INF-04 Firestore Rules

## Player

T-PLY-01 Player initialization

T-PLY-02 Duplicate join

T-PLY-03 Duplicate Player economic transaction

## Batch

T-BAT-01 Batch creation

T-BAT-02 Duplicate Batch prevention

T-BAT-03 Chunk creation

T-BAT-04 Chunk retry

T-BAT-05 Mid-Chunk Crash

T-BAT-06 Partial Batch Recovery

## Aggregator

T-AGG-01 All chunks completed

T-AGG-02 Partial completion

T-AGG-03 Duplicate Aggregator

T-AGG-04 Stale Aggregator

## Clock

T-CLK-01 Normal Advance

T-CLK-02 Duplicate Advance

T-CLK-03 Scheduler Duplicate

T-CLK-04 Scheduler Miss

## Reliability

T-REL-01 Firestore contention

T-REL-02 Worker crash

T-REL-03 Task retry

T-REL-04 DLQ

T-REL-05 Reconciliation failure

T-REL-06 Emergency Stop

------------------------------------------------------------------------

# 36. Definition of Done

Backend Infrastructure MVP는 다음 조건을 만족해야 한다.

1.  Firebase/GCP 환경이 분리되어 있다.
2.  PLAY Client Direct Write가 차단되어 있다.
3.  Cloud Functions Server Authority가 작동한다.
4.  Player 초기화가 서버에서 수행된다.
5.  Player-level Idempotency가 작동한다.
6.  Batch가 생성된다.
7.  Chunk가 생성된다.
8.  Cloud Tasks가 Chunk를 실행한다.
9.  Worker Crash 후 Resume이 가능하다.
10. Aggregator가 Batch 완료를 확정한다.
11. Season Clock이 정확히 한 번만 전진한다.
12. Reconciliation이 작동한다.
13. Emergency Stop이 작동한다.
14. Monitoring/Logging이 작동한다.
15. 핵심 Reliability Test가 통과한다.
16. 경제 규칙이 임의로 변경되지 않았다.

------------------------------------------------------------------------

# 37. AG 구현 원칙

Antigravity는 본 문서를 구현할 때 다음 원칙을 준수한다.

### 변경 금지

-   경제 규칙 임의 변경 금지
-   데이터 모델 임의 변경 금지
-   Season 구조 임의 변경 금지
-   Idempotency 구조 임의 단순화 금지
-   Server Authority 우회 금지

### 문제 발생 시

구현 중 다음과 같은 문제가 발견되면:

``` text
기술적 문제
→ 원인
→ 영향
→ 대안
→ 권장안
```

형태로 보고한다.

경제 규칙과 기술 구현이 충돌하면 임의 결정하지 않는다.

------------------------------------------------------------------------

# 38. 구현 완료 후 다음 단계

Backend Infrastructure가 완료되면 다음 순서로 진행한다.

``` text
PLAY-06 Backend Infrastructure
        ↓
PLAY-07 Economic Engine Implementation
        ↓
PLAY-08 Property Market Implementation
        ↓
PLAY-09 Player / Transaction UI
        ↓
PLAY-10 Season Runtime
        ↓
PLAY-11 RAW / Decision Log
        ↓
PLAY-12 Season Analysis
```

각 단계는 구현 → 테스트 → AG 검토 → 다음 단계의 순서를 따른다.

------------------------------------------------------------------------

# 39. Final Principle

PLAY는 단순한 게임 서버가 아니다.

경제 세계의 시간이 흐르고, Player의 자산이 변하고, 거래가 발생하고,
결과가 축적되는 실험 시스템이다.

따라서 구현의 최우선 원칙은:

> **"서버가 항상 정상 동작한다"가 아니라 "서버의 일부가 실패해도 경제
> 세계가 잘못된 상태로 변하지 않는다."**

이다.

이 원칙을 Backend Infrastructure 전체에 적용한다.
