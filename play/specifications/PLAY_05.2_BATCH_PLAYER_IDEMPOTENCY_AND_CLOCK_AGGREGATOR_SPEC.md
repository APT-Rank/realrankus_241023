# PLAY_05.2_BATCH_PLAYER_IDEMPOTENCY_AND_CLOCK_AGGREGATOR_SPEC

## 1. 문서 목적

본 문서는 `PLAY_05.1_BATCH_CHECKPOINT_AND_CLOCK_IDEMPOTENCY_SPEC`에 대한
AG 검토에서 발견된 두 가지 Blocking Issue를 해결하기 위한 보완 명세다.

### 해결 대상

1.  Chunk 내부 일부 Player 처리 후 Worker가 Crash되는 경우의 중복 경제
    연산
2.  다수의 Chunk Worker가 동시에 완료될 때 Batch/Season Clock 문서에
    집중되는 Firestore Transaction Contention

본 문서는 다음 책임 경계를 확정한다.

``` text
Player
  ↓
Chunk
  ↓
Batch
  ↓
Season Clock
```

각 계층은 자신의 책임만 수행한다.

------------------------------------------------------------------------

# 2. 핵심 원칙

PLAY 경제 시간의 신뢰성은 다음 5개 원칙을 따른다.

1.  **Player 경제 상태는 Player 단위로 멱등성을 보장한다.**
2.  **Chunk Worker는 자신의 Chunk 상태만 변경한다.**
3.  **Chunk Worker는 Season Clock을 직접 변경하지 않는다.**
4.  **Batch Aggregator만 Batch 완료 여부를 판단한다.**
5.  **Season Clock은 Batch가 완전히 완료된 경우에만 한 번 전진한다.**

즉:

``` text
Player Idempotency
        ↓
Chunk Completion
        ↓
Batch Aggregation
        ↓
Clock Advance
```

------------------------------------------------------------------------

# 3. 책임 분리

## 3.1 Player

책임:

-   해당 Simulation Period의 경제 계산 수행
-   Player Asset 변경
-   `last_processed_period` 갱신

Player는 자신이 해당 Period를 이미 처리했는지를 최종적으로 판단하는
단위다.

------------------------------------------------------------------------

## 3.2 Chunk Worker

책임:

-   할당받은 Player 목록 처리
-   Player별 Transaction 실행
-   처리 성공 여부 기록
-   자신의 Chunk 상태 변경

금지:

-   Season Clock 직접 변경
-   다른 Chunk 상태 변경
-   Batch 전체 완료 판단

------------------------------------------------------------------------

## 3.3 Batch Aggregator

책임:

-   전체 Chunk 상태 확인
-   모든 Chunk 완료 여부 판단
-   Batch를 `COMPLETED`로 확정
-   Season Clock Advance 요청 생성

Chunk Worker가 직접 Batch 완료를 판단하지 않는다.

------------------------------------------------------------------------

## 3.4 Season Clock

책임:

-   현재 Simulation Period 관리
-   완료된 Batch를 기준으로 다음 Period로 이동

Clock은 Worker의 개별 성공 여부가 아니라 **완료 확정된 Batch**만
신뢰한다.

------------------------------------------------------------------------

# 4. Player-Level Idempotency

## 4.1 Player 경제 처리 Key

Player 경제 상태 변경의 논리적 Idempotency Key:

``` text
SEASON_ID
+ SIMULATION_PERIOD
+ BATCH_TYPE
+ PLAYER_ID
```

예:

``` text
S01:Y05:ECONOMIC_TICK:P12345
```

동일 Key의 경제 처리는 한 번만 성공해야 한다.

------------------------------------------------------------------------

# 5. PLAY_PLAYER_ASSET 필드 추가

`PLAY_PLAYER_ASSET`에 다음 필드를 추가한다.

``` text
last_processed_period
last_processed_batch_id
last_processed_at
```

예:

``` text
{
  player_id: "P12345",
  cash: ...,
  debt: ...,
  net_worth: ...,
  last_processed_period: "Y05",
  last_processed_batch_id: "BATCH_S01_Y05_001",
  last_processed_at: ...
}
```

------------------------------------------------------------------------

# 6. Player Transaction 규칙

Worker가 Player를 처리할 때 반드시 Firestore Transaction을 사용한다.

Transaction 내부에서:

``` text
1. PLAY_PLAYER_ASSET Read
2. current period 확인
3. last_processed_period 확인
4. 이미 처리되었으면 NO-OP
5. 아직 처리되지 않았으면 경제 계산
6. Asset 변경
7. last_processed_period 갱신
8. last_processed_batch_id 기록
9. Idempotency 결과 기록
```

중요:

`경제 상태 변경`과 `last_processed_period` 변경은 반드시 동일한
Transaction 경계 안에 있어야 한다.

따라서 다음 상태가 발생해서는 안 된다.

``` text
경제 상태 변경 성공
last_processed_period 변경 실패
```

또는:

``` text
last_processed_period 변경 성공
경제 상태 변경 실패
```

------------------------------------------------------------------------

# 7. Mid-Chunk Crash 처리

예:

``` text
Chunk 001
 ├─ Player 001 COMPLETED
 ├─ Player 002 COMPLETED
 ├─ Player 003 COMPLETED
 ├─ Player 004 COMPLETED
 ├─ Player 005 COMPLETED
 ├─ Player 006 PROCESSING
 └─ Worker Crash
```

재시작 시 동일 Chunk를 다시 실행한다.

Player 001\~005:

``` text
last_processed_period == 현재 Period
→ NO-OP
```

Player 006:

``` text
처리되지 않음
→ 정상 처리
```

결과:

``` text
중복 경제 연산 없음
```

------------------------------------------------------------------------

# 8. Chunk Data Model

권장 구조:

``` text
PLAY_BATCH_CHUNKS/{chunk_id}
```

필드:

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

상태:

``` text
PENDING
RUNNING
COMPLETED
FAILED
```

------------------------------------------------------------------------

# 9. Cloud Tasks task_name

각 Chunk에는 실제 Cloud Tasks의 `task_name`을 기록한다.

목적:

-   Retry 추적
-   동일 Task 관찰
-   장애 분석
-   운영 로그 연결

`task_name` 자체를 경제 멱등성의 유일한 기준으로 사용하지 않는다.

경제 멱등성은 Player-level Key와 `last_processed_period`가 담당한다.

------------------------------------------------------------------------

# 10. Chunk Completion 규칙

Worker가 모든 Player 처리를 완료하면:

``` text
PLAY_BATCH_CHUNKS/{chunk_id}
status = COMPLETED
processed_count = player_count
completed_at = timestamp
```

Worker는 여기까지만 수행한다.

**Season Clock을 변경하지 않는다.**

------------------------------------------------------------------------

# 11. Batch Aggregator

Batch Aggregator는 별도의 실행 주체다.

입력:

``` text
batch_id
```

검사:

``` text
해당 Batch의 모든 Chunk
```

조건:

``` text
PENDING = 0
RUNNING = 0
FAILED = 0
COMPLETED = 전체 Chunk 수
```

이면 Batch를 완료한다.

------------------------------------------------------------------------

# 12. Batch Completion Atomicity

Batch Aggregator는 Firestore Transaction을 사용하여 다음을 수행한다.

``` text
PLAY_BATCH Read
PLAY_BATCH_CHUNKS 상태 확인
```

모든 Chunk가 완료된 경우:

``` text
PLAY_BATCH.status = COMPLETED
completed_at = timestamp
```

이미 `COMPLETED`이면:

``` text
NO-OP
```

처리한다.

따라서 Aggregator가 중복 실행되어도 Batch가 두 번 완료되는 것은 허용하지
않는다.

------------------------------------------------------------------------

# 13. Batch Aggregator 실행 방식

본 설계에서는 두 가지 구현 방식이 가능하다.

### Option A --- Firestore Trigger

Chunk가 `COMPLETED`로 변경되면 Aggregator를 호출한다.

장점:

-   즉각적인 반응
-   별도 polling 불필요

주의:

-   Trigger는 중복 실행될 수 있으므로 Aggregator 자체가 멱등적이어야
    한다.

### Option B --- 경량 상태 감시 Task

Chunk 완료 후 Aggregator Task를 호출한다.

장점:

-   실행 흐름을 명시적으로 제어하기 쉬움
-   Retry 정책 관리 용이

주의:

-   불필요한 중복 호출이 발생할 수 있다.

### 구현 선택 원칙

어느 방식을 선택하더라도:

``` text
Aggregator는 반드시 Idempotent
```

해야 한다.

구체적인 Firebase Trigger vs Task 선택은 구현 단계에서 기존 인프라와
운영 편의성을 기준으로 결정한다.

------------------------------------------------------------------------

# 14. Season Clock Advance

Season Clock은 다음 조건을 모두 만족할 때만 전진한다.

``` text
Batch.status == COMPLETED
AND
Batch.period == Season.current_simulation_period
```

그 후 Transaction에서:

``` text
current_simulation_period
→ next period
```

로 변경한다.

------------------------------------------------------------------------

# 15. Clock Advance Idempotency

예:

``` text
Batch BATCH_S01_Y05
```

가 완료되어 Aggregator가 두 번 호출되는 경우:

### 첫 번째

``` text
Batch Y05 → COMPLETED
Season Y05 → Y06
```

### 두 번째

이미 Season이 Y06으로 변경되어 있으므로:

``` text
NO-OP
```

처리한다.

다음 Period를 두 번 건너뛰지 않는다.

------------------------------------------------------------------------

# 16. Clock Advance Guard

Clock Advance Transaction에서는 반드시 현재 Period를 확인한다.

예:

``` text
expected_period = Y05
```

현재 Season:

``` text
current_period = Y05
```

일 때만:

``` text
Y05 → Y06
```

을 허용한다.

현재가 이미:

``` text
Y06
```

이면 해당 요청은 이미 처리된 것으로 간주한다.

------------------------------------------------------------------------

# 17. Race Condition 방지

다음 상황을 허용한다.

``` text
100 Chunk Worker
       ↓
100 Chunk COMPLETED
       ↓
다수의 Aggregator 호출
       ↓
Batch Completion Transaction
       ↓
단 하나의 성공
       ↓
Season Clock Advance
```

Firestore Transaction이 동시 업데이트를 감지하여 충돌한 Aggregator는
재시도되거나 NO-OP으로 종료한다.

중요한 것은:

> Worker가 `PLAY_SEASON`을 직접 업데이트하지 않는다는 것이다.

이로써 Chunk 완료와 Clock Advance의 책임이 분리된다.

------------------------------------------------------------------------

# 18. Batch 완료 전 Clock 전진 금지

다음 상태에서는 Clock을 전진시키지 않는다.

``` text
99 COMPLETED
1 FAILED
```

또는:

``` text
99 COMPLETED
1 RUNNING
```

또는:

``` text
99 COMPLETED
1 PENDING
```

오직:

``` text
100 COMPLETED
```

일 때만 다음 Period로 이동한다.

------------------------------------------------------------------------

# 19. Reconciliation

Batch 완료 직전 또는 완료 후 다음을 검증한다.

### Player

``` text
last_processed_period
```

가 해당 Batch Period와 일치하는지 확인.

### Asset

``` text
cash.total
cash.available
cash.locked
debt
net_worth
```

의 정합성 확인.

### Chunk

``` text
processed_count == player_count
status == COMPLETED
```

확인.

불일치 발생 시:

``` text
PLAY_SEASON.status = TRANSACTION_PAUSED
```

로 전환한다.

------------------------------------------------------------------------

# 20. Failure Scenarios

## F01. Worker Crash

``` text
Player 1~100 처리
Worker Crash
```

→ 동일 Chunk Retry

→ Player 1\~100은 `last_processed_period` 확인 후 NO-OP

→ 미처리 Player만 실행

------------------------------------------------------------------------

## F02. Chunk Duplicate Execution

동일 Task가 두 번 실행되어도:

``` text
Player-level idempotency
```

로 중복 경제 연산 방지.

------------------------------------------------------------------------

## F03. Aggregator Duplicate Execution

Aggregator가 두 번 호출되어도:

``` text
Batch.status
current_simulation_period
expected_period
```

검증으로 두 번째 Clock Advance 차단.

------------------------------------------------------------------------

## F04. 100 Chunk 동시 완료

각 Worker는 자기 Chunk만 업데이트.

Aggregator에서만 Batch 상태를 확정.

Season Clock은 한 번만 전진.

------------------------------------------------------------------------

## F05. Batch 일부 실패

``` text
99 COMPLETED
1 FAILED
```

→ Batch 미완료

→ Clock 정지

→ FAILED Chunk Retry

------------------------------------------------------------------------

## F06. Scheduler Duplicate

동일 `season_id + simulation_period + batch_type` 실행 요청은 중복
처리하지 않는다.

------------------------------------------------------------------------

# 21. Test Cases

기존 T01\~T10을 유지하고 다음을 추가한다.

### T11 --- Concurrent Chunk Completion

수십 개 Chunk가 1초 내 동시에 COMPLETED.

검증:

-   Batch가 정확히 한 번 COMPLETED
-   Season Clock이 정확히 한 번 Advance
-   Period Skip 없음

### T12 --- Mid-Chunk Crash

10명의 Player 중 5명 처리 직후 Worker 강제 종료.

재실행 후:

-   기존 5명 중복 처리 없음
-   나머지 5명 정상 처리
-   Chunk 최종 COMPLETED

### T13 --- Duplicate Player Task

동일 Player 처리 Task를 동시에 2회 실행.

검증:

-   경제 상태 1회만 변경
-   `last_processed_period` 1회 확정

### T14 --- Duplicate Aggregator

동일 Batch Aggregator를 동시에 여러 번 호출.

검증:

-   Batch 1회 완료
-   Clock 1회 Advance

### T15 --- Stale Aggregator

Y05 Batch Aggregator가 실행되었지만 Season이 이미 Y06.

검증:

-   Clock 추가 Advance 없음
-   NO-OP

### T16 --- Partial Batch Recovery

100 Chunk 중 95개 완료, 5개 실패.

검증:

-   Clock 정지
-   실패 Chunk만 재처리
-   모든 Chunk 완료 후 Clock 1회 Advance

------------------------------------------------------------------------

# 22. 구현 제한

본 문서는 기존 경제 규칙을 변경하지 않는다.

변경하지 않는 항목:

-   초기자산 7억원
-   Season 3개월 / 30년
-   Income
-   Expense
-   LTV
-   DSR
-   Loan
-   Property Market
-   Primary Market
-   Secondary Market
-   Transaction Fee
-   GLI
-   Reward
-   Season Evaluation

또한 Worker가 경제 규칙을 임의 변경하지 않는다.

------------------------------------------------------------------------

# 23. Definition of Done

다음 조건을 모두 만족해야 한다.

1.  Player-level Idempotency 구현
2.  `last_processed_period` 구현
3.  Chunk-level 상태 관리 구현
4.  Chunk Worker의 Season Clock 직접 변경 금지
5.  Batch Aggregator 구현
6.  Batch 완료 여부 단일 확정
7.  Season Clock Advance 중복 방지
8.  Mid-Chunk Crash 복구
9.  Duplicate Player Task 방지
10. Duplicate Aggregator 방지
11. T01\~T16 테스트 통과
12. 경제 규칙 변경 없음
13. AG 최종 검토 `READY`

------------------------------------------------------------------------

# 24. 최종 구조

``` text
                Season Clock
                     ▲
                     │
             Clock Advance
                     ▲
                     │
             Batch Aggregator
                     ▲
                     │
              Batch COMPLETED
                     ▲
                     │
        ┌────────────┼────────────┐
        │            │            │
     Chunk 001    Chunk 002    Chunk N
        ▲            ▲            ▲
        │            │            │
     Player        Player       Player
     Tx             Tx           Tx
        │            │            │
   last_processed_period
```

핵심 원칙:

> **Player가 경제 멱등성을 보장하고, Chunk가 작업 완료를 증명하며, Batch
> Aggregator가 전체 완료를 확정하고, Season Clock만 경제 시간을
> 전진시킨다.**

이 책임 경계를 깨뜨리는 구현은 허용하지 않는다.
