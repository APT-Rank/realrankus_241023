# PLAY-07.3 CHANGE CONTROL — dispatchBatchChunks Race Condition Fix

## 1. 목적

GATE 6에서 실제로 재현된 `dispatchBatchChunks` 경쟁 조건을 최소 범위로 수정하고,
수정 후 동일한 실패 시나리오가 재발하지 않는지 표적 회귀검증한다.

이 문서는 새로운 기능 개발이나 아키텍처 개선을 위한 문서가 아니다.
**GATE 6에서 확인된 단일 장애 원인의 수정·검증·종료를 위한 Change Control 문서**다.

---

## 2. 근거가 되는 기존 증거

### 2.1 발견된 문제

GATE 6 raw evidence에서 다음 상태가 확인됐다.

- 동일 Batch에 대한 `dispatchBatchChunks` 동시 호출
- Cloud Task 생성 중복 시 `ALREADY_EXISTS`
- `ALREADY_EXISTS` 처리 과정에서 Chunk 상태가 이미 `COMPLETED`인데 다시 `DISPATCHED`로 덮어써짐
- 이후 `aggregateBatch`가 완료된 Chunk를 다시 완료 대기 대상으로 인식
- Batch가 `FAILED/STUCK` 상태에 머무름
- G6-E의 P3는 P2 실패 때문에 실행되지 않음

즉, **경제 데이터 중복/손상은 확인되지 않았지만 Batch pipeline의 진행성이 깨지는 실제 장애**다.

### 2.2 근거 파일

- `PLAY-07.3_GATE6_FINAL_AUDIT_ISSUES.md`
- `PLAY-07.3_GATE6_FINAL_AUDIT_RAW_EVIDENCE.md`
- `PLAY-07.3_GATE6_FINAL_AUDIT_EXECUTION_REPORT.md`
- `PLAY-07.3_GATE6_FINAL_AUDIT_DECISION_RECORD.md`

### 2.3 별도 이슈

인증된 비인가 사용자의 `createEconomicBatch` 응답이 403이 아니라 404인 문제도 기록되어 있다.

본 Change Control에서는 이 문제를 수정하지 않는다.

이유:
- 현재 보안 차단 자체는 동작했다.
- 이번 변경의 직접 원인이 아니다.
- 범위를 넓히면 GATE 6 재검증 범위가 불필요하게 커진다.

---

## 3. 변경 범위

### IN SCOPE

오직 다음 항목만 변경한다.

1. `dispatchBatchChunks.ts`
2. 해당 경쟁 조건을 직접 검증하는 테스트 코드
3. 필요한 경우 해당 상태 전이 검증 로직

### OUT OF SCOPE

다음은 변경 금지다.

- Economic Engine
- Property Market Engine
- Player Asset
- Season Clock
- aggregateBatch의 구조적 재설계
- Cloud Tasks / Queue 아키텍처 변경
- Firestore schema 변경
- Authentication / RBAC 구조 변경
- 360-period simulation 재실행
- 새로운 기능 추가
- 성능 최적화
- 코드 전체 리팩터링
- 다른 알려진 버그 수정
- GATE 6의 다른 실패를 동시에 수정

---

## 4. 현재 확인된 Root Cause

현재 증거가 지원하는 Root Cause는 다음과 같다.

```text
dispatchBatchChunks A
  └─ Task 생성 성공
      └─ Chunk = DISPATCHED
          └─ worker 실행
              └─ Chunk = COMPLETED

dispatchBatchChunks B
  └─ 동일 Task 생성 시도
      └─ ALREADY_EXISTS
          └─ 기존 오류 처리
              └─ Chunk = DISPATCHED   ← 잘못된 역행
```

핵심 문제:

> 이미 `COMPLETED`가 된 Chunk 상태를 `ALREADY_EXISTS` 처리 때문에 `DISPATCHED`로 되돌릴 수 있다.

이는 단조 증가해야 하는 상태 전이 원칙을 깨뜨린다.

---

## 5. 수정 원칙

### 5.1 상태 전이는 역행하지 않는다

허용되는 기본 흐름:

```text
PENDING
  ↓
DISPATCHING
  ↓
DISPATCHED
  ↓
RUNNING
  ↓
COMPLETED
```

최소한 이번 버그와 관련하여 다음은 절대 허용하지 않는다.

```text
COMPLETED → DISPATCHED
COMPLETED → PENDING
```

### 5.2 ALREADY_EXISTS 처리

`ALREADY_EXISTS`는 실패한 작업으로 취급하지 않는다.

다만 다음 원칙을 지킨다.

- 현재 Chunk 상태를 확인한다.
- 현재 상태가 `COMPLETED`라면 절대 `DISPATCHED`로 변경하지 않는다.
- 현재 상태가 `RUNNING`이라면 절대 `DISPATCHED`로 변경하지 않는다.
- 현재 상태가 `DISPATCHED`라면 그대로 유지한다.
- 현재 상태가 `PENDING`인 경우에만 필요한 최소 상태 조치를 허용한다.
- 가능하면 Task 생성 성공 여부 자체를 기준으로 상태를 결정하고, `ALREADY_EXISTS`만으로 상태를 되돌리지 않는다.

### 5.3 최소 변경 원칙

기존 정상 동작을 보존한다.

특히 기존에 검증된 다음 동작은 변경하지 않는다.

- 150 players → 2 chunks
- deterministic task name
- duplicate dispatch idempotency
- mid-failure resume
- Batch `RUNNING` 진입 조건
- player economic state 비변경
- Season Clock 비변경

---

## 6. 반드시 재현해야 하는 Bug Scenario

수정 전 또는 수정 직후 테스트 환경에서 다음 시나리오를 명확히 재현/검증한다.

### RACE-01

조건:

- 동일 Batch
- 동일 Chunk
- 동일 deterministic Cloud Task name
- `dispatchBatchChunks` 동시 호출 5회 이상

검증:

1. 첫 dispatch가 Task를 생성한다.
2. Chunk worker가 실행되어 Chunk를 `COMPLETED`로 만든다.
3. 다른 concurrent dispatch가 `ALREADY_EXISTS`를 받는다.
4. `ALREADY_EXISTS` 처리 후에도 Chunk가 `COMPLETED`인지 확인한다.
5. Chunk가 `DISPATCHED`로 역행하지 않아야 한다.
6. `aggregateBatch`가 정상적으로 Batch 완료를 판단해야 한다.
7. Batch가 STUCK/PENDING 상태로 영구 정지하지 않아야 한다.

---

## 7. 회귀 테스트

### REG-01 — Concurrent Dispatch

- 5 concurrent dispatch
- 동일 Batch
- 동일 Chunk
- 예상:
  - 중복 Task 없음
  - Chunk 상태 역행 없음
  - 최종 Chunk = COMPLETED
  - Batch 정상 종료

### REG-02 — Duplicate Dispatch

동일 요청을 순차적으로 반복한다.

예상:

- 추가 Task 생성 없음
- 상태 변화 없음
- 정상적인 idempotent response

### REG-03 — Mid-Failure Resume

기존 F02-E와 동일한 범위.

예상:

- 일부 Chunk dispatch 후 crash
- Batch가 안전하게 `DISPATCHING`
- 재실행 시 이미 완료/진행된 Chunk는 중복 처리하지 않음
- 누락 Chunk만 처리
- 최종 Batch 정상 진행

### REG-04 — Economic State Isolation

dispatch 과정에서 다음 값이 변경되지 않아야 한다.

- player cash
- locked cash
- debt
- net worth
- property ownership
- Season Clock

### REG-05 — Aggregation Completion

Concurrent dispatch 이후:

```text
all expected chunks = COMPLETED
        ↓
aggregateBatch
        ↓
Batch completed
        ↓
next pipeline stage
```

가 정상적으로 이어져야 한다.

### REG-06 — Reconciliation

수정 후 해당 테스트 데이터에 대해 reconciliation을 실행한다.

예상:

- orphan chunk 없음
- duplicate task effect 없음
- invalid state transition 없음
- economic invariant violation 없음

---

## 8. 변경 금지 영역 보호

이번 수정에서 다음 기존 검증 결과를 다시 설계하거나 수정하지 않는다.

- PLAY-07.1 Economic Engine
- PLAY-07.2 Property Market
- PLAY-07.3 GATE 4
- PLAY-07.3 GATE 5
- 기존 Phase 2 dispatch 정상 동작
- player-level idempotency
- Batch Aggregator 구조
- Season Clock

문제가 발견되더라도 이번 작업 범위 밖이면 별도 ISSUE로 기록하고 STOP한다.

---

## 9. 검증 예산 / Anti-Infinite Rule

이번 Change Control은 무한 검증을 금지한다.

### 정상 실행

- 수정 코드 검증 1회
- 표적 경쟁 조건 테스트 1회
- 회귀 테스트 1회

### 재실행

외부 인프라/인증/네트워크 등 명백한 transient failure일 경우에만 최대 1회 재실행한다.

### 금지

- 동일 테스트를 성공할 때까지 반복
- 테스트 실패 후 임의 코드 수정
- 테스트 범위를 계속 확대
- 360-period simulation 재실행
- 이미 PASS한 GATE 전체 재실행
- 새로운 아키텍처 제안
- unrelated bug fixing

**실패는 STOP 신호다.**

---

## 10. 성공 조건

다음 7개를 모두 만족해야 이번 Change Control을 PASS로 종료한다.

1. `COMPLETED → DISPATCHED` 역행이 재현되지 않는다.
2. 5 concurrent dispatch에서 duplicate task effect가 발생하지 않는다.
3. Batch가 STUCK 상태에 빠지지 않는다.
4. aggregateBatch가 정상 완료된다.
5. economic state에 부작용이 없다.
6. reconciliation이 정상이다.
7. 기존 Mid-Failure Resume 회귀 테스트가 PASS한다.

하나라도 실패하면:

```text
STATUS = BLOCKED
```

로 종료한다.

추가 수정은 새 Change Control 없이 진행하지 않는다.

---

## 11. 증거물

AG는 다음 결과물을 반드시 남긴다.

1. 변경 전 코드/상태 요약
2. 정확한 변경 파일 목록
3. 변경 diff 요약
4. Root Cause 확인
5. RACE-01 테스트 결과
6. REG-01~REG-06 결과
7. Firestore 최종 상태
8. Batch/Chunk 상태 변화
9. reconciliation 결과
10. 실패 시 stack trace / error code / request ID
11. 최종 PASS 또는 BLOCKED
12. 이번 작업에서 변경하지 않은 영역 목록

---

## 12. 종료 규칙

### PASS

모든 성공 조건 충족.

```text
CHANGE CONTROL = PASS
```

그 후에만 GATE 6의 남은 검증을 재개할 수 있다.

### BLOCKED

하나라도 핵심 조건 실패.

```text
CHANGE CONTROL = BLOCKED
```

이 경우:

- 추가 수정 금지
- 추가 테스트 금지
- GATE 6 재개 금지
- 실패 원인과 현재 상태만 보고
- 다음 변경은 별도 승인 필요

---

## 13. 다음 단계

이번 수정이 PASS한 뒤에만 GATE 6의 미완료 항목을 재개한다.

특히 GATE 6에서 P2 실패로 SKIPPED된 P3/R5 등 남은 항목은 **수정 완료 후 별도로 제한된 범위에서 검증**한다.

GATE 6 전체를 처음부터 다시 돌리지 않는다.

360-period GATE 5도 다시 돌리지 않는다.
