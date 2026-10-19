# PLAY-07.2 FINAL 4 TESTS VERIFICATION SPEC

## 1. 목적

PLAY-07.2 Property Market Engine에 대해 지금까지 수행한 검증을 마무리하기 위한 최종 검증 문서이다.

기존 검증에서 다음 항목은 PASS되었다.

- Property Master 209건
- NORMAL 200건 / INCOMPLETE 9건
- Primary Supply
- Primary Purchase Concurrency
- BUY Lock
- SELL Lock
- Order Cancellation Recovery
- Secondary Atomic Matching
- 기본 Idempotency
- Worker/Transaction 오류 시 rollback
- Reconciliation 기본 검증

또한 검증 과정에서 Firestore Transaction의 Read-after-Write 오류가 실제로 발견되었고 수정되었다.

이번 문서에서는 아직 명시적인 증거가 부족한 네 가지 영역만 최종 확인한다.

> **P17-A Price-Time Priority**
>
> **P20-A Concurrent Secondary Matching**
>
> **P22-A Crash → Retry → Recovery**
>
> **P23-A Full Property Lifecycle E2E**

이번 검증의 목적은 새로운 기능을 추가하는 것이 아니다.

**PLAY-07.2 Property Market Engine을 다음 단계로 넘기기 전에, 남아 있는 핵심 거래 무결성 리스크가 실제로 없는지 확인하는 것**이다.

---

# 2. 최종 검증 원칙

## 2.1 PASS를 만들기 위한 테스트가 아니다

테스트가 실패하면 그것이 검증의 성공이다.

실패를 발견하면:

1. 실패 재현
2. 원인 분석
3. 영향 범위 분석
4. 수정
5. 동일 테스트 재실행
6. 회귀 테스트
7. 최종 판정

순서로 진행한다.

---

## 2.2 기존 규칙을 임의로 변경하지 않는다

이번 검증을 위해:

- 가격 우선순위 규칙 변경 금지
- 수수료 변경 금지
- Lock 규칙 변경 금지
- Ownership 규칙 변경 금지
- Idempotency 규칙 변경 금지
- Property Master 규칙 변경 금지
- synthetic price 사용 금지
- last_sales 사용 금지
- 임의 valuation 사용 금지

테스트를 통과시키기 위해 production logic을 약화하지 않는다.

---

## 2.3 실제 구현 규칙을 먼저 확인한다

각 테스트 전에 현재 구현된 함수와 데이터 구조를 확인한다.

특히:

- createSecondaryOrder
- cancelSecondaryOrder
- matchSecondaryOrder
- PLAY_SECONDARY_ORDER
- PLAY_PROPERTY_OWNERSHIP
- PLAY_PROPERTY_TRANSACTION
- PLAY_IDEMPOTENCY_LOGS
- PLAY_DECISION_LOG

의 실제 필드와 상태 전이 규칙을 기준으로 테스트한다.

문서와 코드가 다르면 임의로 하나를 선택하지 말고 차이를 기록한다.

---

# 3. P17-A — Price-Time Priority

## 목적

Secondary Order Book의 체결 우선순위가 실제 구현에서 정확히 작동하는지 검증한다.

## 3.1 SELL Price Priority

동일 property에 SELL 주문 3개를 생성한다.

예:

- SELL A = 1,000,000,000 KRW
- SELL B = 980,000,000 KRW
- SELL C = 990,000,000 KRW

이후 충분한 자금을 가진 BUY 주문을 생성한다.

### 기대 결과

가장 낮은 SELL 가격인:

> SELL B = 980,000,000 KRW

가 먼저 체결되어야 한다.

---

## 3.2 BUY Price Priority

동일 property에 BUY 주문 3개를 생성한다.

예:

- BUY A = 980,000,000 KRW
- BUY B = 1,000,000,000 KRW
- BUY C = 990,000,000 KRW

이후 SELL 주문을 생성한다.

### 기대 결과

가장 높은 BUY 가격인:

> BUY B = 1,000,000,000 KRW

가 먼저 체결되어야 한다.

---

## 3.3 SELL Time Priority

동일 property에 동일 가격의 SELL 주문을 3개 생성한다.

순서:

1. SELL A
2. SELL B
3. SELL C

동일 가격으로 BUY 주문을 실행한다.

### 기대 결과

A → B → C 순서로 체결되어야 한다.

---

## 3.4 BUY Time Priority

동일 property에 동일 가격의 BUY 주문을 3개 생성한다.

순서:

1. BUY A
2. BUY B
3. BUY C

동일 가격의 SELL 주문을 실행한다.

### 기대 결과

A → B → C 순서로 체결되어야 한다.

---

## 3.5 검증 Evidence

각 테스트에 대해 다음을 기록한다.

- order_id
- player_id
- property_id
- order type
- price
- created_at / sequence
- matched order_id
- transaction_id
- 최종 체결 순서

단순히 "PASS"라고 기록하지 않는다.

---

# 4. P20-A — Concurrent Secondary Matching

## 목적

동일 property에 대한 동일 또는 경쟁 주문을 여러 matching worker가 동시에 처리해도 **중복 체결이 발생하지 않는지** 검증한다.

## 4.1 기본 조건

하나의 SELL 주문과 하나 이상의 BUY 주문을 준비한다.

동일한 matching target에 대해 5~10개의 matching worker/request를 동시에 실행한다.

가능하면 실제 Cloud Tasks/Cloud Functions 실행 경로를 사용한다.

---

## 4.2 검증해야 할 결과

정확히 하나의 체결만 발생해야 한다.

### 성공 조건

- transaction = 1
- ownership transfer = 1
- seller property sale = 1
- buyer property acquisition = 1
- fee application = 1
- Decision Log = canonical action 기준 1회
- original order = FILLED/SOLD 등 실제 상태로 1회 전이
- duplicate active ownership = 0
- duplicate transaction = 0

---

## 4.3 추가 경쟁 조건

다음도 테스트한다.

### Case A
동일 BUY를 5개 worker가 동시에 match

### Case B
동일 SELL을 5개 worker가 동시에 match

### Case C
동일 BUY/SELL pair를 10개 worker가 동시에 match

### Case D
match와 cancel이 거의 동시에 실행

### Case E
새로운 competing order가 match 직전에 생성

각 결과에서 데이터 무결성을 확인한다.

---

# 5. P22-A — Crash → Retry → Recovery

## 목적

단순 Firestore transaction rollback뿐 아니라 실제 거래 처리 과정에서 worker가 실패하고 재시도되는 상황을 검증한다.

## 5.1 Failure Injection

가능한 범위에서 다음 위치에 의도적 failure를 넣는다.

### Case A
매칭 transaction 시작 후 실패

### Case B
transaction commit 직전 failure

### Case C
transaction commit 이후 응답 전에 worker failure

### Case D
retry 직전 worker failure

### Case E
동일 task/request가 중복 전달

---

## 5.2 기대 결과

retry 후 최종적으로:

- 거래 중복 없음
- ownership 중복 없음
- cash 중복 차감 없음
- fee 중복 적용 없음
- lock 누수 없음
- active order 상태 정상
- transaction history 정상
- decision log 중복 없음
- reconciliation PASS

이어야 한다.

---

## 5.3 반드시 Before/After 비교

Failure 전:

- buyer cash
- seller cash
- buyer locked cash
- seller ownership
- order status
- transaction count
- decision log count

Failure 직후:

- 동일 항목

Retry 후:

- 동일 항목

을 비교한다.

단순 log message만으로 PASS 처리하지 않는다.

---

# 6. P23-A — Full Property Lifecycle E2E

## 목적

개별 함수의 정상 동작이 아니라 Property Market 전체 lifecycle이 하나의 경제적 흐름으로 연결되는지 확인한다.

## 6.1 전체 흐름

다음 순서로 실제 테스트를 수행한다.

### Step 1
Season initialization

### Step 2
Player A Primary property purchase

### Step 3
Ownership 생성 확인

### Step 4
Player A SELL order 생성

### Step 5
Property lock 확인

### Step 6
Player B BUY order 생성

### Step 7
Buyer cash lock 확인

### Step 8
Matching 실행

### Step 9
Transaction 생성

### Step 10
매수 수수료 2% 확인

### Step 11
매도 수수료 1.5% 확인

### Step 12
Player A ownership → SOLD

### Step 13
Player B active ownership 생성

### Step 14
BUY/SELL order 종료 상태 확인

### Step 15
Decision Log 확인

### Step 16
Reconciliation 실행

---

# 7. Full Lifecycle Invariants

전체 lifecycle 종료 후 반드시 확인한다.

## Cash

`cash_total = cash_available + cash_locked`

`cash_total >= 0`

## Buyer

- property_count 증가
- ownership active
- locked cash 해제
- transaction 1회

## Seller

- ownership SOLD
- property lock 해제
- sale proceeds 반영
- transaction 1회

## Orders

- BUY order 정상 종료
- SELL order 정상 종료
- active orphan order 없음

## Transaction

- canonical transaction 1개
- 동일 property / buyer / seller / price / order 조합의 duplicate transaction 없음

## Decision Log

- 실제 경제 action과 일치
- duplicate action 없음

## Reconciliation

전체 상태가 정상이어야 한다.

---

# 8. 실제 Firebase/GCP 환경 검증

가능하면 마지막 네 테스트 중 최소 P20-A와 P22-A는 실제 Firebase/GCP 환경에서 실행한다.

확인 대상:

- Firestore Transaction
- Cloud Functions 2nd Gen
- Cloud Tasks
- internal authentication
- retry
- concurrent invocation

별도 검증 Season을 사용하여 Production 데이터에 영향을 주지 않는다.

Firebase Emulator만 사용한 결과와 실제 Firebase/GCP 결과를 동일하다고 가정하지 않는다.

---

# 9. Regression Test

이번 테스트에서 수정이 발생하면 기존 핵심 테스트도 다시 실행한다.

최소:

- P12 Primary Purchase Concurrency
- P13 BUY Lock
- P14 SELL Lock
- P15 Cancellation
- P16 Atomic Matching
- P18 Idempotency
- P19 Worker Retry
- P21 Reconciliation

그리고 이번 최종 테스트:

- P17-A
- P20-A
- P22-A
- P23-A

를 다시 수행한다.

---

# 10. Stop Conditions

다음 중 하나라도 발생하면 PLAY-07.2 최종 완료 판정을 중지한다.

- duplicate transaction
- duplicate ownership
- duplicate economic effect
- cash invariant violation
- lock leakage
- incorrect price priority
- incorrect time priority
- concurrent matching double execution
- cancel/match race condition으로 잘못된 상태 발생
- retry 후 중복 처리
- fee double charging
- ownership transfer 중복
- reconciliation 미검출
- 실제 Firebase/GCP와 Emulator 결과 차이
- security/authentication bypass
- test를 통과시키기 위한 logic weakening
- synthetic data 사용
- 증거가 부족하여 결과를 판단할 수 없음

---

# 11. Evidence Standard

각 테스트는 다음 구조로 보고한다.

### Test ID

### 목적

### Environment

### Input

### Execution

### Expected State

### Actual State

### Before Snapshot

### Failure/Retry 여부

### After Snapshot

### Transaction Evidence

### Order Evidence

### Ownership Evidence

### Decision Log Evidence

### Reconciliation Evidence

### Result

`PASS / FAIL / BLOCKED`

단순히 "정상 동작 확인"이라고 작성하지 않는다.

---

# 12. 최종 판정

## READY FOR PLAY-07.3

다음 조건을 모두 만족할 때만 사용한다.

- P17-A PASS
- P20-A PASS
- P22-A PASS
- P23-A PASS
- 필요한 경우 Regression Test PASS
- 알려진 데이터 무결성/거래 무결성 문제 없음
- 핵심 결과에 충분한 evidence 존재

## READY AFTER FIXES

문제가 발견되었지만 수정 후 동일 테스트와 regression test가 모두 PASS한 경우.

## BLOCKED

핵심 transaction integrity / concurrency / idempotency / ownership / cash invariant 문제 해결이 안 된 경우.

## NOT READY

테스트가 충분히 실행되지 않았거나 evidence가 부족한 경우.

---

# 13. 최종 원칙

이번 검증이 마지막 검증이다.

따라서 **문제를 찾지 않는 것을 목표로 하지 않는다.**

문제가 발견되면 그 문제를 수정하고 다시 검증한다.

반대로 네 가지 테스트가 충분한 evidence와 함께 통과하고 regression까지 통과한다면, 그 시점에서는 PLAY-07.2 Property Market Engine에 대해 추가적인 반복 검증을 계속하기보다 PLAY-07.3으로 진행한다.

핵심 질문은 하나다.

> **동일한 경제 세계에서 수많은 player와 worker가 동시에 움직이고, 요청이 중복되고, worker가 실패하고, retry가 발생해도 하나의 property가 두 번 팔리거나 돈이 두 번 움직이거나 경제적 상태가 오염되지 않는가?**

이 질문에 대한 실제 evidence를 확보하는 것이 본 문서의 최종 목적이다.
