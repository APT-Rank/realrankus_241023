# PLAY-06 실제 환경 검증 계획서
## Backend Infrastructure Deployment & Verification Test

문서 목적:
PLAY-06 Backend Infrastructure가 코드 수준에서 구현 완료된 상태에서,
실제 Firebase / GCP 환경에 배포하고 핵심 기능 및 장애 대응 구조가 실제 환경에서도 정상적으로 동작하는지 검증한다.

본 문서는 PLAY-07 Economic Engine 구현 전에 수행해야 하는 PLAY-06 최종 검증 단계의 기준 문서다.

---

# 1. 검증 목적

PLAY-06 구현 리포트에서는 T01~T12가 코드 로직 기반으로 PASS되었으며 최종 판정은 `READY FOR PLAY-07`이었다.

그러나 현재 결과는 실제 GCP 환경에서의 배포 및 통합 테스트와는 구분되어야 한다.

따라서 본 검증의 목적은 다음과 같다.

1. 실제 Firebase Project 연결
2. Firestore 정상 동작 확인
3. Security Rules 정상 적용 확인
4. Composite Index 정상 적용 확인
5. Cloud Tasks Queue 정상 구성 확인
6. Service Account 권한 확인
7. Cloud Functions 2nd Gen 정상 배포 확인
8. 실제 Season → Player → Batch → Chunk → Aggregator → Clock 흐름 검증
9. 실제 Transaction / Idempotency 검증
10. 실제 Retry / Duplicate / Crash Recovery 검증
11. Reconciliation / Emergency Stop 검증
12. 기존 RealRankers 서비스 Regression 확인

검증 결과가 PASS되어야 PLAY-07 Economic Engine으로 진행한다.

---

# 2. 검증 범위

## IN SCOPE

- Firebase / GCP 환경
- Cloud Functions 2nd Gen
- Firestore
- Cloud Tasks
- Firebase Authentication
- Security Rules
- Composite Index
- Service Account
- PLAY_SEASON
- PLAY_PLAYER
- PLAY_PLAYER_ASSET
- PLAY_BATCH
- PLAY_BATCH_CHUNKS
- PLAY_IDEMPOTENCY_LOGS
- Season Clock
- Batch / Chunk Pipeline
- Aggregator
- Reconciliation
- Emergency Stop
- Logging
- Monitoring
- 기존 RealRankers Regression

## OUT OF SCOPE

이번 검증에서는 다음을 테스트하지 않는다.

- Primary Market
- Secondary Market
- BUY / SELL
- Property Ownership
- Rent
- Jeonse
- 실제 Economic Engine
- Tax
- Loan Calculation
- GLI
- Reward
- Season Analysis
- BigQuery Analytics Model

---

# 3. 검증 환경

가능하면 Production이 아닌 별도의 DEV 또는 STAGING Firebase Project에서 수행한다.

권장:

```text
PLAY-06 Verification
        ↓
STAGING Firebase Project
        ↓
Firestore
Cloud Functions 2nd Gen
Cloud Tasks
Firebase Auth
```

Production 데이터와 분리한다.

---

# 4. 사전 조건

다음 항목을 모두 확인한다.

## 4.1 Firebase Project

- [ ] 검증 대상 Firebase Project 확인
- [ ] Project ID 확인
- [ ] Blaze 요금제 확인
- [ ] Firebase CLI 로그인 확인
- [ ] 올바른 Project가 선택되었는지 확인

## 4.2 Firestore

- [ ] Firestore 활성화
- [ ] Database 정상 접근
- [ ] PITR 설정 확인
- [ ] PLAY Collection 접근 가능

## 4.3 Cloud Tasks

다음 Queue가 실제로 존재해야 한다.

```text
chunk-worker-queue
aggregator-queue
clock-queue
```

각 Queue에 대해:

- [ ] Queue 존재
- [ ] Region 확인
- [ ] Retry 설정 확인
- [ ] Rate Limit / Concurrency 확인

## 4.4 Service Account

- [ ] Cloud Functions 실행 Service Account 확인
- [ ] Cloud Tasks Enqueuer 권한 확인
- [ ] 필요한 Cloud Tasks 호출 권한 확인
- [ ] 최소 권한 원칙 확인

## 4.5 Security Rules

- [ ] PLAY Client Write DENY
- [ ] 기존 RealRankers 권한 유지
- [ ] Admin SDK Write 가능
- [ ] 인증되지 않은 Callable 요청 차단

## 4.6 Composite Index

다음 Index가 실제 배포되어 있어야 한다.

```text
PLAY_BATCH_CHUNKS
batch_id ASC
status ASC
```

---

# 5. 배포 검증

## V01. Cloud Functions 배포

모든 PLAY Function이 실제 환경에 배포되는지 확인한다.

예상 Function:

```text
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

결과:

- [ ] PASS
- [ ] FAIL

실제 배포된 Function 이름과 Region을 기록한다.

---

# 6. Security Verification

## V02. Client Write Block

PLAY Client에서 직접 다음 데이터를 Write하려고 시도한다.

```text
PLAY_SEASON
PLAY_PLAYER
PLAY_PLAYER_ASSET
PLAY_BATCH
PLAY_BATCH_CHUNKS
PLAY_IDEMPOTENCY_LOGS
```

예상 결과:

```text
WRITE → DENIED
```

결과:

- [ ] PASS
- [ ] FAIL

---

## V03. Existing RealRankers Access

기존 RealRankers에서 기존 데이터 Read / Write 기능을 수행한다.

확인:

- 로그인
- 기존 화면
- 기존 Property Data
- 기존 RealRankers 기능
- 기존 Firestore 접근

예상 결과:

기존 기능에 영향 없음.

결과:

- [ ] PASS
- [ ] FAIL

---

# 7. Authentication Verification

## V04. Authenticated Join

인증된 사용자가 Season에 Join한다.

예상:

```text
PLAY_PLAYER 생성
PLAY_PLAYER_ASSET 생성
```

결과:

- [ ] PASS
- [ ] FAIL

---

## V05. Unauthenticated Access

로그인하지 않은 사용자가 `joinSeason` 또는 상태 변경 Function을 호출한다.

예상:

```text
REQUEST → DENIED
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 8. Season Initialization

## V06. Create Season

새 Season을 생성한다.

확인:

```text
status = DRAFT
clock_status = INITIAL
transaction_status = NORMAL
current_simulation_period = 0
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 9. Player Initialization

## V07. Initial Asset

Player Join 후 다음 값을 확인한다.

```text
cash_total = 700,000,000
cash_available = 700,000,000
cash_locked = 0

debt_total = 0
property_count = 0
financial_asset_total = 0

net_worth = 700,000,000
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 10. Economic Batch

## V08. Create Batch

현재 simulation period에 대해 Economic Batch를 생성한다.

확인:

```text
Batch 생성
simulation_period = Season.current_simulation_period
```

결과:

- [ ] PASS
- [ ] FAIL

---

## V09. Duplicate Batch

동일한 Season / Period / Batch Type으로 Batch를 두 번 생성한다.

예상:

```text
Batch = 1개
```

중복 Batch가 생성되어서는 안 된다.

결과:

- [ ] PASS
- [ ] FAIL

---

# 11. Chunk Dispatch

## V10. Chunk 생성

Player가 충분히 존재하는 상태에서 Batch를 Dispatch한다.

확인:

```text
PLAY_BATCH_CHUNKS
```

가 생성되는지 확인한다.

각 Chunk:

- chunk_id
- batch_id
- player_count
- task_name
- status

확인.

결과:

- [ ] PASS
- [ ] FAIL

---

## V11. Cloud Task Execution

실제 Cloud Tasks에서 Chunk Worker가 호출되는지 확인한다.

확인:

```text
PENDING
→ RUNNING
→ COMPLETED
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 12. Player Idempotency

## V12. Duplicate Player Processing

동일 Player에 대해 동일 Period의 Worker 처리를 의도적으로 두 번 발생시킨다.

예상:

첫 번째:

```text
PROCESS
```

두 번째:

```text
NO-OP
```

확인:

- cash 중복 변경 없음
- last_processed_period 중복 처리 없음
- 상태가 한 번만 변경됨

결과:

- [ ] PASS
- [ ] FAIL

---

# 13. Mid-Chunk Recovery

## V13. Chunk Partial Failure

Chunk의 일부 Player 처리 후 Worker가 실패하도록 테스트한다.

예:

```text
Player 1~50 → 처리
Worker Crash
```

Retry 후:

```text
Player 1~50 → NO-OP
Player 51~100 → PROCESS
```

예상 결과:

중복 경제 연산 없음.

결과:

- [ ] PASS
- [ ] FAIL

---

# 14. Task Duplicate

## V14. Duplicate Task

동일 Chunk에 대해 중복 Task가 실행되는 상황을 재현한다.

예상:

- Chunk 중복 경제 처리 없음
- Player Idempotency 작동
- 최종 Player 상태 정상

결과:

- [ ] PASS
- [ ] FAIL

---

# 15. Task Retry

## V15. Worker Failure / Retry

Worker 실행 중 의도적으로 실패를 발생시킨다.

확인:

```text
Task Failure
→ Retry
→ Worker Re-execution
```

예상:

Retry 이후 정상적으로 처리되거나 명확한 실패 상태로 남는다.

결과:

- [ ] PASS
- [ ] FAIL

---

# 16. Aggregator

## V16. Incomplete Chunk

일부 Chunk가 아직 완료되지 않은 상태에서 Aggregator를 실행한다.

예상:

```text
Batch != COMPLETED
```

그리고 Aggregator Task가 재예약된다.

결과:

- [ ] PASS
- [ ] FAIL

---

## V17. All Chunks Completed

모든 Chunk가 COMPLETED가 된 후 Aggregator를 실행한다.

예상:

```text
Batch → COMPLETED
```

결과:

- [ ] PASS
- [ ] FAIL

---

## V18. Aggregator Timeout

의도적으로 Chunk를 완료시키지 않고 Aggregator를 반복 실행한다.

예상:

```text
MAX_AGGREGATOR_ATTEMPTS
```

초과 후 무한 Polling이 중단된다.

확인:

- Alert 또는 실패 상태
- 추가 무한 Task 생성 없음

결과:

- [ ] PASS
- [ ] FAIL

---

# 17. Season Clock

## V19. Clock Advance

완료된 Batch에 대해 Clock Advance를 실행한다.

예상:

```text
current_simulation_period
N
→
N + 1
```

결과:

- [ ] PASS
- [ ] FAIL

---

## V20. Duplicate Clock Advance

동일 Batch에 대해 Clock Advance를 두 번 호출한다.

예상:

```text
N
→ N+1
```

까지만 증가한다.

```text
N+2
```

가 되어서는 안 된다.

결과:

- [ ] PASS
- [ ] FAIL

---

## V21. Stale Batch

현재 Season Period보다 이전 Period의 Batch로 Clock Advance를 시도한다.

예상:

```text
Clock Advance DENIED
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 18. Reconciliation

## V22. Normal Reconciliation

정상 Player Asset에 대해 Reconciliation을 실행한다.

검증:

```text
cash_total
=
cash_available + cash_locked
```

예상:

```text
NORMAL
```

결과:

- [ ] PASS
- [ ] FAIL

---

## V23. Artificial Data Corruption

테스트 환경에서 의도적으로 Asset 정합성을 깨뜨린다.

예:

```text
cash_total != cash_available + cash_locked
```

Reconciliation 실행.

예상:

```text
TRANSACTION_PAUSED
clock_status = PAUSED
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 19. Emergency Stop

## V24. Pause Transactions

`pauseTransactions` 실행.

이후 경제 상태 변경 Function을 호출한다.

예상:

```text
REQUEST
→ REJECTED
```

결과:

- [ ] PASS
- [ ] FAIL

---

## V25. Resume Transactions

`resumeTransactions` 실행 후 정상 상태 변경 요청을 수행한다.

예상:

```text
REQUEST
→ ACCEPTED
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 20. Health Check

## V26. Health Check

`healthCheck` 실행.

최소 확인:

```text
Firestore
Cloud Tasks
Season
Batch
Clock
Transaction Status
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 21. Logging

## V27. Traceability

실제 Batch 실행 후 다음 정보가 Log 또는 관련 State에 추적 가능한지 확인한다.

```text
request_id
trace_id
season_id
batch_id
chunk_id
player_id
simulation_period
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 22. Monitoring

## V28. Monitoring

다음 상태가 Cloud Monitoring 또는 실제 관찰 가능한 운영 지표로 추적되는지 확인한다.

```text
Function Error
Function Latency
Firestore Transaction Abort
Cloud Tasks Retry
Cloud Tasks Failure
Batch Lag
Failed Chunk
Clock Lag
Reconciliation Failure
Emergency Stop
```

결과:

- [ ] PASS
- [ ] FAIL

---

# 23. Regression Test

## V29. Existing RealRankers

PLAY-06 배포 이후 기존 RealRankers의 핵심 기능을 다시 확인한다.

최소:

```text
Login
Main Page
Property Data
Existing RealRankers Data
Existing User Flow
```

예상:

기존 서비스 정상.

결과:

- [ ] PASS
- [ ] FAIL

---

# 24. Deployment Recovery

## V30. Function Failure Recovery

Function을 일시적으로 실패시키거나 테스트 환경에서 오류를 발생시킨 후:

- Cloud Tasks Retry
- Function 재실행
- Player Idempotency
- Batch State
- Chunk State

가 정상적으로 복구되는지 확인한다.

결과:

- [ ] PASS
- [ ] FAIL

---

# 25. 검증 결과표

최종적으로 다음 형식으로 작성한다.

| ID | Test | Result | Evidence | Issue |
|---|---|---|---|---|
| V01 | Functions Deployment | | | |
| V02 | Client Write Block | | | |
| V03 | Existing RealRankers | | | |
| V04 | Authenticated Join | | | |
| V05 | Unauthenticated Access | | | |
| V06 | Create Season | | | |
| V07 | Initial Asset | | | |
| V08 | Create Batch | | | |
| V09 | Duplicate Batch | | | |
| V10 | Chunk Creation | | | |
| V11 | Cloud Task Execution | | | |
| V12 | Player Idempotency | | | |
| V13 | Mid-Chunk Recovery | | | |
| V14 | Duplicate Task | | | |
| V15 | Task Retry | | | |
| V16 | Incomplete Aggregator | | | |
| V17 | Completed Aggregator | | | |
| V18 | Aggregator Timeout | | | |
| V19 | Clock Advance | | | |
| V20 | Duplicate Clock | | | |
| V21 | Stale Batch | | | |
| V22 | Normal Reconciliation | | | |
| V23 | Corruption Detection | | | |
| V24 | Emergency Stop | | | |
| V25 | Resume | | | |
| V26 | Health Check | | | |
| V27 | Traceability | | | |
| V28 | Monitoring | | | |
| V29 | Regression | | | |
| V30 | Recovery | | | |

---

# 26. Blocking Issue 기준

다음 중 하나라도 발생하면 PLAY-07로 진행하지 않는다.

## BLOCKING

- Client가 PLAY 경제 상태를 직접 Write할 수 있음
- 동일 Player에 동일 Period 경제 연산이 중복 적용됨
- Duplicate Batch 생성
- Clock이 두 번 증가
- Period Skip 발생
- Batch가 미완료인데 COMPLETED 됨
- Aggregator가 무한 Polling
- Reconciliation 실패를 탐지하지 못함
- Emergency Stop이 경제 상태 변경을 차단하지 못함
- 기존 RealRankers 기능이 깨짐
- Cloud Tasks Retry 후 데이터가 중복/오염됨
- Firestore Transaction 정합성이 깨짐

---

# 27. Non-Blocking Issue

다음은 원칙적으로 PLAY-07 진행을 막지 않는다.

- Logging 개선 필요
- Monitoring Dashboard 개선 필요
- Alert Threshold 조정
- UI 미완성
- 운영 문서 개선
- 성능 최적화가 필요한 경우

단, 데이터 정합성에 영향을 주는 경우 Blocking으로 승격한다.

---

# 28. 최종 판정

최종 판정은 다음 중 하나로 한다.

## PASS

V01~V30 핵심 테스트가 모두 PASS이고 Blocking Issue가 없음.

→ **PLAY-07 진행**

## PASS AFTER FIXES

일부 Non-Blocking Issue 또는 수정 가능한 운영 이슈 존재.

→ 수정 후 재검증

## NOT READY

하나 이상의 Blocking Issue 존재.

→ PLAY-06 수정 후 재검증

---

# 29. AG 최종 보고 형식

검증 완료 후 다음 순서로 보고한다.

1. Executive Summary
2. Deployment Environment
3. Firebase/GCP Resources
4. Function Deployment
5. Security Verification
6. Authentication Verification
7. Season / Player Initialization
8. Batch / Chunk Pipeline
9. Player Idempotency
10. Cloud Tasks Retry / Duplicate
11. Aggregator
12. Season Clock
13. Reconciliation
14. Emergency Stop
15. Health Check
16. Logging / Monitoring
17. Existing RealRankers Regression
18. Recovery Test
19. V01~V30 Result Table
20. Blocking Issues
21. Non-Blocking Issues
22. Evidence / Logs / Screenshots
23. PLAY-07 Readiness
24. Final Verdict

Final Verdict는 반드시 다음 중 하나로 명시한다.

```text
PASS
PASS AFTER FIXES
NOT READY
```

---

# 30. 중요 지시

이번 단계에서는 **새로운 기능을 개발하지 않는다.**

목적은 PLAY-06이 실제 환경에서 설계대로 작동하는지 검증하는 것이다.

특히 코드 수준에서 이미 PASS된 항목도 실제 환경에서 검증해야 한다.

다음 문장을 기준으로 판단한다.

> "코드가 논리적으로 맞는가?"가 아니라
> "실제 Firebase/GCP 환경에서 PLAY 경제 세계의 상태가 안전하게 유지되는가?"

검증 과정에서 문제가 발견되면 임의로 설계를 변경하지 않는다.

문제의 원인, 영향도, 재현 방법, 수정안을 보고한다.

Blocking Issue가 해결되고 실제 검증이 PASS될 때까지 PLAY-07 구현으로 넘어가지 않는다.
