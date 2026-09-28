# PLAY AG WORK CONTROL PROTOCOL

## 0. 목적

PLAY 개발의 목표는 단순히 테스트를 PASS시키는 것이 아니다.

다음 5가지가 동시에 충족되는 시스템을 만드는 것이 목적이다.

1. 오류를 발견할 수 있어야 한다.
2. 오류의 원인을 추적할 수 있어야 한다.
3. 동일한 오류를 재현할 수 있어야 한다.
4. 수정 후 기존 기능에 부작용이 없는지 검증할 수 있어야 한다.
5. 검증 과정에서 시스템 자체가 임의로 변형되지 않아야 한다.

따라서 앞으로는 **테스트 PASS보다 변경의 추적 가능성(Change Traceability)을 우선한다.**

---

# 1. ABSOLUTE STOP RULE

다음 상황에서는 즉시 작업을 중단하고 사용자 승인을 기다린다.

## A. 아키텍처 변경

다음 항목 중 하나라도 변경이 필요하면 STOP한다.

- Cloud Functions 실행 방식
- `onRequest` / `onTaskDispatched`
- Cloud Tasks 구조
- Queue 생성 방식
- Cloud Run / Cloud Functions endpoint
- Firestore 구조
- Collection / Document schema
- Idempotency 구조
- Authentication / Authorization
- Batch / Chunk 구조
- Season Clock 구조
- Player Processing 구조
- Reconciliation 구조
- 기존 Phase의 핵심 설계

## B. 이미 검증된 영역의 변경

PLAY-07.2 또는 이전 Phase에서 VERIFIED / READY로 승인된 코드나 구조를 변경해야 하는 경우 STOP한다.

단순 bug fix와 구조 변경을 구분한다.

- 국소적 bug fix → 수정 가능
- 데이터 구조 변경 → STOP
- API contract 변경 → STOP
- transaction boundary 변경 → STOP
- idempotency semantics 변경 → STOP
- 기존 검증 범위에 영향을 주는 변경 → STOP

## C. 테스트 반복

다음 중 하나가 발생하면 추가 테스트를 임의로 계속하지 않는다.

- 동일 테스트 3회 연속 실패
- 동일 원인에 대한 수정 2회 이상
- 새로운 인프라 문제가 연속적으로 발생
- 테스트가 예상 시간보다 2배 이상 오래 지속
- 테스트 결과가 이전 실행과 다르게 나타남
- 원인을 확정하지 못한 상태에서 workaround가 필요함

즉시 STOP하고 원인 분석 보고서를 작성한다.

---

# 2. NO SILENT CHANGE

사용자에게 보고하지 않고 다음 작업을 수행하지 않는다.

- 코드 구조 변경
- 데이터 모델 변경
- 인프라 변경
- 함수 삭제
- 함수 재배포
- Queue 생성/삭제
- Cloud Task 방식 변경
- 인증 방식 변경
- 테스트 방식 변경
- 기존 검증 기준 변경

특히 **테스트를 통과시키기 위한 임시 변경**을 하지 않는다.

---

# 3. DIAGNOSIS FIRST

문제가 발생하면 다음 순서만 허용한다.

### STEP 1
현재 상태를 보존한다.

### STEP 2
실제 오류 로그와 상태를 수집한다.

### STEP 3
원인 후보를 작성한다.

### STEP 4
각 원인 후보에 대한 증거를 수집한다.

### STEP 5
원인을 확정한다.

### STEP 6
수정안을 제시한다.

### STEP 7
수정이 기존 설계와 검증 범위에 미치는 영향을 설명한다.

### STEP 8
승인이 필요한 경우 STOP한다.

승인 전에는 수정하지 않는다.

---

# 4. WORKAROUND PROHIBITION

검증을 통과시키기 위한 임시 workaround를 금지한다.

특히 다음을 금지한다.

- endpoint를 임의로 하드코딩
- Queue를 우회
- 인증 검증 우회
- timeout 증가만으로 문제 해결
- retry 횟수 증가만으로 문제 해결
- 테스트 데이터를 변경하여 PASS 유도
- 기존 테스트 assertion 완화
- 오류를 무시하고 다음 단계 진행
- 실패한 기능을 mock 처리
- 실제 인프라 대신 local simulation으로 PASS 처리

Workaround가 필요하다고 판단되면 STOP하고 사용자에게 보고한다.

---

# 5. TEST BOUNDARY

각 Phase에는 명확한 테스트 범위를 정의한다.

테스트 범위 밖의 문제를 발견했다고 해서 자동으로 다음 영역까지 확장하지 않는다.

예:

Phase 5 테스트 중 Phase 7 문제가 발견되더라도 Phase 5 테스트를 임의로 Phase 7까지 확대하지 않는다.

먼저 다음만 보고한다.

- 현재 Phase의 실패 원인
- 영향 범위
- 다음 Phase와의 관계

---

# 6. TEST BUDGET

각 테스트에는 다음 정보를 기록한다.

- Test ID
- 시작 시간
- 종료 시간
- 실행 횟수
- 실패 횟수
- 마지막 오류
- 수정 횟수
- 코드 변경 여부
- 인프라 변경 여부

동일 테스트를 무한 반복하지 않는다.

---

# 7. FAILED TEST ≠ CODE BUG

테스트가 실패했다고 즉시 코드를 수정하지 않는다.

실패 원인을 다음 중 하나로 분류한다.

1. Application Code
2. Database
3. Cloud Function
4. Cloud Tasks
5. Authentication
6. Deployment
7. Infrastructure Provisioning
8. Test Harness
9. Test Data
10. Unknown

`Unknown`이면 수정하지 말고 STOP한다.

---

# 8. VERIFIED 영역 보호

다음 영역은 특별 보호한다.

- PLAY-07.2 Property Market
- Primary Purchase
- Secondary Matching
- Transaction Atomicity
- Idempotency
- Reconciliation
- Economic Engine
- Player Processing

이 영역을 변경해야 할 경우 반드시 다음을 보고한다.

1. 왜 변경해야 하는가?
2. 어떤 VERIFIED 기능에 영향을 주는가?
3. 변경 전/후 architecture
4. 변경되는 data model
5. 변경 전/후 transaction boundary
6. 변경 전/후 idempotency semantics
7. regression test plan
8. rollback plan

승인 전 수정 금지.

---

# 9. PHASE COMPLETION RULE

다음 조건을 모두 만족해야 Phase 완료로 판단한다.

- Implementation 완료
- Unit Test 완료
- Integration Test 완료
- Failure Injection 완료
- Retry Test 완료
- Idempotency Test 완료
- Reconciliation 완료
- Regression Test 완료
- 실제 Firebase/GCP 환경 검증
- Evidence 확보
- 변경 사항 기록
- 미해결 이슈 없음

단순히 `"PASS"`라고 보고하는 것은 증거가 아니다.

---

# 10. REPORT FORMAT

문제가 발생하면 다음 형식으로만 보고한다.

## ISSUE

### Symptom
실제 발생한 현상

### Evidence
로그 / Firestore 상태 / Task 상태 / Function 결과

### Root Cause
확정된 원인

### Impact
영향 범위

### Proposed Fix
수정안

### Architecture Impact
기존 설계에 미치는 영향

### Regression Impact
기존 VERIFIED 영역에 미치는 영향

### Approval Required
YES / NO

### Current Status
BLOCKED / READY FOR FIX / READY FOR TEST

---

# 11. CHANGE LOG REQUIREMENT

사용자 승인 없이 수행된 변경이 있는 경우 숨기지 않는다.

반드시 다음을 기록한다.

- 변경 시각
- 변경 주체
- 변경 파일
- 변경 코드
- 변경된 GCP/Firebase resource
- 변경 전 상태
- 변경 후 상태
- 변경 이유
- 테스트 결과
- rollback 가능 여부

특히 함수 삭제, 함수 재배포, Queue 생성/삭제, endpoint 변경은 반드시 별도로 표시한다.

---

# 12. APPROVAL GATE

다음 작업은 사용자 승인 없이는 수행하지 않는다.

## Approval Required

- 아키텍처 변경
- 기존 VERIFIED 영역의 구조 변경
- 데이터 모델 변경
- Cloud Functions trigger 변경
- Cloud Tasks 구조 변경
- Queue 변경
- 인증 구조 변경
- 함수 삭제
- 함수 재배포
- endpoint 변경
- transaction boundary 변경
- idempotency semantics 변경
- 테스트 기준 변경
- workaround 적용

## Approval Not Required

다음은 기존 설계를 변경하지 않는 범위에서 수행할 수 있다.

- 로그 조회
- Firestore 상태 조회
- Cloud Tasks 상태 조회
- Function 실행 로그 조회
- 테스트 결과 수집
- 재현을 위한 읽기 전용 분석
- 독립적인 검증 보고서 작성

경계가 불명확하면 Approval Required로 간주한다.

---

# 13. CURRENT TASK — PLAY-07.3 PHASE 5~7

현재 진행 중인 PLAY-07.3 Phase 5~7 작업에서는 위 규칙을 즉시 적용한다.

현재까지 발생한 Queue / Endpoint / Deployment 문제에 대해 추가적인 구조 변경을 하지 않는다.

먼저 현재 상태를 동결하고 다음을 보고한다.

1. 현재 배포된 Function 목록
2. Function별 trigger type
3. Cloud Tasks Queue 목록
4. Queue와 Function의 연결 관계
5. 현재 task 생성 방식
6. 현재 task target 방식
7. 최근 실패한 E2E 테스트의 정확한 실패 지점
8. 실패 원인이 확정되었는지 여부
9. 지금까지 사용자 승인 없이 변경된 코드/인프라
10. 변경된 파일 목록
11. 각 변경의 이유
12. 현재 상태에서 가장 작은 수정안
13. 수정안의 regression 범위
14. 현재 상태의 rollback 가능 여부
15. 현재 상태에서 추가 테스트를 계속할 경우 발생할 수 있는 위험

위 보고를 완료하면 **STOP**한다.

추가 코드 수정, 배포, 삭제, Queue 변경, 테스트 반복을 하지 않는다.

사용자 승인 후에만 다음 작업을 수행한다.

---

# 14. 핵심 원칙

PLAY는 "테스트를 계속해서 언젠가 PASS시키는 시스템"이 아니다.

**검증 가능한 시스템을 만드는 것이 목표다.**

따라서 다음 순서를 임의로 생략하지 않는다.

> 발견 → 기록 → 재현 → 원인 규명 → 수정안 → 승인 → 수정 → 회귀검증

특히:

> **BLOCKED 상태에서 임의로 수정하지 않는다.**

그리고:

> **테스트가 끝나지 않는 것이 문제가 아니라, 왜 끝나지 않는지 추적할 수 없는 것이 문제다.**
