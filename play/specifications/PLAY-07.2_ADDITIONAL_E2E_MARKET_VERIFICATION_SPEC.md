# PLAY-07.2 ADDITIONAL E2E MARKET VERIFICATION SPEC

## 1. 목적

PLAY-07.2 Property Market의 현재 구현 결과를 단순한 구조/단위 테스트 수준에서 종료하지 않고, 실제 시장행동 흐름에서 데이터 무결성, 원자성, 동시성, 재시도, Idempotency, Lock, Ownership, Transaction, Decision Log, Reconciliation이 끝까지 유지되는지 검증한다.

이번 검증의 목표는 "PASS를 많이 만드는 것"이 아니라, **실패 가능한 상황을 의도적으로 발생시켜도 경제 세계의 상태가 오염되지 않는지 확인하는 것**이다.

최종적으로 다음 조건을 만족해야만 PLAY-07.2를 다음 단계로 종료한다.

> 정상 흐름 + 동시성 + 중복 요청 + 중간 실패 + 재시도 + 취소 + 매칭 + 복구 + Reconciliation에서 데이터 무결성이 유지된다.

---

## 2. 현재 검증 결과의 전제

현재까지 확인된 핵심 결과:

- CSV 209건 → Property Master 209건
- NORMAL 200건
- INCOMPLETE 9건
- INCOMPLETE는 `initial_price = null`, `tradable = false`
- Primary Supply는 200 NORMAL property에 생성
- `PRIMARY_SUPPLY_RATIO = 0.05`는 현재 테스트 설정값이며 경제 설계의 최종 확정값으로 간주하지 않는다.
- 데이터 ingestion / status allocation / primary initialization / TypeScript compilation은 기존 검증에서 PASS.

이번 검증에서는 위 결과를 다시 변경하지 않고, **Property Market transaction layer를 집중 검증**한다.

---

## 3. 검증 원칙

### 3.1 PASS보다 실패 안전성을 우선

다음 질문에 답할 수 있어야 한다.

- 요청이 두 번 들어오면 어떻게 되는가?
- Worker가 transaction 중간에 죽으면 어떻게 되는가?
- 같은 주문이 두 Worker에게 동시에 전달되면 어떻게 되는가?
- BUY와 SELL이 동시에 같은 property를 대상으로 하면 어떻게 되는가?
- lock은 언제 생기고 언제 반드시 풀리는가?
- transaction은 1번만 생성되는가?
- ownership은 정확히 한 번만 이전되는가?
- cash_total과 available/locked cash가 항상 일치하는가?
- reconciliation이 실제 오류를 발견할 수 있는가?
- 실패 후 retry가 정상적으로 원상복구/완료시키는가?

### 3.2 임의 수정 금지

검증 중 오류가 발견되면 먼저:

1. 실패 재현
2. 원인 분석
3. 영향 범위 확인
4. 수정안 작성
5. 수정 후 동일 테스트 재실행

순서로 진행한다.

PASS를 만들기 위해 테스트 조건이나 검증 코드를 약화시키지 않는다.

### 3.3 No Synthetic Data

가격/거래/자산 상태를 임의로 보정하지 않는다.

특히:

- `last_sales`
- 다른 면적의 가격
- 평균가격
- 추정가격
- 0 KRW
- 임의의 transaction 생성

을 검증 편의를 위해 사용하지 않는다.

---

# 4. 테스트 범위

## P12 Primary Purchase Concurrency

### 목적
동일 Primary Supply에 여러 사용자가 동시에 구매 요청할 때 공급량이 1이면 정확히 한 명만 성공해야 한다.

### 조건
- 동일 property
- supply = 1
- 구매 요청 5~10건 동시 발생

### 기대
- 성공 = 1
- 실패 = N-1
- ownership = 1
- transaction = 1
- supply remaining = 0
- cash deduction = 성공자에게만 1회
- 실패자 cash 변화 = 0

---

# 5. Secondary BUY Lock

## P13 BUY Lock Integrity

### 검증
BUY 주문 생성 시:

`cash_available` 감소
`cash_locked` 증가
`cash_total` 불변

이어야 한다.

### Invariant

`cash_total = cash_available + cash_locked`

는 주문 전/후 항상 성립해야 한다.

---

# 6. Secondary SELL Lock

## P14 SELL Lock Integrity

SELL 주문 생성 시:

- 해당 ownership이 정확히 하나의 활성 SELL 주문에만 연결
- ownership 중복 lock 금지
- 매도 대상 property를 동시에 다른 SELL에 등록 불가
- 취소 시 ownership lock 정확히 해제

---

# 7. Cancel Recovery

## P15 Order Cancellation

### BUY
취소 후:

`cash_locked → cash_available`

정확히 복구되어야 한다.

### SELL
취소 후:

ownership lock이 해제되어야 한다.

### 기대
취소 전후 `cash_total`, ownership 수, property count가 불필요하게 변하지 않는다.

---

# 8. Secondary Matching Atomicity

## P16 BUY/SELL Match

동일 property에 대해 BUY와 SELL이 매칭될 때 하나의 원자적 transaction으로 처리되어야 한다.

검증 대상:

- buyer cash
- buyer locked cash
- seller ownership
- seller property count
- buyer property count
- transaction
- fee
- decision log
- order status

중 하나라도 일부만 반영되어서는 안 된다.

---

# 9. Price Priority

## P17 Price-Time Priority

동일 property에 대해:

### BUY
가격이 높은 주문 우선.

동일 가격이면 먼저 들어온 주문 우선.

### SELL
가격이 낮은 주문 우선.

동일 가격이면 먼저 들어온 주문 우선.

실제 matching 결과로 검증한다.

---

# 10. Duplicate Request / Idempotency

## P18 Duplicate Transaction Request

동일 request_id 또는 동일 transaction idempotency key를:

- 동시에 2회
- 순차적으로 2회
- retry 상황에서 반복

전송한다.

### 기대

경제적 효과는 정확히 1회만 발생한다.

예:

- cash deduction = 1회
- ownership transfer = 1회
- transaction record = 1회
- decision log = 1회

---

# 11. Worker Crash / Retry

## P19 Mid-Transaction Failure

거래 처리 중간 단계에서 의도적으로 worker failure를 발생시킨다.

최소 다음 지점에서 테스트한다.

1. transaction commit 직전
2. transaction commit 직후 response 이전
3. transaction 기록 생성 이후 후속 작업 직전
4. decision log 생성 전/후

### 기대

retry 이후:

- 중복 거래 없음
- 중복 ownership 없음
- 중복 cash deduction 없음
- lock 누수 없음
- 최종 상태가 정상 완료 또는 안전한 실패 상태

---

# 12. Concurrent Matching

## P20 Concurrent Matching

같은 BUY/SELL pair 또는 같은 property에 대해 여러 matching worker를 동시에 실행한다.

### 기대

- 하나의 실제 체결만 발생
- 동일 ownership이 두 buyer에게 넘어가지 않음
- seller가 두 번 팔리지 않음
- buyer cash가 두 번 차감되지 않음
- transaction 중복 없음

---

# 13. Reconciliation Fault Injection

## P21 Reconciliation Detection

검증용 환경에서 의도적으로 다음 오류를 주입한다.

1. `cash_total != cash_available + cash_locked`
2. 존재하지 않는 property ownership
3. 동일 property의 중복 active ownership
4. active order인데 lock 없음
5. lock은 있으나 active order 없음
6. transaction은 있으나 ownership transfer 없음
7. decision log와 transaction 불일치
8. NORMAL이 아닌 property의 active primary supply
9. INCOMPLETE property의 tradable=true
10. supply count 불일치

### 기대

Reconciliation이 각 오류를 검출해야 한다.

검출하지 못하는 오류가 있다면 READY 판정을 중지한다.

---

# 14. Recovery Test

## P22 Failed Transaction Recovery

실패 상태를 만든 후 retry/recovery를 실행한다.

검증:

- 정상 상태로 복구되는가?
- 중복 데이터가 생기지 않는가?
- lock이 남지 않는가?
- transaction history가 왜곡되지 않는가?
- decision log가 중복되지 않는가?

---

# 15. Full Scenario Test

## P23 End-to-End Property Lifecycle

최소 2명 이상의 player로 다음 전체 흐름을 실행한다.

1. Season initialization
2. Primary property purchase
3. Ownership 생성
4. Secondary SELL
5. Secondary BUY
6. BUY lock
7. SELL lock
8. Matching
9. Fee 적용
10. Ownership transfer
11. Order 종료
12. Decision Log
13. Reconciliation

최종 상태에서 모든 invariant가 만족되어야 한다.

---

# 16. Invariants

모든 테스트에서 다음 invariant를 검사한다.

### Cash

`cash_total = cash_available + cash_locked`

`cash_total >= 0`

### Ownership

동일 property에 active ownership이 허용된 구조보다 많아서는 안 된다.

### Order

활성 BUY 주문의 locked cash는 정확히 존재해야 한다.

활성 SELL 주문의 property lock은 정확히 존재해야 한다.

### Transaction

하나의 실제 체결은 하나의 canonical transaction으로 기록되어야 한다.

### Decision Log

경제적 action과 Decision Log가 일치해야 한다.

### Property Master

`Property Master = CSV 209`

`NORMAL = 200`

`INCOMPLETE = 9`

### INCOMPLETE

`tradable = false`

`initial_price = null`

Primary Supply 대상이 될 수 없다.

---

# 17. 실제 Firebase/GCP E2E

가능하다면 local simulation과 별도로 실제 개발/검증 Firebase/GCP 환경에서 최소 1회 수행한다.

확인 대상:

- Firebase Auth
- Firestore Transaction
- Cloud Functions 2nd Gen
- Cloud Tasks
- internal authentication
- retry
- concurrent request
- Firestore consistency

실제 Production 데이터에 영향을 주지 않는 별도 검증 Season을 사용한다.

---

# 18. Evidence Requirement

각 테스트마다 단순히 PASS라고 쓰지 않는다.

반드시 다음을 기록한다.

- Test ID
- 입력 조건
- 실행 방법
- 실행 횟수
- 예상 결과
- 실제 결과
- 관련 document ID
- 관련 transaction ID
- 관련 order ID
- 관련 ownership ID
- 관련 player ID
- before state
- after state
- 오류/exception
- retry 횟수
- reconciliation 결과

가능하면 실제 Firestore document snapshot 또는 검증 가능한 로그를 남긴다.

---

# 19. Stop Conditions

다음 중 하나라도 발생하면 READY 판정을 중지한다.

- 중복 transaction
- 중복 ownership
- cash invariant 위반
- lock 누수
- retry 후 중복 경제효과
- concurrent matching 오류
- reconciliation이 의도된 오류를 검출하지 못함
- 실제 Firebase/GCP와 local 결과가 다름
- Security/Authorization 우회 가능성
- 테스트를 통과시키기 위해 검증 코드를 약화한 흔적
- synthetic price/data가 사용됨

---

# 20. Final Verdict 기준

최종 판정은 다음 중 하나만 사용한다.

### READY FOR PLAY-07.3
P12~P23 및 실제 E2E 핵심 테스트가 모두 통과하고, 알려진 데이터 무결성/거래 무결성 문제가 없음.

### READY AFTER FIXES
문제가 발견되었으나 원인이 명확하고 수정 후 재검증이 필요한 상태.

### BLOCKED
데이터/경제 규칙/거래 원자성/Idempotency/Security 등 핵심 구조에 해결되지 않은 문제가 존재.

### NOT READY
테스트 범위 또는 증거가 부족하여 안전성을 판단할 수 없는 상태.

---

# 21. 중요한 판단 원칙

이번 검증의 목적은 PLAY-07.2를 빨리 끝내는 것이 아니다.

**향후 수천~수만 명의 player가 동일한 경제 세계에서 행동할 때 한 번 발생한 오류가 경제 세계 전체를 오염시키지 않는지 확인하는 것**이 목적이다.

따라서 "코드가 있다", "컴파일된다", "한 번 실행된다"는 충분한 증거가 아니다.

**실패 → 재시도 → 동시성 → 복구 → 재검증까지 통과해야 한다.**

문제가 발견되면 다음 단계로 진행하지 말고 그 자리에서 중단한다.
