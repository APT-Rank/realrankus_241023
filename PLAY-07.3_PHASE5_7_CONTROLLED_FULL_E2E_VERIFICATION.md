# PLAY-07.3 PHASE 5~7 CONTROLLED FULL E2E VERIFICATION

## 0. 목적

현재까지 다음 검증이 완료되었다.

- PLAY_PROPERTY_MASTER 정상 상태 복구
- `PROPERTY_MASTER = 209`
- `NORMAL = 200`
- `INCOMPLETE = 9`
- `PROP_FINAL_1 = NOT FOUND`
- Reconciliation 정상 통과
- Season Clock `1 → 2` 정상 진행
- 기존 데이터에 예상하지 않은 변경 없음

직전 검증 결과:

> READY FOR FULL E2E APPROVAL

따라서 이번 단계에서는 PLAY-07.3 Phase 5~7의 전체 연결 경로를 검증한다.

단, **처음부터 360기간 전체를 무조건 실행하지 않는다.**

다음 Gate 구조를 적용한다.

```text
GATE 0  Preflight / Environment Freeze
   ↓
GATE 1  1-Period Full E2E Smoke
   ↓ PASS
STOP / inspect
   ↓ approval implicit by this instruction
GATE 2  3-Period Continuity
   ↓ PASS
STOP / inspect
   ↓
GATE 3  Failure / Retry / Idempotency E2E
   ↓ PASS
STOP / inspect
   ↓
GATE 4  30-Period Stability
   ↓ PASS
STOP / inspect
   ↓
GATE 5  360-Period Full Simulation
   ↓
GATE 6  Final Reconciliation / Audit / Regression
   ↓
FINAL REPORT
   ↓
STOP
```

---

# 1. ABSOLUTE CONTROL RULE

`PLAY_AG_WORK_CONTROL_PROTOCOL.md`를 최우선으로 적용한다.

이번 검증에서는 다음을 절대 임의로 수행하지 않는다.

- 코드 수정
- Function 수정
- Function 재배포
- Queue 생성/삭제/변경
- endpoint 변경
- Firestore schema 변경
- Security Rules 변경
- 테스트 assertion 수정
- timeout 임의 증가
- retry 횟수 임의 증가
- 테스트 데이터 임의 삭제
- Property Master 변경
- workaround
- Architecture 변경

실패하면:

```text
Evidence
→ Diagnosis
→ Root Cause
→ Impact
→ Proposed Fix
→ STOP
```

순서로 보고한다.

**실패한 테스트를 통과시키기 위한 수정은 이번 작업 범위에 포함되지 않는다.**

---

# 2. TEST ENVIRONMENT

반드시 격리된 E2E 전용 Season을 사용한다.

기존 운영 Season 또는 기존 실제 Player State를 변경하지 않는다.

권장 구성:

- 기존 Property Master read-only
- E2E 전용 Season
- E2E 전용 Player set
- 실제 Firebase/GCP
- 실제 Cloud Functions
- 실제 Cloud Tasks
- 실제 Firestore
- 실제 Reconciliation
- 실제 Season Clock

Local simulation 또는 mock으로 Full E2E를 대체하지 않는다.

---

# 3. TEST DATA PRINCIPLE

Property Master는 기존 209개를 그대로 참조한다.

새로운 Property Master document를 생성하지 않는다.

특히 다음과 같은 임의의 property document를 만들지 않는다.

```text
PROP_FINAL_*
PROP_TEST_*
TEST_*
```

E2E 전용 Season과 Player 데이터만 생성한다.

테스트 종료 후 E2E 전용 데이터의 cleanup 여부를 기록하되, cleanup은 별도의 승인 없이 기존 검증 대상 데이터를 삭제하지 않는다.

---

# 4. GATE 0 — PREFLIGHT

테스트 시작 전 READ-ONLY 확인:

## Property Master

```text
Total = 209
NORMAL = 200
INCOMPLETE = 9
PROP_FINAL_1 = NOT FOUND
```

## Infrastructure

확인:

- Functions deployed version
- Region
- Cloud Tasks queues
- Queue target
- aggregateBatch
- runReconciliation
- advanceSeasonClock
- processBatchChunk
- createEconomicBatch
- dispatchBatchChunks

## Code / Deployment Freeze

현재 배포된 버전의 변경 여부를 확인한다.

이번 실행에서 코드/infra 변경이 발견되면 자동으로 수정하지 않는다.

### PASS

모든 preflight 조건 충족.

### FAIL

즉시 STOP.

---

# 5. GATE 1 — 1-PERIOD FULL E2E SMOKE

## 목적

전체 연결 경로가 한 simulation period에서 끝까지 연결되는지 검증한다.

경로:

```text
Season
→ Batch Creation
→ Chunk Dispatch
→ Player Worker
→ Chunk Completion
→ Batch Aggregation
→ Reconciliation
→ Season Clock
```

## Player

작은 E2E 전용 Player set을 사용한다.

단, 최소 2개 이상의 Chunk가 발생하도록 구성한다.

권장:

```text
150 players
chunk size = 100
expected chunks = 2
```

## Expected

```text
Batch = COMPLETED
Chunk 0 = COMPLETED
Chunk 1 = COMPLETED

각 Player:
economic processing = exactly once
Decision Log = exactly one

Reconciliation = PASS

current_period:
P → P+1
```

## Evidence

반드시 확보:

- season_id
- batch_id
- chunk_ids
- expected_player_count
- processed player count
- Decision Log count
- Batch status
- Chunk status
- Reconciliation result
- period before/after
- relevant Cloud Task IDs
- Function execution logs

### PASS

GATE 1 PASS.

### FAIL

즉시 STOP.

---

# 6. GATE 2 — 3-PERIOD CONTINUITY

GATE 1 PASS 후 실행한다.

## 목적

한 period의 성공이 우연한 것이 아니라 연속적인 period 처리에서도 정상적으로 이어지는지 검증한다.

```text
P1 → P2 → P3 → P4
```

즉 3개의 economic period를 연속 처리한다.

## 확인

각 period:

```text
Batch COMPLETED
Reconciliation PASS
Clock +1
```

각 Player:

```text
last_processed_period 정상
economic state 정상
Decision Log 증가량 정상
```

## 핵심

다음 문제가 없는지 확인한다.

- 이전 period state가 다음 period를 막음
- duplicate idempotency
- batch_id 충돌
- batch_type 충돌
- Chunk target player 재계산
- player 누락
- player 중복
- clock 중복 증가

### PASS

3개 period 모두 정상.

### FAIL

즉시 STOP.

---

# 7. GATE 3 — FAILURE / RETRY / IDEMPOTENCY E2E

이 단계에서는 실제 시스템에 장애를 의도적으로 주입한다.

단, **각 테스트를 독립적인 E2E Season 또는 명확하게 격리된 Batch로 수행한다.**

## F3-01 Duplicate Task

동일 task를 중복 전달.

Expected:

```text
economic effect = 1
Decision Log = 1
```

---

## F3-02 Concurrent Duplicate Worker

동일 Player + 동일 period에 대해 5~10개의 concurrent request.

Expected:

```text
economic effect = 1
Decision Log = 1
```

---

## F3-03 Crash Before Commit

Worker가 transaction commit 전에 crash.

Expected:

```text
partial economic effect = 0
retry = successful
final effect = 1
```

---

## F3-04 Crash After Commit

commit 직후 Worker가 crash.

retry 후:

```text
duplicate economic effect = 0
Decision Log duplicate = 0
```

---

## F3-05 Mid-Chunk Crash

Chunk 중간에서 crash.

예:

```text
P1 ... P50 = processed
P51 = crash
P52 ... = not processed
```

retry 후:

```text
P1 ... P50 = NO-OP
P51 ... = processed once
```

---

## F3-06 Aggregator Duplicate

Aggregator task 중복 전달.

Expected:

```text
Batch completion = exactly once
Clock advance = exactly once
```

---

## F3-07 Clock Duplicate

동일 Clock task 중복 전달.

Expected:

```text
P → P+1
NOT P → P+2
```

---

## F3-08 Reconciliation Failure

의도적으로 검증 가능한 reconciliation failure condition을 생성한다.

단, Property Master 자체를 변경하지 않는다.

Failure 발생 후:

```text
Season should not advance
```

그리고 시스템이 정의된 pause/degraded behavior를 보이는지 확인한다.

복구 테스트가 필요한 경우 별도 recovery run으로 수행한다.

---

# 8. GATE 3 STOP CONDITION

다음 중 하나라도 발견되면 해당 Failure Test를 즉시 중단한다.

- economic double effect
- missing player
- duplicate Decision Log
- period double advance
- Batch incorrectly completed
- Reconciliation PASS인데 integrity failure
- Reconciliation FAIL인데 Season Clock advance
- root cause UNKNOWN

수정하지 않는다.

---

# 9. GATE 4 — 30-PERIOD STABILITY

Failure/Retry 테스트가 PASS한 후 실행한다.

목적:

> 시스템이 짧은 테스트에서만 정상인 것이 아니라 연속적인 경제 simulation에서도 안정적으로 반복되는지 확인한다.

150-player E2E Season을 사용한다.

```text
Period 1 → Period 30
```

각 period마다:

```text
Batch
→ Chunks
→ Players
→ Aggregation
→ Reconciliation
→ Clock
```

정상 완료해야 한다.

## Period-level invariants

매 period:

```text
Batch status = COMPLETED
all chunks = COMPLETED
Reconciliation = PASS
Clock +1
```

## Player-level invariants

매 player:

```text
processed exactly once per batch
no negative cash unless explicitly allowed by rule
no duplicate economic effect
no missing Decision Log
```

## Final

```text
current_period = 31
```

### PASS

GATE 4 PASS.

### FAIL

STOP.

---

# 10. GATE 5 — 360-PERIOD FULL SIMULATION

GATE 4까지 모두 PASS한 경우에만 실행한다.

## 목적

PLAY의 기본 Season 구조인:

```text
30 simulated years
= 360 monthly periods
```

를 실제 backend pipeline으로 끝까지 처리한다.

## 조건

- 동일 E2E Season
- 동일 scenario
- 동일 rule version
- 동일 player set
- deterministic seed
- 실제 Firebase/GCP
- 실제 Cloud Tasks
- 실제 Functions

## 핵심

360기간 동안 자동으로 다음을 반복한다.

```text
Batch Creation
→ Dispatch
→ Player Processing
→ Aggregation
→ Reconciliation
→ Clock Advance
```

단, 시스템이 제공하는 정상 scheduler/worker 구조를 사용한다.

임의로 DB state를 직접 수정하여 period를 건너뛰지 않는다.

---

# 11. 360-PERIOD ACCEPTANCE CRITERIA

## Season

```text
initial_period = 1
final_period = 361
```

## Batch

Expected:

```text
360 completed economic batches
```

## Reconciliation

Expected:

```text
360 PASS
```

## Season Clock

Expected:

```text
360 successful increments
```

## Player processing

Expected:

```text
players × 360
```

economic processing events.

정확한 Decision Log 수는 실제 batch_type 및 설계된 logging rule을 기준으로 계산하여 보고한다.

## Idempotency

중복 task / retry가 발생해도:

```text
economic effect duplicate = 0
```

이어야 한다.

---

# 12. 360-PERIOD CHECKPOINT

360기간 전체가 끝난 뒤에만 확인하지 않는다.

최소 checkpoint:

```text
Period 30
Period 60
Period 90
Period 120
Period 180
Period 240
Period 300
Period 360
```

각 checkpoint에서:

- Batch status
- Reconciliation
- Clock
- player count
- Decision Log count
- error count
- retry count
- failed task count
- reconciliation anomalies

를 기록한다.

Checkpoint에서 이상이 발견되면 즉시 STOP한다.

---

# 13. GOLDEN SCENARIO / DETERMINISTIC REPLAY

360-period 결과에 대해 최소 1개의 Golden Scenario를 별도로 검증한다.

동일:

```text
season/scenario/version
rule_version
random_seed
initial player state
```

를 사용하여 replay한다.

Expected:

```text
same input
→ same economic result
→ same period-level state
```

차이가 발생하면:

```text
STOP
```

한다.

---

# 14. GATE 6 — FINAL RECONCILIATION & AUDIT

360-period 완료 후:

## Season

- current_period
- season status
- final reconciliation

## Player

모든 E2E Player에 대해:

- cash
- locked_cash
- debt
- property_count
- net_worth
- last_processed_period
- processed_batches

확인.

## Batch

- 360 batches
- failed batches
- retried batches
- duplicate batches

## Chunk

- total chunks
- completed
- failed
- retried

## Decision Log

- total
- duplicate
- missing
- orphan

## Reconciliation

최종 PASS.

---

# 15. PLAY-07.2 REGRESSION

Full E2E 종료 후 기존 verified area가 깨지지 않았는지 확인한다.

최소 regression:

- Primary Purchase
- Primary concurrency
- BUY lock
- SELL lock
- Cancellation
- Atomic Matching
- Price-Time Priority
- Concurrent Matching
- Worker Crash/Retry
- Reconciliation
- Security
- Idempotency

기존 PLAY-07.2의 테스트를 임의로 수정하지 않는다.

---

# 16. OBSERVABILITY REQUIREMENT

모든 주요 결과는 다음 correlation information을 확보한다.

```text
season_id
simulation_period
batch_id
chunk_id
player_id
task_name
request_id
idempotency_key
function_name
rule_version
scenario_version
timestamp
error_code
```

문제가 발생했을 경우:

> Season → Batch → Chunk → Player → Transaction → Decision Log

순서로 추적할 수 있어야 한다.

---

# 17. TEST BUDGET

## Gate별 원칙

각 Gate는 PASS 또는 STOP이다.

실패한 Gate를 통과시키기 위해 반복하지 않는다.

### 최대 반복

- GATE 1: 최대 2회
- GATE 2: 최대 1회
- GATE 3: 각 failure scenario 최대 1회
- GATE 4: 최대 1회
- GATE 5: 최대 1회
- GATE 6: 최대 1회

동일 실패의 반복은 원인 확인 없이 수행하지 않는다.

---

# 18. FAILURE CLASSIFICATION

실패 발견 시 반드시 다음 중 하나로 분류한다.

### A. TEST ENVIRONMENT

예:

- Cloud Task transient failure
- credential issue
- quota
- temporary infrastructure issue

### B. DATA

예:

- stale test data
- unexpected document
- wrong player state

### C. CODE

예:

- wrong idempotency
- missing transaction
- state transition bug

### D. ARCHITECTURE

예:

- queue/target mismatch
- race condition
- unsupported execution model

### E. TEST DESIGN

예:

- invalid assertion
- incorrect expected result
- test contamination

분류가 불확실하면:

> UNKNOWN

으로 보고하고 STOP한다.

---

# 19. ABSOLUTE STOP CONDITIONS

다음 중 하나라도 발생하면 자동으로 전체 E2E를 중단한다.

- code change 필요
- infrastructure change 필요
- architecture change 필요
- verified area modification 발견
- economic double effect
- player omission
- player duplication
- Decision Log duplication
- missing Decision Log
- clock double advance
- reconciliation failure
- reconciliation PASS with inconsistent state
- unexpected write/delete
- security bypass
- deterministic replay mismatch
- root cause UNKNOWN

---

# 20. FINAL REPORT FORMAT

최종 보고서는 다음 구조를 사용한다.

# PLAY-07.3 PHASE 5~7 CONTROLLED FULL E2E REPORT

## 1. Environment

- project
- region
- deployment version
- Functions
- Queues

## 2. Gate Results

| Gate | Test | Result |
|---|---|---|
| G0 | Preflight | |
| G1 | 1-Period E2E | |
| G2 | 3-Period | |
| G3 | Failure/Retry | |
| G4 | 30-Period | |
| G5 | 360-Period | |
| G6 | Final Audit | |

## 3. Player Processing

- player count
- expected processing
- actual processing
- omitted
- duplicated

## 4. Batch / Chunk

- batches
- chunks
- failures
- retries
- duplicates

## 5. Reconciliation

- PASS count
- FAIL count
- anomalies

## 6. Season Clock

- initial period
- final period
- expected increments
- actual increments
- duplicate increments

## 7. Failure Injection

각 테스트별:

```text
Test
Expected
Actual
Evidence
Result
```

## 8. Deterministic Replay

- input version
- seed
- expected result
- replay result
- differences

## 9. PLAY-07.2 Regression

각 regression 결과.

## 10. Unexpected Changes

- code
- infra
- database
- Property Master
- Player State

## 11. Issues

발견된 모든 Issue.

## 12. FINAL STATUS

반드시 다음 중 하나:

```text
VERIFIED
VERIFIED AFTER FIXES
PARTIALLY VERIFIED
BLOCKED
NOT VERIFIED
```

단, `VERIFIED AFTER FIXES`는 **이번 실행 중 임의 수정이 있었다는 의미로 사용하지 않는다.**
이번 작업 중 수정이 필요했다면 STOP하고 별도 승인/수정/재검증 절차로 전환한다.

---

# 21. FINAL STOP

모든 Gate가 PASS하더라도 자동으로 다음 Phase로 진행하지 않는다.

최종 보고서 작성 후:

> STOP — WAITING FOR USER APPROVAL

한다.

---

# 핵심 원칙

이번 Full E2E의 목표는 단순히:

> “360기간이 돌아갔다.”

가 아니다.

목표는:

> **한 Player의 한 번의 경제 변화부터 360기간의 Season 전체까지, 모든 경제 상태 변화가 추적 가능하고, 중복되지 않으며, 누락되지 않고, Reconciliation으로 검증되며, 실패 시 어느 지점에서 문제가 발생했는지 찾아낼 수 있음을 증명하는 것**

이다.

따라서:

```text
PASS를 많이 만드는 것
```

보다

```text
실패하면 정확히 멈추는 것
```

이 더 중요하다.
