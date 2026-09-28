# PLAY-07.5.1 RESEARCH EVENT FAILURE DURABILITY VERIFICATION

## 0. 목적

본 문서는 PLAY-07.5 Research Logging 구현 이후 발견된 단 하나의 확인 사항을 검증하기 위한 제한적 검증 명세다.

대상:

`TEST-04 Research Writer Failure`

확인할 질문은 단 하나다.

> Research Writer가 일시적으로 실패하더라도 Transaction은 정상적으로 보호되면서, Research Event가 조용히 유실되지 않고 실패를 감지·추적·재처리할 수 있는가?

본 검증은 Research Logging 전체를 다시 테스트하는 것이 아니다.

---

# 1. 현재 기준

PLAY-07.5 구현 보고서에 따르면:

- `researchLogger.ts`가 구현되었다.
- `purchasePrimaryProperty.ts`에서 Research Event를 기록한다.
- 성공 시 `VALIDATION(SUCCESS)`와 `TRANSACTION(COMPLETED)`을 기록한다.
- 실패 시 `VALIDATION(REJECTED)`을 기록한다.
- 기존 Economic Transaction은 변경하지 않는다.
- TEST-01~TEST-06은 모두 PASS로 보고되었다.

그러나 구현 보고서에는 `logResearchEventAsync`에서 Research Logging 오류를 `catch`하여 Economic Engine의 Critical Path에 영향을 주지 않도록 한다고 명시되어 있다.

따라서 이번 검증에서는 "Transaction을 보호한다"와 "Research Event를 유실하지 않는다"를 분리해서 확인한다.

---

# 2. 검증 범위

## 포함

오직 다음 사항만 검증한다.

1. Research Writer failure 발생
2. Transaction integrity 유지
3. Research Event failure 감지
4. Research Event가 silent loss되지 않는지 확인
5. retry / failure record / DLQ 등 실제 재처리 경로가 존재하는지 확인
6. 동일 Research Event가 재처리될 때 중복 기록이 방지되는지 확인
7. 실제 Raw Evidence 확보

## 제외

다음은 이번 작업에서 하지 않는다.

- R_EXPOSURE 재설계
- R_DECISION 재설계
- R_ACTION 재설계
- R_VALIDATION 재설계
- UX 설계
- UI 변경
- AI L1000
- AI L10000
- Human Season
- GATE 4/5/6 재실행
- 기존 Economic Engine 개선
- Transaction Engine 변경
- 새로운 Research Entity 추가

---

# 3. 절대 변경 금지 영역

다음 Verified Area를 수정하지 않는다.

- Economic Engine
- Economic Batch
- Season Clock
- Reconciliation
- Transaction Atomicity
- Transaction Idempotency
- Property Master
- 기존 PLAY_DECISION_LOG
- GATE 4/5/6 검증 결과

특히 Research Event failure를 해결하기 위해 Transaction을 Research Event 저장 성공 여부에 종속시키지 않는다.

금지:

```text
Research Event 저장 실패
→ Transaction rollback
```

이번 검증의 기본 요구는 반대다.

```text
Research Event 저장 실패
→ Transaction은 정상 유지
→ Research Event failure는 별도로 감지/추적/재처리
```

---

# 4. PASS 기준

## 4.1 Transaction Integrity

Research Writer failure가 발생해도:

- Transaction은 정상적으로 commit된다.
- cash 상태가 정상이다.
- property ownership이 정상이다.
- net worth가 정상이다.
- 기존 Transaction Idempotency가 깨지지 않는다.

## 4.2 Research Event Durability

Research Writer failure가 발생했을 때:

### PASS

다음 중 하나 이상의 명확한 경로가 존재하고 실제 증거로 확인된다.

```text
FAILED
  ↓
Retry
  ↓
PERSISTED
```

또는

```text
FAILED
  ↓
Dead Letter / Failure Queue
  ↓
재처리 가능
```

또는

```text
FAILED
  ↓
영속적인 Failure Record
  ↓
운영자가 재처리 가능
```

중요한 것은 단순히 "에러가 발생했다"가 아니다.

**실패한 Research Event를 나중에 찾고 재처리할 수 있어야 한다.**

---

# 5. FAIL 기준

다음 중 하나라도 발생하면 FAIL이다.

### F-01 Silent Loss

Research Writer가 실패했지만:

- failure record 없음
- retry 없음
- DLQ 없음
- 재처리 경로 없음

즉:

```text
Research Event
→ 실패
→ catch
→ 사라짐
```

이면 FAIL.

### F-02 Transaction Coupling

Research Event 저장 실패 때문에 Transaction이 rollback 또는 실패하면 FAIL.

### F-03 Duplicate Research Event

Retry 과정에서 동일 Event가 중복 기록되고 이를 식별/방지할 수 없으면 FAIL.

### F-04 Evidence Insufficient

Research Writer failure가 발생했다고 보고되지만 실제 Firestore/GCP/로그에서 확인할 수 없으면 FAIL 또는 BLOCKED.

---

# 6. 테스트 설계

## TEST-04A — Controlled Research Writer Failure

목적:

Research Event 저장 실패를 의도적으로 발생시킨다.

절차:

1. 통제된 테스트 Season 생성
2. 테스트 Participant 생성
3. 정상적인 Primary Purchase 준비
4. Research Writer 저장만 실패하도록 통제
5. Transaction 실행
6. Transaction 결과 확인
7. Research Event failure 상태 확인
8. retry/DLQ/failure record 확인
9. 재처리
10. 최종 Research Event PERSISTED 확인
11. 중복 여부 확인

중요:

Economic Transaction 자체를 실패시키기 위한 fault injection은 사용하지 않는다.

Fault는 Research Writer 계층에만 적용한다.

---

# 7. 기대 상태

실패 순간:

```text
Transaction = COMMITTED
Research Event = FAILED / QUEUED / RETRYABLE
```

재처리 후:

```text
Transaction = COMMITTED
Research Event = PERSISTED
```

Research Event는 단 한 번의 논리적 Event로 식별되어야 한다.

---

# 8. Idempotency 검증

Research Event의 동일 Event가 재처리되는 상황을 확인한다.

동일한:

- season_id
- participant_id
- simulation_period
- event_type
- request_id
- correlation_id

등을 가진 Event가 재전송될 수 있다.

확인:

```text
Retry 1
Retry 2
Retry 3
```

가 발생해도 논리적 Research Event는 중복 생성되지 않아야 한다.

단, 실제 구현의 Idempotency Key 정의를 먼저 확인하고 그 정의를 기준으로 판단한다.

임의로 새로운 Key를 만들어 테스트하지 않는다.

---

# 9. "Fire and Forget"에 대한 판단

현재 구현에서 `logResearchEventAsync`가 실패를 catch하는 것은 그 자체로 PASS도 FAIL도 아니다.

판단 기준은 다음이다.

### 허용

```text
await하지 않음
+
failure를 감지
+
failure를 기록
+
retry/DLQ/재처리 가능
```

### 불허

```text
await하지 않음
+
catch
+
무시
```

즉:

> 비동기라는 사실이 Research Event 유실의 이유가 되어서는 안 된다.

---

# 10. Evidence 요구사항

최종 보고서에는 최소 다음 Raw Evidence를 포함한다.

1. Transaction 성공 로그
2. Research Writer failure 로그
3. Failure Record / Retry / DLQ 증거
4. 재처리 실행 로그
5. 최종 Research Event 조회 결과
6. Transaction 최종 상태
7. Research Event 중복 여부
8. correlation_id
9. request_id
10. trace_id

가능하면 동일한 correlation_id로 전체 흐름을 보여준다.

---

# 11. Attempt Rule

`PLAY_AG_WORK_CONTROL_PROTOCOL_v1.1` 적용.

동일 테스트 최대 2회.

### Attempt 1 PASS

즉시 종료.

### Attempt 1 FAIL

- 원인 분석
- 최소 수정 1회
- Attempt 2

### Attempt 2 PASS

즉시 종료.

### Attempt 2 FAIL

즉시 STOP.

3회 실행 금지.

---

# 12. 코드 변경 규칙

이번 검증에서 코드 변경은 원칙적으로 금지한다.

다만 TEST-04의 목적을 충족하기 위해 최소한의 결함 수정이 불가피하다고 판단되면:

1. 변경 전 상태 기록
2. Root Cause 기록
3. 최소 변경안 제시
4. Human Review 필요 여부 판단
5. 변경 후 Attempt 2 실행

을 따른다.

특히 다음 변경은 금지한다.

- Transaction Path 변경
- Economic Engine 변경
- 기존 Idempotency 변경
- 기존 테스트 assertion 완화
- failure를 warning으로 변경
- 실패 결과를 PASS로 바꾸는 테스트 수정
- Retry 횟수를 무제한으로 변경

---

# 13. 최종 판정

## VERIFIED

다음이 모두 확인됨.

- Transaction integrity 유지
- Research Event failure 감지
- Silent Loss 없음
- Retry/DLQ/Failure Record 중 하나 이상의 실제 재처리 경로 존재
- 재처리 성공
- 중복 방지
- Raw Evidence 확보

## VERIFIED WITH LIMITATION

Transaction은 안전하지만 Research Event의 자동 재처리가 아니라 수동 복구 등 제한적인 경로만 존재.

이 경우 Human Season 진입에 필요한 추가 조치 여부를 명시한다.

## BLOCKED

다음 중 하나.

- Research Event silent loss
- 재처리 경로 없음
- Transaction integrity 영향
- duplicate event 통제 불가
- Raw Evidence 부족
- 테스트 2회 실패
- Verified Area 변경이 필요하지만 승인되지 않음

---

# 14. 결과 문서

AG는 다음 문서를 하나만 생성한다.

`PLAY-07.5.1_RESEARCH_EVENT_FAILURE_DURABILITY_VERIFICATION_REPORT.md`

포함:

1. 검증 목적
2. 현재 구현 구조
3. TEST-04A 실행 조건
4. Attempt 1
5. Attempt 2 (필요한 경우만)
6. Transaction Integrity 결과
7. Research Event Failure 결과
8. Retry/DLQ/Failure Record 결과
9. Idempotency 결과
10. Raw Evidence
11. 변경 내역
12. 최종 판정
13. Human Season 영향

---

# 15. 범위 종료 조건

이번 검증의 최종 목적은 단 하나다.

> "Research Logging failure가 발생해도 Transaction은 안전하고, Research Event는 조용히 사라지지 않는다는 것을 증명하는 것."

이 조건이 VERIFIED되면 즉시 작업을 종료한다.

추가 개선사항을 발견하더라도 이번 범위에 포함시키지 않는다.

그 다음 단계는 별도 승인 후

`PLAY Human Product / UX`

설계로 이동한다.

절대 UX 설계를 이번 작업에 섞지 않는다.
