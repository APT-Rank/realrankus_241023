# PLAY-07.3 RECONCILIATION & SEASON CLOCK RECOVERY VERIFICATION

## 0. 목적

`PROP_FINAL_1` stale test data를 삭제하여 `PLAY_PROPERTY_MASTER` 정상 상태를 복구했다.

현재 확인된 정상 상태:

- PLAY_PROPERTY_MASTER = 209
- NORMAL = 200
- INCOMPLETE = 9
- PROP_FINAL_1 = NOT FOUND
- 코드 변경 없음
- 인프라 변경 없음
- E2E 재실행 없음

이번 단계의 목적은 **데이터 정상화 이후 Reconciliation → Season Clock 경로가 정상적으로 복구되는지 최소 범위로 검증하는 것**이다.

이번 단계에서는 Phase 5~7 전체 E2E를 실행하지 않는다.

---

# 1. SCOPE

이번 단계에서 검증할 경로는 다음과 같다.

```text
Batch Completed
    ↓
aggregateBatch
    ↓
runReconciliation
    ↓
Reconciliation PASS
    ↓
advanceSeasonClock
    ↓
Season Clock Advance
```

핵심 질문:

> **stale test data 제거 후 Reconciliation이 정상 통과하고 Season Clock이 실제로 한 단계 진행하는가?**

---

# 2. CONTROL RULE

이번 단계에도 `PLAY_AG_WORK_CONTROL_PROTOCOL.md`를 그대로 적용한다.

## 절대 금지

검증 중 다음 작업을 임의로 수행하지 않는다.

- 코드 수정
- 함수 수정
- 함수 재배포
- 함수 삭제
- Queue 변경
- endpoint 변경
- Firestore schema 변경
- Reconciliation 기준 변경
- Property Master 변경
- 테스트 assertion 변경
- workaround
- retry 횟수 변경
- timeout 증가
- E2E 테스트 수정

문제가 발생하면 먼저 원인을 분류하고 STOP한다.

---

# 3. PRE-CHECK

검증 실행 전에 READ-ONLY로 현재 상태를 확인한다.

## Property Master

Expected:

```text
Total = 209
NORMAL = 200
INCOMPLETE = 9
PROP_FINAL_1 = NOT FOUND
```

이 조건이 하나라도 맞지 않으면:

> **STOP — DO NOT RUN TEST**

하고 상태를 보고한다.

---

# 4. TEST TARGET

기존 시스템의 실제 GCP/Firebase 환경을 사용한다.

Mock / Local Simulation을 사용하지 않는다.

검증은 기존 Phase 5~7 구현과 기존 테스트 환경을 이용한다.

단, **전체 `verify_batch_phase5_to_7.ts`를 실행하지 않는다.**

이번 단계에서는 Reconciliation → Season Clock 경로만 최소한으로 검증한다.

---

# 5. TEST CASE RSC-01

## Reconciliation 정상 통과

### 목적

Property Master 정상화 후 `runReconciliation`이 Property Master count mismatch 없이 PASS하는지 확인한다.

### Preconditions

```text
PROPERTY_MASTER total = 209
NORMAL = 200
INCOMPLETE = 9
```

### 실행

실제 Batch가 완료된 상태에서 기존 `runReconciliation` 경로를 사용하여 검증한다.

가능하면 기존 정상 Batch/Season 상태를 사용한다.

새로운 테스트용 Property Master 데이터를 만들지 않는다.

### Evidence

반드시 다음을 확보한다.

- season_id
- batch_id
- reconciliation execution
- Function execution log
- Property Master count
- reconciliation result
- error 여부
- transaction pause 여부
- generated task 정보

### PASS 조건

- Property Master count mismatch 없음
- Reconciliation PASS
- HTTP/function error 없음
- Season이 불필요하게 PAUSED/TRANSACTION_PAUSED로 전환되지 않음
- 다음 단계인 `advanceSeasonClock` 호출이 발생함

---

# 6. TEST CASE RSC-02

## Season Clock Advance

### 목적

Reconciliation PASS 이후 `advanceSeasonClock`이 정상 실행되고 simulation period가 정확히 한 단계 증가하는지 확인한다.

### 확인 대상

실행 전:

```text
current_period = P
```

실행 후:

```text
current_period = P + 1
```

### Evidence

반드시 기록한다.

- season_id
- expected_period
- current_period before
- current_period after
- reconciliation status
- advanceSeasonClock execution log
- task metadata
- idempotency result
- final season status

### PASS 조건

- `advanceSeasonClock` 실행됨
- 정확히 1회 period advance
- P → P+1
- 중복 advance 없음
- Season 정상 상태 유지
- Reconciliation PASS와 Clock Advance의 순서가 정상임

---

# 7. DUPLICATE / IDEMPOTENCY CHECK

이번 단계에서 별도의 부하 테스트를 하지 않는다.

다만 로그와 상태를 확인하여 동일 reconciliation 또는 clock task가 중복 실행되어도 경제 상태나 period가 두 번 변경되지 않았는지 확인한다.

다음이 확인되면 PASS:

```text
period change = exactly 1
economic state duplicate mutation = 0
```

중복 효과가 발견되면 즉시 STOP한다.

---

# 8. FAILURE HANDLING

다음 중 하나라도 발생하면 즉시 테스트를 중단한다.

- Reconciliation failure
- Property Master count mismatch
- Season Clock 미진행
- 두 번 이상 period advance
- 예상하지 않은 Firestore mutation
- Queue failure
- Function 500
- 인증 오류
- timeout
- 새로운 데이터 생성
- 기존 데이터 변경
- root cause UNKNOWN

특히:

> **실패했다고 코드를 수정하지 않는다.**

먼저 evidence를 확보하고 BLOCKED 상태로 보고한다.

---

# 9. TEST BUDGET

이번 단계는 다음 한도를 적용한다.

- 동일 테스트 최대 2회 실행
- 동일 원인 수정 0회
- 코드 변경 0회
- 인프라 변경 0회

첫 번째 실행에서 실패하면 원인을 분석한다.

두 번째 실행은 첫 번째 실패가 **환경적/일시적 요인으로 명확히 확인된 경우에만** 수행한다.

원인이 코드/인프라 변경을 요구하면 즉시 STOP한다.

---

# 10. EVIDENCE REQUIREMENT

단순히 `PASS`라고 보고하지 않는다.

최소 다음 실제 증거를 확보한다.

### Reconciliation

- Function log
- Property Master count
- reconciliation result
- season status

### Season Clock

- before period
- after period
- function log
- task log
- idempotency evidence

### Data Integrity

- Property Master total
- NORMAL count
- INCOMPLETE count
- PROP_FINAL_1 NOT FOUND

---

# 11. FINAL REPORT

다음 형식으로 보고한다.

# PLAY-07.3 RECONCILIATION & SEASON CLOCK RECOVERY REPORT

## 1. Pre-Check

| Item | Expected | Actual | Result |
|---|---:|---:|---|
| Property Master | 209 | | |
| NORMAL | 200 | | |
| INCOMPLETE | 9 | | |
| PROP_FINAL_1 | NOT FOUND | | |

## 2. RSC-01 Reconciliation

- Season ID
- Batch ID
- Execution time
- Property count
- Reconciliation result
- Season status
- Evidence

## 3. RSC-02 Season Clock

| Item | Before | After | Result |
|---|---|---|---|
| Current Period | | | |
| Season Status | | | |

## 4. Idempotency / Duplicate Effect

- Reconciliation duplicate effect
- Clock duplicate effect
- Period increment count

## 5. Data Integrity

- Unexpected writes
- Unexpected deletes
- Property Master changes
- Player state changes

## 6. Failure / Issues

문제가 있으면 상세 기록한다.

## 7. FINAL STATUS

반드시 다음 중 하나:

### READY FOR FULL E2E APPROVAL

RSC-01 / RSC-02 모두 PASS하고 변경 없음.

### BLOCKED

문제가 발생했거나 원인이 확정되지 않음.

### PARTIALLY VERIFIED

일부 검증만 완료.

---

# 12. ABSOLUTE STOP

RSC-01 / RSC-02가 PASS하더라도 다음 단계로 자동 진행하지 않는다.

특히:

- `verify_batch_phase5_to_7.ts` 전체 실행 금지
- Phase 5~7 전체 E2E 금지
- 코드 수정 금지
- Queue 정리 금지
- Architecture 변경 금지

최종 보고서 작성 후:

> **STOP — WAITING FOR USER APPROVAL**

상태로 종료한다.

---

# 핵심 원칙

이번 단계에서는 전체 시스템을 다시 테스트하지 않는다.

오직:

> **정상 데이터 복구 → Reconciliation PASS → Season Clock 1회 진행**

이라는 가장 짧은 경로만 검증한다.

성공하면 다음 단계로 넘어가기 위한 근거를 만든다.

실패하면 수정하지 않고 원인을 추적한다.

최종 순서:

> PRE-CHECK → RSC-01 → RSC-02 → EVIDENCE → REPORT → STOP
