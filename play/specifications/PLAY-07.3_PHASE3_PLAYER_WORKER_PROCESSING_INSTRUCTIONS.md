# PLAY-07.3 PHASE 3 — PLAYER WORKER PROCESSING IMPLEMENTATION & VERIFICATION INSTRUCTIONS

## 1. 목적

PLAY-07.3 Phase 3의 목적은 **Cloud Task로 전달된 Chunk를 실제 Player 단위 Economic Processing으로 안전하게 실행하는 것**이다.

Phase 2까지는:

```text
Season
 ↓
Simulation Period
 ↓
Batch
 ↓
Chunk
 ↓
Cloud Task
```

까지 검증했다.

Phase 3부터는:

```text
Cloud Task
 ↓
Chunk Worker
 ↓
Player
 ↓
Economic Engine
 ↓
Player State
 ↓
Decision Log
```

을 실제로 연결한다.

이번 Phase의 핵심 질문은 하나다.

> **동일 Player에 대한 Economic Processing 요청이 중복 전달되거나 Worker가 Crash/Retry하더라도 경제적 Side Effect가 정확히 한 번만 발생하는가?**

---

# 2. 반드시 유지해야 하는 기존 구조

PLAY-07.2 및 PLAY-07.3 Phase 1~2에서 확정된 구조를 유지한다.

## 2.1 Server Authority

Client가 Player Economic Processing을 직접 실행하거나 Player State를 직접 변경할 수 없어야 한다.

## 2.2 Firestore Source of Truth

Player Economic State와 Idempotency 상태는 Firestore를 Source of Truth로 유지한다.

## 2.3 Worker 역할

Phase 3 Worker는 다음 책임을 가진다.

1. Task 인증
2. Chunk/Batch/Season 검증
3. Player 대상 확인
4. Player-level Idempotency 확인
5. Economic Engine 실행
6. Player State 변경
7. `last_processed_period` 갱신
8. Decision Log 기록
9. 처리 결과 기록
10. 실패 시 안전한 Retry 가능 상태 유지

---

# 3. 절대 변경하지 말아야 하는 범위

이번 Phase에서는 다음을 임의로 재설계하지 않는다.

- PLAY-07.2 Property Market
- Primary Purchase
- Secondary Order Book
- BUY/SELL Lock
- Property Matching
- 기존 Security Rules
- Season Clock
- Batch Aggregator
- Batch Completion 정책
- 기존 Economic Parameter
- Income 계산 공식
- Inflation 계산 공식
- Living Expense 계산 공식
- Economic Freedom Rate 정의

Economic Engine을 호출해야 하는 경우 기존 구현을 재사용한다.

이번 Phase의 목적은 Economic Engine을 새로 만드는 것이 아니라 **기존 Economic Engine을 Player Worker에서 안전하게 실행시키는 것**이다.

---

# 4. Player Processing 단위

Player Processing의 canonical identity는 다음을 사용한다.

```text
season_id
+
simulation_period
+
batch_type
+
player_id
```

Idempotency Key:

```text
{season_id}_{simulation_period}_{batch_type}_{player_id}
```

동일 Player + 동일 Period + 동일 Batch Type에 대해 여러 번 요청되어도 실제 경제 효과는 한 번만 발생해야 한다.

---

# 5. Player State Atomicity

가장 중요한 요구사항이다.

다음 작업은 가능한 한 **하나의 Firestore Transaction**으로 묶는다.

```text
Economic Calculation
        +
Player Economic State Update
        +
last_processed_period Update
        +
Idempotency Completion State
        +
Decision Log
```

단, 기존 Decision Log 설계상 Transaction 내부에서 처리할 수 없는 구조가 있다면 현재 구현을 먼저 조사하고, 분리할 경우 **재실행 시 중복 로그가 생성되지 않는 별도 Idempotency 전략**을 반드시 제시한다.

절대로 다음 상태가 발생해서는 안 된다.

```text
Cash 변경 완료
↓
last_processed_period 변경 실패
↓
Retry
↓
Cash가 다시 변경됨
```

또는:

```text
Cash 변경 완료
↓
Decision Log 실패
↓
Retry
↓
동일 경제 이벤트가 두 번 기록됨
```

---

# 6. Player Idempotency State

`PLAY_PLAYER_ASSET` 또는 현재 시스템에서 사용하는 Player Economic State에 다음과 동등한 상태가 존재해야 한다.

```text
last_processed_period
last_processed_batch_id
last_processed_at
```

기존 구조가 이미 존재한다면 그대로 활용한다.

동일 Player가 이미 해당 Period를 처리했다면:

```text
NO-OP / ALREADY_PROCESSED
```

가 되어야 한다.

다만 단순히:

```text
if last_processed_period >= current_period
```

만으로 처리하지 말고 반드시:

```text
season_id
simulation_period
batch_type
player_id
```

의 canonical identity를 검증한다.

---

# 7. Idempotency Log

현재 PLAY-07.3에서 정의된 Idempotency 구조를 유지한다.

권장 상태:

```text
PROCESSING
COMPLETED
FAILED
```

단, Firestore Transaction 자체로 duplicate processing을 원천적으로 방지할 수 있는 현재 구조가 있다면 불필요한 `PROCESSING` 상태를 새로 추가하지 않는다.

중요한 것은 상태 이름이 아니라:

> **동일 Player + 동일 Period에 경제적 Side Effect가 두 번 발생하지 않는 것**

이다.

---

# 8. Worker 실행 흐름

권장 흐름:

```text
Cloud Task
   ↓
Internal Auth
   ↓
Validate season_id / batch_id / chunk_id
   ↓
Validate scenario_id/version/rule_version
   ↓
Resolve Chunk Player
   ↓
For each Player
   ↓
Player Idempotency Check
   ↓
Economic Engine
   ↓
Atomic Firestore Transaction
   ↓
Update Player State
   ↓
Update last_processed_period
   ↓
Write/ensure Decision Log
   ↓
Mark Player Processing Complete
```

주의:

**Chunk 전체를 하나의 Firestore Transaction으로 묶지 않는다.**

Player 단위로 경제적 Atomicity를 확보한다.

---

# 9. Economic Engine 호출 규칙

기존 PLAY-07.1 Economic Engine을 그대로 사용한다.

입력은 최소한 다음을 포함해야 한다.

```text
season_id
scenario_id
scenario_version
rule_version
simulation_period
player_id
random_seed
current_player_state
```

동일 입력에서는 동일한 경제 결과가 재현 가능해야 한다.

Random 요소가 있다면 반드시 deterministic seed를 사용한다.

권장:

```text
seed =
hash(
  season_id +
  simulation_period +
  player_id +
  scenario_version +
  rule_version
)
```

기존 deterministic random 구조가 있다면 그것을 우선 사용한다.

---

# 10. 경제적 Side Effect의 정확한 정의

이번 Phase에서 처리해야 하는 기본 Economic Effect는 기존 Economic Engine의 정의를 따른다.

최소한 다음 항목이 정상적으로 반영되어야 한다.

```text
Income
Expense
Cash
Net Worth
Economic Freedom Rate
```

단, 실제 구현상 Property / Debt 등의 상태를 이번 Worker가 변경하도록 설계되어 있다면 현재 구조를 먼저 확인하고, 기존 설계와 충돌하지 않도록 한다.

임의로 새로운 경제 규칙을 추가하지 않는다.

---

# 11. 필수 테스트

## P3-01 — Normal Player Processing

1 Player + 1 Period.

검증:

- Income 반영
- Expense 반영
- Cash 변화
- Net Worth 변화
- `last_processed_period`
- Decision Log
- 처리 완료 상태

---

## P3-02 — Duplicate Player Request

동일:

```text
season_id
period
batch_type
player_id
```

로 Worker를 2회 호출한다.

기대:

```text
Economic Effect = 1회
Decision Log = 1회
last_processed_period = 1회 갱신
```

두 번째 호출은:

```text
ALREADY_PROCESSED / NO-OP
```

이어야 한다.

---

# 12. P3-03 — Concurrent Duplicate Processing

가장 중요한 테스트 중 하나다.

동일 Player에 대해 Worker 요청을 동시에 5~10개 발생시킨다.

기대:

```text
Successful Economic Commit = 정확히 1회
```

검증:

- Cash 변경 1회
- Income 1회
- Expense 1회
- Net Worth 변화 1회
- Decision Log 1개
- last_processed_period 정상
- duplicate transaction 없음

---

# 13. P3-04 — Crash Before Commit

Economic Calculation 이후 Firestore Commit 직전에 강제 Crash를 발생시킨다.

기대:

```text
Economic State 변경 = 0
```

Retry 후:

```text
Economic State 변경 = 정확히 1회
```

---

# 14. P3-05 — Crash After Commit

가장 중요하다.

Firestore Transaction이 실제로 Commit된 직후 Worker가 Crash된 것으로 시뮬레이션한다.

상황:

```text
Economic State Commit
        ↓
Worker Crash
        ↓
Cloud Task Retry
```

Retry 결과:

```text
Economic Effect 추가 발생 = 0
```

즉:

```text
최종 경제 효과 = 1회
```

여야 한다.

---

# 15. P3-06 — Duplicate Task Delivery

Phase 2에서 DEFERRED된 테스트다.

동일 Task Payload가 Worker에 두 번 전달되는 상황을 실제로 재현한다.

검증:

```text
Task Delivery = 2회
Economic Processing = 1회
```

이어야 한다.

이 테스트는 Phase 3의 핵심 Acceptance Test 중 하나다.

---

# 16. P3-07 — Mid-Chunk Crash

Chunk에 최소 3명의 Player를 넣는다.

예:

```text
Player A → 처리 성공
Player B → 처리 성공
Player C → Worker Crash
```

Retry:

```text
Player A → NO-OP
Player B → NO-OP
Player C → 정상 처리
```

기대:

```text
A = 1회
B = 1회
C = 1회
```

경제적 효과와 Decision Log 모두 정확히 1회씩이어야 한다.

---

# 17. P3-08 — Partial Player Failure

Chunk 안에서 특정 Player만 실패시키는 테스트다.

예:

```text
A → SUCCESS
B → FAILURE
C → SUCCESS
```

기대:

- A와 C는 이미 처리된 상태 유지
- B는 Retry 가능
- B Retry 후 정상 처리
- A/C 경제 상태가 다시 변경되지 않음
- Chunk 전체가 실패했다고 해서 성공 Player를 다시 처리하지 않음

---

# 18. P3-09 — Scenario / Rule Version Mismatch

다음 정보가 Worker Task와 현재 Batch/Season 정보에서 다를 경우:

```text
scenario_id
scenario_version
rule_version
```

Worker는 경제 처리를 수행하면 안 된다.

기대:

```text
Economic Effect = 0
```

그리고 명확한 Error Code를 기록한다.

예:

```text
SCENARIO_VERSION_MISMATCH
RULE_VERSION_MISMATCH
```

---

# 19. P3-10 — Wrong Season / Period / Batch

잘못된:

```text
season_id
batch_id
simulation_period
chunk_id
```

를 가진 Task가 들어오면 처리하면 안 된다.

경제 상태가 변경되어서는 안 된다.

---

# 20. P3-11 — Already Processed Player

이미:

```text
last_processed_period = current_period
```

인 Player에게 동일 Period를 다시 실행한다.

기대:

```text
NO-OP
```

그리고 기존 경제 상태가 변하지 않아야 한다.

---

# 21. P3-12 — Previous Period Replay

현재 Period가 10일 때 Period 9 Task가 다시 들어온다.

처리하면 안 된다.

경제 상태 변경:

```text
0
```

이어야 한다.

단, 기존 시스템에서 명시한 Replay 정책이 있다면 그 정책을 우선한다.

---

# 22. Reconciliation

각 Player 처리 후 최소한 다음 invariant를 확인할 수 있어야 한다.

```text
Cash >= 0
```

```text
Net Worth = Assets - Liabilities
```

```text
last_processed_period
=
실제로 처리된 simulation_period
```

그리고:

```text
Decision Log count
=
실제 Economic Processing count
```

가 깨지지 않아야 한다.

---

# 23. Decision Log

Decision Log에는 최소한 다음 정보를 연결한다.

```text
season_id
simulation_period
batch_id
chunk_id
player_id
request_id
idempotency_key
scenario_id
scenario_version
rule_version
function_name
timestamp
```

경제 결과와 Player State 변화의 원인을 나중에 추적할 수 있어야 한다.

특히 다음 질문에 답할 수 있어야 한다.

> "이 Player의 Cash가 왜 이 값으로 변경되었는가?"

최소:

```text
어떤 Season
어떤 Period
어떤 Batch
어떤 Chunk
어떤 Player
어떤 Economic Rule
어떤 Request
```

로 추적 가능해야 한다.

---

# 24. Observability

오류가 발생했을 때 다음 정보를 하나의 correlation chain으로 추적할 수 있어야 한다.

```text
request_id
 ↓
task_name
 ↓
batch_id
 ↓
chunk_id
 ↓
player_id
 ↓
idempotency_key
 ↓
economic processing
 ↓
Firestore transaction
 ↓
decision log
```

단순히 Cloud Function 로그만 남기는 것으로 끝내지 않는다.

---

# 25. Failure Injection Matrix

반드시 다음 Failure Injection을 수행한다.

| ID | Failure Point | Expected |
|---|---|---|
| F01 | Auth 실패 | 경제효과 0 |
| F02 | Batch 검증 실패 | 경제효과 0 |
| F03 | Chunk 검증 실패 | 경제효과 0 |
| F04 | Player 검증 실패 | 경제효과 0 |
| F05 | Economic Calculation 전 Crash | 경제효과 0 |
| F06 | Economic Calculation 후 Crash | 경제효과 0 |
| F07 | Commit 직전 Crash | 경제효과 0 |
| F08 | Commit 직후 Crash | Retry 후 총 1회 |
| F09 | Duplicate Task | 총 1회 |
| F10 | Concurrent Duplicate | 총 1회 |
| F11 | Mid-Chunk Crash | 성공 Player 재처리 0회 |
| F12 | Partial Player Failure | 실패 Player만 Retry |
| F13 | Scenario mismatch | 경제효과 0 |
| F14 | Rule mismatch | 경제효과 0 |

---

# 26. Golden Scenario

이번 Phase에서 최소 3명의 고정 Player를 사용하는 Golden Scenario를 만든다.

예:

```text
PLAYER_A
PLAYER_B
PLAYER_C
```

고정:

```text
season_id
scenario_id
scenario_version
rule_version
random_seed
initial_state
```

최소 3개 Period를 실행한다.

예:

```text
Period 0
Period 1
Period 2
```

각 Player의:

```text
Income
Expense
Cash
Net Worth
last_processed_period
Decision Log
```

을 expected result와 비교한다.

---

# 27. Deterministic Replay

동일한:

```text
season_id
scenario_id
scenario_version
rule_version
random_seed
player_id
period
initial_state
```

를 다시 실행했을 때 동일한 Economic Result가 나오는지 확인한다.

단, 실제 Production Player State에 직접 재실행하여 Side Effect를 만들지 않는다.

Replay는 별도의 테스트/replay context에서 수행한다.

---

# 28. PLAY-07.2 Regression

Phase 3 구현 후 반드시 기존 Property Market E2E를 다시 실행한다.

최소:

- Primary Purchase
- Secondary BUY
- Secondary SELL
- Lock / Unlock
- Atomic Matching
- Price-Time Priority
- Concurrent Matching
- Reconciliation
- Idempotency

기존 테스트가 깨지면 Phase 3는 완료로 판단하지 않는다.

---

# 29. Phase 1 / Phase 2 Regression

다음도 다시 검증한다.

### Phase 1

- Batch Creation
- Batch Idempotency
- expected_player_count
- chunk_count

### Phase 2

- Chunk Dispatch
- Chunk Idempotency
- Duplicate Task Creation
- Boundary
- Mid-Failure Recovery
- Batch RUNNING invariant

---

# 30. STOP 조건

다음 중 하나라도 발생하면 구현을 중단하고 먼저 해결한다.

1. 동일 Player Economic Effect가 2회 발생
2. 동일 Player Decision Log가 2개 생성
3. Concurrent Duplicate에서 2회 Commit
4. Commit 후 Retry가 다시 경제효과를 발생시킴
5. Crash 후 Player State가 부분적으로 변경됨
6. `last_processed_period`와 경제 상태가 불일치
7. 잘못된 Scenario/Rule Version으로 경제 계산 실행
8. 잘못된 Season/Batch/Chunk가 경제 계산 실행
9. Phase 2 Regression 실패
10. PLAY-07.2 Regression 실패
11. Client direct write가 필요해짐
12. 테스트 결과와 실제 Firebase/GCP 상태가 불일치

---

# 31. 구현 원칙

코드 수정 전에 현재 구현을 먼저 조사한다.

반드시 확인:

- `processBatchChunk`
- 현재 Economic Engine
- `PLAY_PLAYER_ASSET`
- `PLAY_DECISION_LOG`
- `PLAY_IDEMPOTENCY_LOGS`
- internalAuth
- Chunk 구조
- Batch 구조
- 기존 reconciliation
- 기존 failure injection
- Phase 1/2 test scripts

기존 Player idempotency 구조가 이미 있다면 중복 구현하지 않는다.

특히 기존 설계에서 `PROCESSING` 상태가 필요 없다고 판단된 경우 임의로 추가하지 않는다.

---

# 32. 최종 보고서

최종 결과는 Markdown으로 작성한다.

다음 순서를 반드시 따른다.

## 1. Executive Summary

## 2. Changed Files

## 3. Worker Architecture

## 4. Player Idempotency Design

## 5. Atomicity Design

## 6. Test Environment

## 7. P3-01 ~ P3-12 Test Results

## 8. Failure Injection Matrix

## 9. Duplicate Delivery Results

## 10. Crash / Retry Results

## 11. Golden Scenario Results

## 12. Deterministic Replay Results

## 13. PLAY-07.2 Regression

## 14. PLAY-07.3 Phase 1/2 Regression

## 15. Observability / Audit Trail

## 16. Remaining Risks

## 17. Known Limitations

## 18. Final Verdict

Final Verdict는 반드시 아래 중 하나만 사용한다.

```text
READY FOR PHASE 4
READY AFTER FIXES
BLOCKED
NOT READY
```

테스트하지 않은 항목은 PASS로 표시하지 않는다.

---

# 33. Phase 3의 최종 Acceptance Criteria

Phase 3의 성공은 단순히 Worker가 정상 실행되는 것이 아니다.

다음 조건을 모두 만족해야 한다.

```text
Normal Processing
+
Player Idempotency
+
Concurrent Duplicate Protection
+
Duplicate Task Delivery Protection
+
Crash Before Commit Safety
+
Crash After Commit Safety
+
Mid-Chunk Recovery
+
Partial Player Failure Recovery
+
Scenario/Rule Validation
+
Decision Auditability
+
Golden Scenario
+
Deterministic Replay
+
PLAY-07.2 Regression
+
Phase 1/2 Regression
```

그리고 최종적으로 다음을 실제 Firebase/GCP 환경에서 증명해야 한다.

> **같은 Player의 같은 Simulation Period가 몇 번 전달되거나 Worker가 몇 번 재시작되어도, 그 Player의 경제적 결과는 정확히 한 번만 반영된다.**

이것이 증명되지 않으면 Phase 3는 완료가 아니다.
