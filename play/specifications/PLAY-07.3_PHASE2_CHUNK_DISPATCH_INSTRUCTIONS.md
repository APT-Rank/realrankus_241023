# PLAY-07.3 PHASE 2 — CHUNK DISPATCH IMPLEMENTATION & VERIFICATION INSTRUCTIONS

## 1. 목적

PLAY-07.3 Phase 2의 목적은 **Economic Batch를 구성하는 Chunk들을 정확히 생성하고 Dispatch하는 것**이다.

이번 Phase에서는 **경제 계산을 수행하지 않는다.**
또한 아래 항목을 변경하거나 구현하지 않는다.

- Player 경제 상태 변경
- Income / Expense 계산
- Net Worth 계산
- Season Clock 진행
- Batch 완료 처리
- Aggregator
- Reconciliation의 신규 로직
- PLAY-07.2 Property Market 로직
- 기존 PLAY-07.2의 transaction / lock / matching 로직

핵심 목표는 다음과 같다.

> Batch 하나가 생성되면, 해당 Batch의 Player 집합을 정확히 Chunk로 분할하고, 각 Chunk가 중복 없이 정확히 한 번 Dispatch되도록 한다. Dispatch 재시도나 중복 호출이 발생해도 Chunk 자체가 중복 생성되거나 경제적 Side Effect가 발생하지 않아야 한다.

---

## 2. 반드시 유지해야 하는 기존 구조

PLAY-07.2 및 PLAY-07.3 Phase 1에서 확정된 구조를 그대로 유지한다.

### 2.1 Server Authority

Client가 Chunk를 직접 생성하거나 Dispatch할 수 없어야 한다.

모든 Dispatch 관련 쓰기는 Server Authority를 통해서만 수행한다.

### 2.2 Firestore Source of Truth

Firestore를 상태의 기준으로 사용한다.

### 2.3 Batch 구조

```text
Season
 └─ Simulation Period
     └─ Economic Batch
         ├─ Chunk 0
         ├─ Chunk 1
         ├─ ...
         └─ Chunk N
```

### 2.4 Worker 역할 제한

이번 Phase의 Dispatch 단계에서는 Worker가 경제 계산을 수행해서는 안 된다.

Dispatch는 다음 역할까지만 담당한다.

1. Batch 확인
2. Player 목록/범위 결정
3. Chunk 생성
4. Chunk 상태 기록
5. Cloud Task 생성/등록
6. Dispatch 결과 기록

---

# 3. Chunk 규칙

## 3.1 Chunk Size

Phase 1에서 결정된 초기 Chunk Size는 **100명**이다.

```text
CHUNK_SIZE = 100
```

Chunk 수:

```text
chunk_count = ceil(player_count / 100)
```

예:

| Player 수 | Chunk 수 |
|---:|---:|
| 0 | 0 |
| 1 | 1 |
| 99 | 1 |
| 100 | 1 |
| 101 | 2 |
| 199 | 2 |
| 200 | 2 |
| 201 | 3 |
| 1000 | 10 |

위 경계값은 반드시 자동 테스트로 검증한다.

---

# 4. Chunk 식별자

Chunk ID는 결정론적이어야 한다.

권장 형식:

```text
{batch_id}_chunk_{chunk_index}
```

예:

```text
batch_20260925_0001_chunk_0
batch_20260925_0001_chunk_1
```

동일 Batch + 동일 Chunk Index에 대해 서로 다른 Chunk ID가 생성되어서는 안 된다.

---

# 5. Chunk 상태

최소한 다음 상태를 사용한다.

```text
PENDING
DISPATCHING
DISPATCHED
FAILED
```

이번 Phase에서 Worker가 실제 경제 계산을 수행하지 않는다면 `COMPLETED`는 사용하지 않는다.

상태 전이는 명확하게 관리한다.

```text
PENDING
   ↓
DISPATCHING
   ↓
DISPATCHED
```

실패 시:

```text
DISPATCHING
   ↓
FAILED
   ↓
DISPATCHING
   ↓
DISPATCHED
```

이미 `DISPATCHED`인 Chunk에 동일 Dispatch 요청이 들어오면 새로운 Chunk 또는 새로운 경제 작업을 생성하지 않는다.

---

# 6. Chunk Idempotency

가장 중요한 요구사항이다.

Chunk Dispatch의 Idempotency Key:

```text
season_id
+
simulation_period
+
batch_type
+
chunk_index
```

또는 이에 준하는 **동일 의미의 결정론적 Key**를 사용한다.

절대로 random UUID만으로 Chunk Idempotency를 구현하지 않는다.

같은 Batch의 같은 Chunk Index에 대해 Dispatch 요청이 여러 번 들어와도:

- Chunk는 하나만 존재해야 한다.
- Task는 중복 생성되지 않아야 한다.
- 경제 상태가 변경되어서는 안 된다.
- 요청 결과는 기존 Chunk/Task를 재사용하거나 이미 처리된 상태를 반환해야 한다.

---

# 7. Player Partitioning

Batch에 포함되는 Player 집합을 정확히 Chunk로 분할해야 한다.

예:

```text
150 players

Chunk 0 → players 0 ~ 99
Chunk 1 → players 100 ~ 149
```

검증해야 할 불변식:

```text
전체 Chunk의 Player 수 합계
=
Batch의 expected_player_count
```

또한:

```text
같은 Player가 두 개 이상의 Chunk에 들어가면 안 된다.
```

그리고:

```text
누락된 Player가 없어야 한다.
```

즉:

```text
Union(all chunk players)
=
Batch player set
```

이며

```text
Intersection(chunk_i, chunk_j) = ∅
```

이어야 한다.

가능하다면 실제 Player ID 목록 또는 deterministic range/cursor 정보를 저장하여 나중에 재현할 수 있도록 한다.

---

# 8. Firestore Query 안정성

Player 목록을 Firestore에서 가져올 경우 정렬 기준을 명확하게 지정한다.

권장:

```text
orderBy(player_id)
```

또는 동일한 의미의 안정적인 deterministic ordering.

주의:

- Firestore의 반환 순서에 의존하지 않는다.
- pagination/cursor를 사용할 경우 cursor가 안정적이어야 한다.
- 동일 조건에서 동일 Player 집합이 동일 Chunk에 배정되어야 한다.

---

# 9. Cloud Tasks Dispatch

각 Chunk에 대해 Worker Task를 생성한다.

권장 구조:

```text
Batch
 ↓
Dispatch
 ↓
Chunk 0 → Cloud Task 0
Chunk 1 → Cloud Task 1
...
Chunk N → Cloud Task N
```

Task 생성 시 최소한 다음 정보를 전달한다.

```text
season_id
simulation_period
batch_id
batch_type
chunk_id
chunk_index
scenario_id
scenario_version
rule_version
```

필요한 request_id / idempotency_key도 포함한다.

---

# 10. Task 중복 방지

동일 Chunk에 대해 동일 Task가 여러 번 생성되지 않도록 한다.

Cloud Tasks 자체의 Task Name을 결정론적으로 구성할 수 있다면 이를 활용한다.

예:

```text
{batch_id}-{chunk_index}
```

또는 동일 의미의 deterministic task name.

중요:

> Dispatch API를 두 번 호출했다고 해서 Task가 두 개 생성되어서는 안 된다.

단, Cloud Tasks 내부 retry와 실제 duplicate delivery는 다른 문제다.

이번 Phase에서는 다음을 구분해서 검증한다.

### A. Duplicate Dispatch Request

Dispatch 함수 자체가 같은 Chunk에 대해 두 번 호출되는 경우.

### B. Duplicate Task Delivery

Cloud Task가 동일 Task를 Worker에게 두 번 전달하는 경우.

B는 Worker 구현 Phase에서 실제 경제 처리와 함께 다시 검증하지만, 이번 Phase에서도 Task identity와 dispatch 구조가 중복 경제 처리를 유발하지 않는 구조인지 확인한다.

---

# 11. Dispatch Failure Recovery

다음 상황을 반드시 테스트한다.

## F01 — Dispatch 시작 전 실패

Chunk 생성 전에 함수가 실패하는 경우.

기대 결과:

- Chunk가 잘못된 상태로 남지 않는다.
- 재시도 가능해야 한다.

## F02 — Chunk 생성 후 Task 생성 전 실패

Chunk가 존재하지만 Task가 아직 생성되지 않은 상황.

기대 결과:

- 재시도 시 동일 Chunk를 사용한다.
- 중복 Chunk가 생성되지 않는다.
- Task는 최종적으로 정확히 하나가 생성되어야 한다.

## F03 — Task 생성 후 응답 전 실패

Task는 실제로 생성되었으나 Dispatch 함수가 timeout/crash하여 클라이언트가 성공 여부를 모르는 상황.

기대 결과:

- 재호출 시 기존 Task를 인식한다.
- 새로운 Task를 중복 생성하지 않는다.
- Chunk 상태가 일관성을 유지한다.

## F04 — 일부 Chunk Dispatch 성공 후 전체 함수 실패

예:

```text
Chunk 0 → DISPATCHED
Chunk 1 → DISPATCHED
Chunk 2 → FAILED / 미처리
Chunk 3 → 미처리
```

재시도 시:

- Chunk 0,1은 중복 생성하지 않는다.
- Chunk 2,3만 보완한다.
- 최종적으로 모든 Chunk가 정확히 한 번 Dispatch된 상태가 되어야 한다.

---

# 12. 절대 금지 사항

이번 Phase에서 다음을 구현하거나 변경하지 않는다.

1. Player 경제 상태 변경
2. Cash 변경
3. Income 지급
4. Expense 차감
5. Net Worth 변경
6. Debt 변경
7. Property 거래
8. Season Clock advance
9. Batch Aggregator
10. Reconciliation 정책 변경
11. PLAY-07.2 transaction 로직 변경
12. 기존 Security Rule 완화
13. Client direct write 허용
14. 임의의 fallback 데이터 생성
15. 실패를 성공으로 masking하는 코드

특히 테스트를 위해 경제 상태를 변경하는 코드를 넣지 않는다.

---

# 13. 필수 테스트

## F02-A — Duplicate Dispatch

조건:

- 동일 Batch
- 동일 Chunk
- Dispatch 요청 2회 이상

검증:

- Chunk 1개
- Task 1개
- 중복 경제 처리 없음
- 동일 Chunk/Task가 반환 또는 EXISTING 상태 반환

---

## F02-B — Full Chunk Dispatch

150 Player Batch를 사용한다.

기대:

```text
Chunk 0 = 100
Chunk 1 = 50
```

검증:

- expected_player_count = 150
- chunk_count = 2
- Chunk 0 존재
- Chunk 1 존재
- Player 중복 없음
- Player 누락 없음
- Task 2개
- Dispatch 상태 일관성

---

## F02-C — Boundary Test

다음 Player 수를 각각 독립적으로 테스트한다.

```text
0
1
99
100
101
199
200
201
1000
```

각 경우:

```text
expected_chunk_count = ceil(player_count / 100)
```

를 만족해야 한다.

특히:

```text
0 → 0
1 → 1
100 → 1
101 → 2
200 → 2
201 → 3
```

을 반드시 확인한다.

---

## F02-D — Duplicate Task Delivery 구조 검증

동일 Chunk의 Task가 중복 전달되어도 Worker 단계에서 Idempotency를 구현할 수 있도록:

- chunk_id
- batch_id
- simulation_period
- player scope
- idempotency key

가 Task payload에 정확히 존재하는지 검증한다.

이번 테스트에서는 경제 계산을 실행하지 않는다.

---

## F02-E — Dispatch Mid-Failure

Chunk 여러 개를 가진 Batch를 대상으로 중간에 인위적 실패를 발생시킨다.

예:

```text
Chunk 0 → 성공
Chunk 1 → 성공
Chunk 2 → 실패
Chunk 3 → 미처리
```

그 후 동일 Dispatch를 재실행한다.

최종 결과:

```text
Chunk 0 → DISPATCHED
Chunk 1 → DISPATCHED
Chunk 2 → DISPATCHED
Chunk 3 → DISPATCHED
```

그리고:

```text
중복 Chunk = 0
중복 Task = 0
```

이어야 한다.

---

## F02-F — Phase 1 Regression

PLAY-07.3 Phase 1에서 이미 검증한 다음 항목이 깨지지 않았는지 확인한다.

1. Batch Creation
2. Batch Idempotency
3. expected_player_count
4. chunk_count
5. scenario_id
6. scenario_version
7. rule_version

Phase 2 구현으로 Phase 1 테스트가 깨지면 즉시 중단하고 원인을 수정한다.

---

# 14. 테스트 데이터 원칙

테스트는 가능한 한 실제 Firebase/GCP 환경에서 수행한다.

가능하면:

```text
Firebase Native Firestore
Cloud Functions 2nd Gen
Cloud Tasks
asia-northeast3
```

기준으로 검증한다.

Mock만으로 PASS 판정을 내리지 않는다.

테스트용 Player는 명확히 식별 가능한 테스트 Season을 사용한다.

실제 운영 Season 데이터를 변경하지 않는다.

---

# 15. 증적(Evidence) 요구사항

각 테스트에 대해 다음을 기록한다.

```text
Test ID
Environment
Season ID
Batch ID
Chunk ID
Player Count
Chunk Count
Task Name
Before State
Action
After State
Expected Result
Actual Result
PASS/FAIL
```

특히 다음을 반드시 보여준다.

### Chunk

```text
chunk_id
chunk_index
player_count
status
```

### Task

```text
task_name
chunk_id
dispatch status
```

### Batch

```text
expected_player_count
chunk_count
```

---

# 16. 추가 불변식 검증

최종적으로 다음을 모두 검증한다.

### INV-01

```text
Batch.expected_player_count
=
sum(Chunk.player_count)
```

### INV-02

```text
Chunk count
=
ceil(expected_player_count / 100)
```

### INV-03

```text
Player overlap = 0
```

### INV-04

```text
Player omission = 0
```

### INV-05

```text
Same Batch + Chunk Index
→ exactly one Chunk
```

### INV-06

```text
Same Chunk
→ exactly one deterministic Task identity
```

### INV-07

```text
Dispatch does not modify player economic state
```

### INV-08

```text
Dispatch does not advance Season Clock
```

---

# 17. 관측성(Observability)

가능한 경우 모든 Dispatch 작업에 다음 정보를 연결한다.

```text
season_id
simulation_period
batch_id
chunk_id
chunk_index
task_name
request_id
idempotency_key
function_name
rule_version
scenario_version
timestamp
```

오류 발생 시 단순히:

```text
FAILED
```

라고 기록하지 말고 원인과 단계가 추적 가능해야 한다.

---

# 18. STOP 조건

다음 중 하나라도 발생하면 추가 구현을 중단하고 원인을 먼저 해결한다.

1. 동일 Chunk가 2개 생성됨
2. 동일 Chunk에 Task가 2개 생성됨
3. Player가 두 Chunk에 중복 배정됨
4. Player가 누락됨
5. expected_player_count와 Chunk 합계가 다름
6. Dispatch가 Player 경제 상태를 변경함
7. Dispatch가 Season Clock을 변경함
8. Duplicate Dispatch가 새로운 Chunk를 생성함
9. Mid-failure 후 재시도에서 중복 Task 발생
10. Phase 1 Regression 실패
11. Security Rule 완화 필요성이 발생함
12. 실제 Firebase/GCP 상태와 테스트 결과가 불일치함

---

# 19. 구현 방식 원칙

코드를 수정하기 전에 현재 구현을 먼저 조사한다.

반드시 확인할 것:

- 현재 createEconomicBatch 구현
- PlayBatch / PlayBatchChunk 타입
- Firestore collection 구조
- 기존 Cloud Tasks helper
- internalAuth
- Security Rules
- PLAY-07.2 transaction 구조
- Phase 1 test script
- 현재 deployment 상태

기존 코드가 이미 같은 기능을 일부 구현하고 있다면 중복 구현하지 않는다.

기존 구조를 깨야 하는 경우:

1. 왜 깨야 하는지 설명
2. 영향 범위 제시
3. 대체 설계 제시
4. 테스트 계획 제시
5. 그 후에만 수정

---

# 20. 최종 보고서 형식

최종 결과는 Markdown 보고서로 작성한다.

반드시 다음 순서로 작성한다.

## 1. Executive Summary

## 2. Changed Files

각 파일별 변경 목적.

## 3. Architecture

Dispatch 흐름을 설명한다.

```text
Batch
 ↓
Chunk Creation
 ↓
Idempotency
 ↓
Cloud Task Dispatch
 ↓
DISPATCHED
```

## 4. Test Environment

Firebase/GCP 프로젝트, region, runtime 등.

## 5. Test Results

F02-A ~ F02-F 결과.

## 6. Invariant Results

INV-01 ~ INV-08.

## 7. Failure Injection Results

F01 ~ F04.

## 8. Phase 1 Regression

Pass/Fail.

## 9. Evidence

실제 Firestore/Cloud Tasks 결과를 근거로 제시한다.

## 10. Remaining Risks

현재 확인된 미해결 위험.

## 11. Known Limitations

이번 Phase에서 의도적으로 구현하지 않은 것.

## 12. Final Verdict

아래 네 가지 중 하나만 선택한다.

```text
READY FOR PHASE 3
READY AFTER FIXES
BLOCKED
NOT READY
```

절대로 테스트하지 않은 항목을 PASS라고 쓰지 않는다.

---

# 21. 가장 중요한 원칙

이번 Phase의 성공 기준은 "코드가 동작한다"가 아니다.

다음 5개를 모두 만족해야 한다.

```text
정확한 Chunk 분할
+
Idempotent Dispatch
+
중복 Task 방지
+
실패 후 복구 가능
+
Phase 1 Regression 안전
```

그리고 최종적으로:

> "Dispatch 과정에서 오류가 발생해도 경제 세계에 Side Effect가 발생하지 않고, 동일한 상태에서 다시 실행하여 복구할 수 있다."

는 것을 실제 Firebase/GCP 환경에서 증명해야 한다.
