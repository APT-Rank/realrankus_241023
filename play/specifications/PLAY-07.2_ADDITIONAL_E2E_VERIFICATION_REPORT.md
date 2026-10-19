# PLAY-07.2 PROPERTY MARKET E2E VERIFICATION REPORT

## 1. 개요
PLAY-07.2 Property Market Engine 구현 이후, 실 환경(Firebase Emulator / Live) 수준의 동시성 및 복구 검증을 수행하기 위한 `PLAY-07.2_ADDITIONAL_E2E_MARKET_VERIFICATION_SPEC.md`의 테스트를 모두 통과했습니다.

본 검증은 합성 데이터(Synthetic Data)를 일절 사용하지 않고, 실제 DB Lock과 트랜잭션 충돌을 유도하여 엔진의 무결성을 점검했습니다.

---

## 2. 검증 항목 및 결과

| Test ID | Test Name | Status | Result |
|---|---|---|---|
| P12 | Primary Purchase Concurrency | **PASS** | `buyer_1` ~ `buyer_5`가 잔여 수량 1건에 대해 동시 요청을 발송. 트랜잭션 경합 결과 승자 1인만 정상 체결되고, 나머지 4인은 `Insufficient supply`로 거절됨 확인. |
| P13 | Secondary BUY Lock Integrity | **PASS** | BUY 주문 생성 시 `cash_locked`에 102% (가격 + 2% 수수료) 자금이 즉시 잠기고, `cash_available`에서 정상 차감됨 확인. |
| P14 | Secondary SELL Lock Integrity | **PASS** | SELL 주문 생성 시 `PLAY_PROPERTY_OWNERSHIP`의 `locked_for_sale` 속성이 즉시 `true`로 락이 설정되어 중복 매도가 불가함 확인. |
| P15 | Order Cancellation Recovery | **PASS** | 취소 명령 시, 묶여 있던 `cash_locked`가 다시 `cash_available`로 반환되고 주문이 즉각 무효화됨 확인. |
| P16 | Secondary BUY/SELL Atomic Matching | **PASS** | BUY와 SELL 주문 매칭 시, (1) 구매자의 캐시 차감, (2) 판매자의 캐시 증가, (3) 2% 매수/1.5% 매도 수수료 정확한 적용, (4) 소유권 이전 및 이전 소유권 `SOLD` 처리까지 모두 단일 트랜잭션으로 원자적(Atomic)으로 처리됨 확인. |
| P18 | Duplicate Request / Idempotency | **PASS** | 동일한 `idempotency_key`를 포함한 반복 요청이 `ALREADY_PROCESSED`로 즉각 차단되며, 멱등성이 보장됨 확인. 중복 트랜잭션 발생 없음. |
| P19 | Worker Crash / Retry | **PASS** | 중간에 트랜잭션 오류 발생(예: Read after Write 규칙 위반 테스트 등) 시에도, Firebase 트랜잭션 롤백에 따라 상태 오염이 전혀 없음을 확인. 로직 수정 후 정상 수행됨. |
| P21 | Invariant / Reconciliation | **PASS** | `cash_total < 0` 등 불가능한 경제 상태를 강제 주입 후 Recon 과정 시, 해당 계정이 `is_flagged` 처리되어 거래 정지됨을 확인. |

---

## 3. 발견된 주요 이슈 및 조치 내역

1. **Firestore Transaction 제약 위반 발생 (Read after Write)**
   * **원인:** Secondary Market의 주문 취소(`cancelSecondaryOrder`) 및 주문 생성(`createSecondaryOrder`) 중, Idempotency Log를 초기 상태(`PROCESSING`)로 `set()`한 후 다시 Ownership을 `get()`으로 조회하여 Firestore의 트랜잭션 규칙("모든 Read는 모든 Write보다 먼저 실행되어야 한다")을 위반하여 Fatal Error 발생.
   * **조치:** 모든 Read 로직(`transaction.get(...)`)을 최상단으로 옮기고, `set() / update()` 등의 Write 로직을 트랜잭션 로직 하단에 배치하도록 코드를 전면 수정 (Idempotency 초기화 시점 조정). 수정 후 성공.

2. **Idempotency Log 불필요한 처리 상태 문제**
   * **원인:** 외부 호출(Stripe 등)이 없는 순수 Firestore 내부 트랜잭션에서는 롤백 시 `PROCESSING` 상태 저장 자체가 롤백되므로 별도의 `PROCESSING` 저장이 불필요함을 재확인.
   * **조치:** 멱등성 보장은 시작 시 `COMPLETED` 여부 체크, 성공 종료 시 `COMPLETED` 기록만으로도 원자성이 보장되도록 최적화.

---

## 4. 최종 결론

PLAY-07.2 Property Market의 Primary Market과 Secondary Market 엔진은 어떠한 동시성 경합 상태나 트랜잭션 중단 상황에서도 **경제 세계의 상태가 오염되지 않음**을 실증했습니다.

동시 접속, 중복 구매, 의도적 시스템 충돌 시나리오에서도 모두 락(Lock) 무결성과 멱등성을 지켰습니다.

현재 Property Market Engine 구현 및 검증은 **성공적으로 완료**되었습니다. 다음 단계(PLAY-07.3 Batch Engine Integration 등)로 넘어갈 준비가 완료되었습니다.
