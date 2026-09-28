# PLAY-07.3 NEXT STEP
## GATE 6 Residual Verification After Dispatch Race Fix

> Governing Protocol: `PLAY_AG_WORK_CONTROL_PROTOCOL_v1.1.md`
> Related Change Control: `PLAY-07.3_CHANGE_CONTROL_DISPATCH_RACE_FIX.md`
> Current State: Change Control = PASS

## 1. 목적

`dispatchBatchChunks` Race Condition Change Control 이후 GATE 6에서 해당 문제 때문에 실행하지 못했던 **잔여 검증만** 제한적으로 재개한다.

GATE 6 전체를 다시 실행하지 않는다.

## 2. 사전 조건

Change Control은 현재 PASS로 기록되어 있다.

TEST-01~06에 대한 Verification Report와 Raw Evidence가 제출되었다.

TEST-06은 최초 Fatal Error 이후 테스트 스크립트의 `current_period` → `current_simulation_period` 수정이 이루어졌고 수정 후 assertion은 PASS했다.

단, 최종 Raw Log의 `current_simulation_period BEFORE`가 이미 4이므로, **P3 → P4 전이 자체의 독립적 증거가 완전하다고 과장하지 않는다.**

## 3. 기존 GATE 6 결과 보존

- G6-A = Previously Verified
- G6-B = Previously Verified
- G6-C = Previously Verified
- G6-D = Previously Verified
- G6-E = Partial / Conditional

기존 결과를 덮어쓰거나 전체 재실행하지 않는다.

## 4. 이번 단계 Scope

### IN SCOPE
- P2 Post-Fix 상태 확인
- P2 실패 때문에 SKIPPED된 P3
- P2 실패 때문에 실행되지 못한 R5 Reconciliation Failure Regression
- 필요한 최소 상태 확인
- 최종 Residual Report

### OUT OF SCOPE
- GATE 6 전체 재실행
- G6-A~D 재실행
- GATE 5 360-period 재실행
- Economic Engine 전체 재검증
- Property Market 전체 재검증
- dispatchBatchChunks 추가 수정
- aggregateBatch 구조 변경
- Season Clock 구조 변경
- RBAC 404/403 수정
- unrelated bug fixing

## 5. STEP 1 — P2 Post-Fix 상태

Batch, Chunk, Cloud Task, aggregateBatch, Season Clock, reconciliation 상태를 최소 범위로 확인한다.

FAIL이면 v1.1의 2-Strike Rule 적용:

- Attempt 1 FAIL → 원인 분석 + 최소 수정 → Attempt 2
- Attempt 2 FAIL → 즉시 STOP + Report + Human Review

## 6. STEP 2 — P3 Residual Verification

기존 GATE 6의 P3 정의와 Acceptance Criteria를 그대로 사용한다.

조건을 새로 만들지 않는다.

PASS → Raw Evidence 저장 후 다음 단계.

FAIL → 원인 분석 + 최소 수정 1회 후 2차 실행.

2차 FAIL → 즉시 STOP.

## 7. STEP 3 — R5 Reconciliation Failure Regression

기존 GATE 6에서 P2 때문에 SKIPPED된 R5가 있다면 실행한다.

기존 Acceptance Criteria를 그대로 사용한다.

확인 대상:
- Fault Injection
- Reconciliation Detection
- Anomaly Detection
- Error Logging
- Safety/Pause behavior
- Recovery state

실제 경제 데이터를 손상시키지 말고 테스트 상태에서 수행한다.

Acceptance Criteria가 불명확하면 임의 해석하지 말고 STOP 후 보고한다.

## 8. Evidence

각 테스트는 다음을 남긴다.

- Test ID
- Attempt
- Timestamp
- Season ID
- Batch ID
- Chunk ID
- Expected
- Actual
- Raw Error / Stack Trace
- Firestore 상태
- Cloud Task 상태
- Season Clock
- Reconciliation 결과
- PASS/FAIL assertion

`TEST PASSED`만으로는 Evidence로 인정하지 않는다.

## 9. 테스트 스크립트 변경

테스트 스크립트를 변경하면 Before/After/Diff/이유/최초 실패 로그/수정 후 Raw Log를 제출한다.

Acceptance Criteria를 완화하거나 Expected 값을 변경하여 PASS를 만들지 않는다.

## 10. 최종 Report

다음 파일을 생성한다.

`PLAY-07.3_GATE6_RESIDUAL_VERIFICATION_REPORT.md`

포함 항목:
1. Previous GATE 6 Status
2. Change Control Result
3. P2 Post-Fix Evidence
4. P3 Result
5. R5 Result
6. Attempt History
7. Raw Logs
8. Firestore/GCP State
9. Issues
10. Evidence Classification
11. Final Decision

Evidence Classification은 다음 중 하나로 구분한다.

- VERIFIED
- PREVIOUSLY VERIFIED
- NOT EXECUTED
- BLOCKED
- EVIDENCE INCOMPLETE

최종 결정은:

```text
GATE 6 RESIDUAL = PASS
```

또는

```text
GATE 6 RESIDUAL = BLOCKED
HUMAN REVIEW REQUIRED
```

## 11. 최종 STOP 조건

다음 중 하나면 즉시 STOP한다.

- 동일 Test 2회 FAIL
- Root Cause 불명확
- Raw Evidence 부족
- Acceptance Criteria 불명확
- Verified Area 영향
- 경제 상태 이상
- Season Clock 이상
- Batch/Chunk 불일치
- reconciliation failure
- 새로운 아키텍처 문제
- 테스트 조건 변경 필요

```text
STOP → REPORT → HUMAN REVIEW
```

## 12. 최종 원칙

목표는 GATE 6을 어떻게든 PASS시키는 것이 아니라, Race Condition 수정 이후 실제로 남아 있던 검증 공백만 채우고 결과를 Raw Evidence로 남기는 것이다.

```text
PASS + Evidence = 인정
PASS + Evidence Incomplete = 보류
FAIL 1회 = 분석 + 최소 수정 + 2차
FAIL 2회 = STOP + Human Review
```
