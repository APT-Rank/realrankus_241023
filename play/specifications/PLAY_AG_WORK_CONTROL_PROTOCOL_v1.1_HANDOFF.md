# PLAY_AG_WORK_CONTROL_PROTOCOL v1.1
## AG 작업 통제 원칙 — 2-Strike STOP / Human Review Gate

### 핵심 원칙

PLAY 검증의 목적은 "PASS를 만들어내는 것"이 아니라 실패를 발견하고, 원인을 보존하고, 최소 수정 후 제한된 횟수 안에서 재검증하며, 해결되지 않으면 인간 검토로 넘기는 것이다.

### 2-Strike STOP Rule

동일 Test ID / 동일 검증 목적 / 동일 Acceptance Criteria는 최대 2회만 실행한다.

```text
1차 실행
 ├─ PASS → Evidence 제출 후 종료
 └─ FAIL → Root Cause 분석 → 최소 수정 1회 → 2차 실행
                         ├─ PASS → Evidence 제출 후 종료
                         └─ FAIL → 즉시 STOP → Report → Human Review
```

2차 FAIL 이후에는 3차 테스트, 추가 코드 수정, 테스트 조건 변경, Assertion 완화, workaround, unrelated bug fixing을 하지 않는다.

### PASS Evidence

`ALL PASSED` 같은 요약만으로 PASS를 인정하지 않는다.

PASS에는 최소한 다음이 필요하다.

- Test ID
- 실행 조건
- Expected / Actual
- Raw log
- Firestore/GCP 상태
- Batch/Chunk/Season 상태
- 변경 파일
- PASS 판단 근거

Evidence가 부족하면 `EVIDENCE INCOMPLETE`로 표시한다.

### 최초 FAIL

1. 테스트 중단
2. 원본 로그 보존
3. Root Cause 분석
4. Application Code / Test Harness / External-Infrastructure로 분류
5. 최소 수정 1회
6. 동일 Test ID 2차 실행

### 2차 FAIL

즉시:

```text
STATUS = BLOCKED
HUMAN REVIEW REQUIRED
```

추가 수정하지 않고 Attempt 1/2, Raw Error, Root Cause, 변경 파일, 현재 시스템 상태, Known/Unknown, Risk를 보고한다.

### Test Script 변경

테스트 스크립트를 수정하면 Before/After/Diff/이유/최초 실패 로그/수정 후 Raw Log/Expected/Actual을 제출한다.

Expected 변경, Assertion 완화, 실패 조건 제거, 실패 단계 Skip, 실제 상태 대신 Mock 사용 등으로 PASS를 만드는 행위를 금지한다.

### Scope Lock

현재 작업과 직접 관련 없는 버그는 수정하지 않는다. 별도 Issue로 기록한다.

### Verified Area Protection

이미 PASS한 영역은 불필요하게 재실행하거나 수정하지 않는다. 영향을 받으면 STOP → Report → Human Review.

### GATE 재실행 제한

부분 수정 때문에 GATE 전체를 처음부터 재실행하지 않는다. 직접 관련된 잔여 검증만 실행한다.

### 360-period 보호

GATE 5의 360-period는 별도 Human Approval 없이는 재실행하지 않는다.

### Transient Failure

명백한 외부 일시 오류는 동일 Test의 2회 실행 범위에서만 재시도한다. 3회 이상 실행하지 않는다.

### 최종 원칙

```text
TEST
 ↓
FAIL → DIAGNOSE
 ↓
최소 수정
 ↓
2차 TEST
 ↓
PASS → Evidence + 종료
FAIL → STOP + REPORT
 ↓
HUMAN REVIEW
```

**3차 동일 검증 금지. 2차 FAIL 이후 코드 수정 금지. PASS보다 Raw Evidence 우선.**
